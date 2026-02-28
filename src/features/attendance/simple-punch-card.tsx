'use client';

import { useState, useEffect } from 'react';
import { useAttendanceStore } from '@/lib/attendance-store';
import { useCompanySettingsStore } from '@/lib/store/company-settings-store';
import { useUserStore } from '@/lib/store/user-store';
import { useDailyReportStore, type TemplateForClockOut, type ReportFieldValue } from '@/lib/store/daily-report-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  LogIn,
  LogOut,
  Coffee,
  Play,
  Building2,
  Home,
} from 'lucide-react';
import { toast } from 'sonner';
import { LocationBadge } from '@/components/attendance/location-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { DailyReportFormDialog } from '@/features/daily-report/daily-report-form';

type WorkLocation = 'office' | 'home' | 'client' | 'other';

export function SimplePunchCard() {
  // SSR/CSRハイドレーション対応: 初期値はnull、マウント後に設定
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [showMemoDialog, setShowMemoDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [memo, setMemo] = useState('');
  const [workLocation, setWorkLocation] = useState<WorkLocation>('office');

  // Zustand stores
  const {
    todayStatus,
    checkIn,
    startBreak,
    endBreak,
    checkOut,
    checkAndResetForNewDay,
    checkAndResetForUserChange,
    resetTodayStatus,
  } = useAttendanceStore();

  const { attendanceSettings } = useCompanySettingsStore();
  const requireLocation = attendanceSettings?.requireLocationOnCheckIn ?? false;

  // ユーザー情報を取得（同一PC複数ユーザー対応）
  const { currentUser } = useUserStore();
  const currentUserId = currentUser?.id;
  const tenantId = currentUser?.tenantId;

  // 日報連動
  const { setTenantId: setReportTenantId, getTemplateForEmployee, createReport } = useDailyReportStore();
  const [reportTemplate, setReportTemplate] = useState<TemplateForClockOut | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);

  // Check for day change on mount and every minute
  useEffect(() => {
    checkAndResetForNewDay();
    const dateCheckTimer = setInterval(() => {
      checkAndResetForNewDay();
    }, 60000);
    return () => clearInterval(dateCheckTimer);
  }, [checkAndResetForNewDay]);

  // Check for user change (同一PC複数ユーザー対応)
  useEffect(() => {
    if (currentUserId) {
      checkAndResetForUserChange(currentUserId);
    }
  }, [currentUserId, checkAndResetForUserChange]);

  // 日報テンプレート取得
  useEffect(() => {
    if (tenantId && currentUserId) {
      setReportTenantId(tenantId);
      getTemplateForEmployee(currentUserId).then(setReportTemplate);
    }
  }, [tenantId, currentUserId, setReportTenantId, getTemplateForEmployee]);

  // Update clock every second（マウント後に初期化）
  useEffect(() => {
    setCurrentTime(new Date()); // 初回設定
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Button states
  const canCheckIn = todayStatus.status === 'notStarted' || todayStatus.status === 'finished';
  const canStartBreak = todayStatus.status === 'working';
  const canEndBreak = todayStatus.status === 'onBreak';
  const canCheckOut = todayStatus.status === 'working' || todayStatus.status === 'onBreak';

  const handleCheckIn = () => {
    if (requireLocation) {
      setShowLocationDialog(true);
    } else {
      confirmCheckIn();
    }
  };

  const confirmCheckIn = async () => {
    // If coming from finished state, reset first for multiple check-ins
    if (todayStatus.status === 'finished') {
      resetTodayStatus();
    }
    await checkIn(workLocation);
    setShowLocationDialog(false);
    const time = (currentTime || new Date()).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    toast.success(`出勤打刻完了: ${time}`, {
      description: requireLocation ? `勤務場所: ${getLocationLabel(workLocation)}` : undefined,
    });
  };

  const handleBreakStart = async () => {
    await startBreak();
    const time = (currentTime || new Date()).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    toast.success(`休憩開始: ${time}`);
  };

  const handleBreakEnd = async () => {
    await endBreak();
    const time = (currentTime || new Date()).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    toast.success(`休憩終了: ${time}`);
  };

  const handleCheckOut = () => {
    // 日報テンプレートの提出ルールに応じて分岐
    if (reportTemplate?.submissionRule === 'required_on_clockout') {
      // 退勤時必須: 日報フォームを先に表示
      setShowReportForm(true);
    } else {
      // その他: 通常のメモダイアログ
      setShowMemoDialog(true);
    }
  };

  const confirmCheckOut = async () => {
    await checkOut(memo);
    setShowMemoDialog(false);
    setMemo('');
    const time = (currentTime || new Date()).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    toast.success(`退勤打刻完了: ${time}`);

    // 退勤後催促: 日報記入を促す
    if (reportTemplate?.submissionRule === 'prompt_after_clockout') {
      toast.info('日報を記入してください', {
        description: 'サイドメニューの「日報」から記入できます',
        duration: 8000,
      });
    }
  };

  // 日報提出後に退勤を実行（required_on_clockout用）
  const handleReportSubmitThenCheckOut = async (values: ReportFieldValue[]) => {
    if (!currentUserId || !reportTemplate) return;
    const today = new Date().toISOString().split('T')[0];
    await createReport({
      employeeId: currentUserId,
      date: today,
      templateId: reportTemplate.id,
      status: 'submitted',
      values,
    });
    // 日報提出後に退勤実行
    await checkOut('');
    const time = (currentTime || new Date()).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    toast.success(`退勤打刻完了: ${time}`);
  };

  // 日報下書き保存（required_on_clockoutモードではキャンセル扱い、退勤しない）
  const handleReportDraft = async (values: ReportFieldValue[]) => {
    if (!currentUserId || !reportTemplate) return;
    const today = new Date().toISOString().split('T')[0];
    await createReport({
      employeeId: currentUserId,
      date: today,
      templateId: reportTemplate.id,
      status: 'draft',
      values,
    });
  };

  const getLocationLabel = (location: WorkLocation) => {
    const labels: Record<WorkLocation, string> = {
      office: 'オフィス',
      home: '在宅',
      client: '客先',
      other: 'その他',
    };
    return labels[location];
  };

  const timeString = (currentTime || new Date()).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateString = (currentTime || new Date()).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  // Calculate working hours
  const getWorkingHours = () => {
    if (!todayStatus.checkIn) return 0;
    const checkInTime = new Date(`2024-01-01 ${todayStatus.checkIn}`);
    const endTime = todayStatus.checkOut
      ? new Date(`2024-01-01 ${todayStatus.checkOut}`)
      : new Date(`2024-01-01 ${(currentTime || new Date()).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`);
    const diff = (endTime.getTime() - checkInTime.getTime()) / 1000 / 60 / 60;
    return Math.max(0, diff - todayStatus.totalBreakTime / 60);
  };

  return (
    <>
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6 space-y-6">
          {/* Time Display */}
          <div className="text-center">
            <div className="text-4xl font-bold font-mono tracking-wider">{timeString}</div>
            <div className="text-sm text-muted-foreground mt-1">{dateString}</div>
          </div>

          {/* 4 Punch Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              onClick={handleCheckIn}
              disabled={!canCheckIn}
              variant={canCheckIn ? 'default' : 'outline'}
              className={`h-16 flex flex-col items-center justify-center gap-1 ${
                canCheckIn ? 'bg-green-600 hover:bg-green-700' : ''
              }`}
              data-testid="check-in-button"
            >
              <LogIn className="h-5 w-5" />
              <span className="text-xs">出勤</span>
            </Button>

            <Button
              onClick={handleBreakStart}
              disabled={!canStartBreak}
              variant={canStartBreak ? 'default' : 'outline'}
              className={`h-16 flex flex-col items-center justify-center gap-1 ${
                canStartBreak ? 'bg-yellow-600 hover:bg-yellow-700' : ''
              }`}
              data-testid="break-start-button"
            >
              <Coffee className="h-5 w-5" />
              <span className="text-xs">休憩開始</span>
            </Button>

            <Button
              onClick={handleBreakEnd}
              disabled={!canEndBreak}
              variant={canEndBreak ? 'default' : 'outline'}
              className={`h-16 flex flex-col items-center justify-center gap-1 ${
                canEndBreak ? 'bg-blue-600 hover:bg-blue-700' : ''
              }`}
              data-testid="break-end-button"
            >
              <Play className="h-5 w-5" />
              <span className="text-xs">休憩終了</span>
            </Button>

            <Button
              onClick={handleCheckOut}
              disabled={!canCheckOut}
              variant={canCheckOut ? 'default' : 'outline'}
              className={`h-16 flex flex-col items-center justify-center gap-1 ${
                canCheckOut ? 'bg-red-600 hover:bg-red-700' : ''
              }`}
              data-testid="check-out-button"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-xs">退勤</span>
            </Button>
          </div>

          {/* Status Display - 複数打刻対応 */}
          {todayStatus.punchPairs && todayStatus.punchPairs.length > 0 ? (
            <div className="space-y-2">
              {todayStatus.punchPairs.map((pair, index) => (
                <div key={pair.order} className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground">
                        出勤{todayStatus.punchPairs!.length > 1 ? ` ${index + 1}` : ''}
                      </span>
                      {pair.checkIn?.location && (
                        <LocationBadge location={pair.checkIn.location} label="GPS" />
                      )}
                    </div>
                    <div className="text-xl font-semibold">
                      {pair.checkIn?.time || '--:--'}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground">
                        退勤{todayStatus.punchPairs!.length > 1 ? ` ${index + 1}` : ''}
                      </span>
                      {pair.checkOut?.location && (
                        <LocationBadge location={pair.checkOut.location} label="GPS" />
                      )}
                    </div>
                    <div className="text-xl font-semibold">
                      {pair.checkOut?.time || '--:--'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">出勤</span>
                  {todayStatus.checkInLocation && (
                    <LocationBadge location={todayStatus.checkInLocation} label="GPS" />
                  )}
                </div>
                <div className="text-xl font-semibold">
                  {todayStatus.checkIn || '--:--'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">退勤</span>
                  {todayStatus.checkOutLocation && (
                    <LocationBadge location={todayStatus.checkOutLocation} label="GPS" />
                  )}
                </div>
                <div className="text-xl font-semibold">
                  {todayStatus.checkOut || '--:--'}
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
            <div className="flex items-center gap-4">
              {todayStatus.status === 'onBreak' && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Coffee className="h-3 w-3 mr-1" />
                  休憩中 {todayStatus.breakStart && `(${todayStatus.breakStart}〜)`}
                </Badge>
              )}
              {todayStatus.totalBreakTime > 0 && (
                <span>休憩: {Math.floor(todayStatus.totalBreakTime)}分</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {todayStatus.checkIn && (
                <span>勤務: {getWorkingHours().toFixed(1)}h</span>
              )}
              {requireLocation && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  位置情報ON
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Selection Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>勤務場所を選択</DialogTitle>
            <DialogDescription>本日の勤務場所を選択してください</DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={workLocation}
            onValueChange={(v) => setWorkLocation(v as WorkLocation)}
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted">
                <RadioGroupItem value="office" id="office" />
                <Label htmlFor="office" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="h-4 w-4" />
                  オフィス勤務
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted">
                <RadioGroupItem value="home" id="home" />
                <Label htmlFor="home" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Home className="h-4 w-4" />
                  在宅勤務
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted">
                <RadioGroupItem value="client" id="client" />
                <Label htmlFor="client" className="flex items-center gap-2 cursor-pointer flex-1">
                  <MapPin className="h-4 w-4" />
                  客先勤務
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="flex items-center gap-2 cursor-pointer flex-1">
                  <MapPin className="h-4 w-4" />
                  その他
                </Label>
              </div>
            </div>
          </RadioGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocationDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={confirmCheckIn} data-testid="confirm-check-in-button">
              出勤する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-out Memo Dialog */}
      <Dialog open={showMemoDialog} onOpenChange={setShowMemoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>退勤処理</DialogTitle>
            <DialogDescription>
              業務メモを残すことができます（任意）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="本日の業務内容、引き継ぎ事項など..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
            />
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">勤務時間:</span>
                <span className="font-medium">{getWorkingHours().toFixed(1)}時間</span>
              </div>
              {todayStatus.totalBreakTime > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">休憩時間:</span>
                  <span className="font-medium">{Math.floor(todayStatus.totalBreakTime)}分</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMemoDialog(false)}>
              キャンセル
            </Button>
            <Button
              onClick={confirmCheckOut}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-check-out-button"
            >
              退勤する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 日報フォーム（退勤時必須モード） */}
      {reportTemplate && (
        <DailyReportFormDialog
          open={showReportForm}
          onOpenChange={(open) => {
            setShowReportForm(open);
          }}
          templateName={`${reportTemplate.name} - 退勤時日報`}
          fields={reportTemplate.fields}
          onSaveDraft={handleReportDraft}
          onSubmit={handleReportSubmitThenCheckOut}
          submitOnly={reportTemplate.submissionRule === 'required_on_clockout'}
          description="日報を提出すると退勤が確定します"
        />
      )}
    </>
  );
}
