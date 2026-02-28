'use client';

import { useState, useEffect } from 'react';
import { useAttendanceStore } from '@/lib/attendance-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Coffee,
  Home,
  Building2,
  AlertTriangle,
  Wifi,
  Activity
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
import { Progress } from '@/components/ui/progress';
import { useUserStore } from '@/lib/store/user-store';
import { useDailyReportStore, type TemplateForClockOut, type ReportFieldValue } from '@/lib/store/daily-report-store';
import { DailyReportFormDialog } from '@/features/daily-report/daily-report-form';

interface TimeRecord {
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalBreakTime: number;
  workLocation: 'office' | 'home' | 'client' | 'other';
  memo?: string;
}

export function AdvancedCheckIn() {
  // SSR/CSRハイドレーション対応: 初期値はnull、マウント後に設定
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [showMemoDialog, setShowMemoDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [memo, setMemo] = useState('');
  const [workLocation, setWorkLocation] = useState<TimeRecord['workLocation']>('office');
  const [workingHours, setWorkingHours] = useState(0);
  
  // Zustand store の使用
  const {
    todayStatus,
    checkIn,
    startBreak,
    endBreak,
    checkOut,
    checkAndResetForNewDay
  } = useAttendanceStore();

  // ユーザー情報・日報連動
  const { currentUser } = useUserStore();
  const currentUserId = currentUser?.id;
  const tenantId = currentUser?.tenantId;
  const { setTenantId: setReportTenantId, getTemplateForEmployee, createReport } = useDailyReportStore();
  const [reportTemplate, setReportTemplate] = useState<TemplateForClockOut | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);

  // 日報テンプレート取得
  useEffect(() => {
    if (tenantId && currentUserId) {
      setReportTenantId(tenantId);
      getTemplateForEmployee(currentUserId).then(setReportTemplate);
    }
  }, [tenantId, currentUserId, setReportTenantId, getTemplateForEmployee]);

  // 初回マウント時と1分ごとに日付変更をチェック
  useEffect(() => {
    // 初回チェック
    checkAndResetForNewDay();

    // 1分ごとに日付変更をチェック
    const dateCheckTimer = setInterval(() => {
      checkAndResetForNewDay();
    }, 60000);

    return () => clearInterval(dateCheckTimer);
  }, [checkAndResetForNewDay]);

  // 1秒ごとに時刻を更新（マウント後に初期化）
  useEffect(() => {
    setCurrentTime(new Date()); // 初回設定
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // 勤務時間を計算
      if (todayStatus.checkIn && !todayStatus.checkOut) {
        const checkInTime = new Date(`2024-01-01 ${todayStatus.checkIn}`);
        const now = new Date(`2024-01-01 ${(currentTime || new Date()).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`);
        const diff = (now.getTime() - checkInTime.getTime()) / 1000 / 60 / 60; // hours
        setWorkingHours(Math.max(0, diff - todayStatus.totalBreakTime / 60));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [todayStatus, currentTime]);

  const handleCheckIn = () => {
    setShowLocationDialog(true);
  };

  const confirmCheckIn = async () => {
    await checkIn(workLocation);
    setShowLocationDialog(false);
    const time = (currentTime || new Date()).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    toast.success(`出勤打刻完了: ${time}`, {
      description: `勤務場所: ${getLocationLabel(workLocation)}`
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
    if (reportTemplate?.submissionRule === 'required_on_clockout') {
      setShowReportForm(true);
    } else {
      setShowMemoDialog(true);
    }
  };

  // 日報提出後に退勤（required_on_clockout用）
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
    await checkOut('');
    const time = (currentTime || new Date()).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    toast.success(`退勤打刻完了: ${time}`);
  };

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

  const confirmCheckOut = async () => {
    await checkOut(memo);
    setShowMemoDialog(false);
    const time = (currentTime || new Date()).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    if (reportTemplate?.submissionRule === 'prompt_after_clockout') {
      toast.info('日報を記入してください', {
        description: 'サイドメニューの「日報」から記入できます',
        duration: 8000,
      });
    }
    toast.success(`退勤打刻完了: ${time}`, {
      description: '今日もお疲れ様でした！'
    });
  };

  const getLocationLabel = (location: TimeRecord['workLocation']) => {
    const labels = {
      office: 'オフィス',
      home: '在宅',
      client: '客先',
      other: 'その他'
    };
    return labels[location];
  };

  const getLocationIcon = (location: TimeRecord['workLocation']) => {
    const icons = {
      office: Building2,
      home: Home,
      client: MapPin,
      other: MapPin
    };
    const Icon = icons[location];
    return <Icon className="h-4 w-4" />;
  };

  const timeString = (currentTime || new Date()).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const dateString = (currentTime || new Date()).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  // 標準勤務時間（8時間）に対する進捗
  const workProgress = Math.min(100, (workingHours / 8) * 100);

  return (
    <>
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Clock className="h-6 w-6" />
                勤怠打刻システム
              </CardTitle>
              <CardDescription className="text-blue-100">
                {dateString}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold font-mono">{timeString}</div>
              <div className="text-sm text-blue-100">現在時刻</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* ステータス表示 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">出勤時刻</span>
                <div className="flex items-center gap-2">
                  {todayStatus.checkIn && <Badge variant="outline">{getLocationIcon(todayStatus.workLocation)}</Badge>}
                  {todayStatus.checkInLocation && (
                    <LocationBadge location={todayStatus.checkInLocation} label="GPS" />
                  )}
                </div>
              </div>
              <div className="text-2xl font-bold">
                {todayStatus.checkIn || '--:--'}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">退勤時刻</span>
                <div className="flex items-center gap-2">
                  {todayStatus.checkOut && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {todayStatus.checkOutLocation && (
                    <LocationBadge location={todayStatus.checkOutLocation} label="GPS" />
                  )}
                </div>
              </div>
              <div className="text-2xl font-bold">
                {todayStatus.checkOut || '--:--'}
              </div>
            </div>
          </div>

          {/* 勤務時間プログレス */}
          {todayStatus.status === 'working' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">勤務時間</span>
                <span className="font-medium">{workingHours.toFixed(1)}時間 / 8時間</span>
              </div>
              <Progress value={workProgress} className="h-2" />
              {workProgress > 100 && (
                <div className="flex items-center gap-1 text-orange-500 text-sm">
                  <AlertTriangle className="h-3 w-3" />
                  <span>残業時間: {(workingHours - 8).toFixed(1)}時間</span>
                </div>
              )}
            </div>
          )}

          {/* 休憩情報 */}
          {(todayStatus.status === 'working' || todayStatus.status === 'onBreak' || todayStatus.status === 'finished') && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">休憩時間</span>
              </div>
              <Badge variant={todayStatus.status === 'onBreak' ? 'default' : 'secondary'}>
                {Math.floor(todayStatus.totalBreakTime)}分
                {todayStatus.status === 'onBreak' && todayStatus.breakStart && (
                  <span className="ml-1">(休憩中: {todayStatus.breakStart}〜)</span>
                )}
              </Badge>
            </div>
          )}

          {/* アクションボタン */}
          <div className="space-y-3">
            {todayStatus.status === 'notStarted' && (
              <Button
                onClick={handleCheckIn}
                size="lg"
                className="w-full h-16 text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                data-testid="check-in-button"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                出勤する
              </Button>
            )}

            {todayStatus.status === 'working' && (
              <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleBreakStart}
                    size="lg"
                    variant="outline"
                    className="h-14"
                  >
                    <Coffee className="mr-2 h-4 w-4" />
                    休憩開始
                  </Button>
                  <Button
                    onClick={handleCheckOut}
                    size="lg"
                    className="h-14 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                    data-testid="check-out-button"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    退勤する
                  </Button>
                </div>
            )}

            {todayStatus.status === 'onBreak' && (
              <Button
                onClick={handleBreakEnd}
                size="lg"
                className="w-full h-16 text-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                <Activity className="mr-2 h-5 w-5" />
                休憩終了
              </Button>
            )}

            {todayStatus.status === 'finished' && (
              <div className="text-center p-6 rounded-lg bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-medium">本日の勤務終了</p>
                <p className="text-sm text-muted-foreground mt-1">
                  勤務時間: {workingHours.toFixed(1)}時間
                </p>
              </div>
            )}
          </div>

          {/* 補足情報 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              <span>接続: 本社ネットワーク</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>位置情報: 有効</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 勤務場所選択ダイアログ */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>勤務場所を選択</DialogTitle>
            <DialogDescription>
              本日の勤務場所を選択してください
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={workLocation} onValueChange={(v) => setWorkLocation(v as TimeRecord['workLocation'])}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                <RadioGroupItem value="office" id="office" />
                <Label htmlFor="office" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="h-4 w-4" />
                  オフィス勤務
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                <RadioGroupItem value="home" id="home" />
                <Label htmlFor="home" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Home className="h-4 w-4" />
                  在宅勤務
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                <RadioGroupItem value="client" id="client" />
                <Label htmlFor="client" className="flex items-center gap-2 cursor-pointer flex-1">
                  <MapPin className="h-4 w-4" />
                  客先勤務
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
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

      {/* 退勤時メモダイアログ */}
      <Dialog open={showMemoDialog} onOpenChange={setShowMemoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>退勤処理</DialogTitle>
            <DialogDescription>
              本日の業務内容をメモに残すことができます（任意）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>業務メモ</Label>
              <Textarea
                placeholder="本日の業務内容、引き継ぎ事項など..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={4}
              />
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">勤務時間:</span>
                  <span className="font-medium">{workingHours.toFixed(1)}時間</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">休憩時間:</span>
                  <span className="font-medium">{Math.floor(todayStatus.totalBreakTime)}分</span>
                </div>
                {workingHours > 8 && (
                  <div className="flex justify-between text-orange-500">
                    <span>残業時間:</span>
                    <span className="font-medium">{(workingHours - 8).toFixed(1)}時間</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMemoDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={confirmCheckOut} className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600" data-testid="confirm-check-out-button">
              退勤する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 日報フォーム（退勤時必須モード） */}
      {reportTemplate && (
        <DailyReportFormDialog
          open={showReportForm}
          onOpenChange={setShowReportForm}
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