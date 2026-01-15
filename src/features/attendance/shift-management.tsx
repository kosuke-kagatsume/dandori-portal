'use client';

import { useState, useMemo } from 'react';
import { useShiftStore, ShiftAssignment } from '@/lib/store/shift-store';
import { useUserStore } from '@/lib/store/user-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Home,
  Building2,
  MapPin,
  Download,
  Upload,
  Settings2,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, getDay, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// サンプルユーザーデータ
const sampleUsers = [
  { id: '1', name: '田中太郎' },
  { id: '2', name: '鈴木花子' },
  { id: '3', name: '佐藤次郎' },
  { id: '4', name: '山田美咲' },
  { id: '5', name: '高橋健一' },
];

export function ShiftManagement() {
  const { currentUser, currentDemoUser, isDemoMode } = useUserStore();
  const currentUserId = isDemoMode ? (currentDemoUser?.id || '1') : (currentUser?.id || '1');
  const currentUserName = isDemoMode ? (currentDemoUser?.name || '田中太郎') : (currentUser?.name || '田中太郎');

  const {
    getActiveWorkPatterns,
    getUserShifts,
    getTeamShifts,
    assignShift,
    getMonthlyShiftSummary,
  } = useShiftStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // 有効な勤務パターン
  const workPatterns = useMemo(() => getActiveWorkPatterns(), [getActiveWorkPatterns]);

  // 自分のシフト
  const myShifts = useMemo(
    () => getUserShifts(currentUserId, currentYear, currentMonth),
    [getUserShifts, currentUserId, currentYear, currentMonth]
  );

  // チームのシフト
  const teamShifts = useMemo(
    () => getTeamShifts(currentYear, currentMonth),
    [getTeamShifts, currentYear, currentMonth]
  );

  // 月の日付配列を生成
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // カレンダーの開始位置調整用（日曜始まり）
  const startDayOfWeek = getDay(startOfMonth(currentDate));

  // 月間サマリー
  const monthlySummary = useMemo(
    () => getMonthlyShiftSummary(currentUserId, currentYear, currentMonth),
    [getMonthlyShiftSummary, currentUserId, currentYear, currentMonth]
  );

  // シフトをマップに変換（日付でアクセス）
  const shiftMap = useMemo(() => {
    const map = new Map<string, ShiftAssignment>();
    myShifts.forEach((shift) => {
      map.set(shift.date, shift);
    });
    return map;
  }, [myShifts]);

  // 前月に移動
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  // 翌月に移動
  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // シフト割り当てダイアログを開く
  const openAssignDialog = (date: string, userId: string) => {
    setSelectedDate(date);
    setSelectedUserId(userId);
    setShowAssignDialog(true);
  };

  // シフト割り当てを保存
  const handleAssignShift = (patternId: string, workLocation: 'office' | 'home' | 'client' | 'other') => {
    if (!selectedDate || !selectedUserId) return;

    const pattern = workPatterns.find((p) => p.id === patternId);
    if (!pattern) return;

    const userName = selectedUserId === currentUserId
      ? currentUserName
      : sampleUsers.find((u) => u.id === selectedUserId)?.name || 'Unknown';

    assignShift({
      userId: selectedUserId,
      userName,
      date: selectedDate,
      patternId: pattern.id,
      patternName: pattern.name,
      startTime: pattern.startTime,
      endTime: pattern.endTime,
      workLocation,
      status: 'scheduled',
    });

    toast.success('シフトを割り当てました');
    setShowAssignDialog(false);
  };

  // 勤務場所のアイコン
  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'office':
        return <Building2 className="h-3 w-3" />;
      case 'home':
        return <Home className="h-3 w-3" />;
      default:
        return <MapPin className="h-3 w-3" />;
    }
  };

  // 曜日ヘッダー
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">
            {format(currentDate, 'yyyy年M月', { locale: ja })}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            CSV出力
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            CSV取込
          </Button>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              出勤予定
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {monthlySummary.scheduledDays}
              <span className="text-sm font-normal text-muted-foreground ml-1">日</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              出勤済み
            </div>
            <div className="text-2xl font-bold text-green-600">
              {monthlySummary.workedDays}
              <span className="text-sm font-normal text-muted-foreground ml-1">日</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Home className="h-4 w-4" />
              休日
            </div>
            <div className="text-2xl font-bold text-gray-600">
              {monthlySummary.holidayDays}
              <span className="text-sm font-normal text-muted-foreground ml-1">日</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              勤務時間
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {Math.floor(monthlySummary.totalWorkMinutes / 60)}
              <span className="text-sm font-normal text-muted-foreground ml-1">時間</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 凡例 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            {workPatterns.slice(0, 6).map((pattern) => (
              <div key={pattern.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: pattern.color }}
                />
                <span className="text-sm">{pattern.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* タブ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            カレンダー
          </TabsTrigger>
          <TabsTrigger value="pattern" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            パターンシフト表
          </TabsTrigger>
        </TabsList>

        {/* カレンダー表示 */}
        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {/* 曜日ヘッダー */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day, index) => (
                  <div
                    key={day}
                    className={cn(
                      "text-center text-sm font-medium py-2",
                      index === 0 && "text-red-500",
                      index === 6 && "text-blue-500"
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* カレンダーグリッド */}
              <div className="grid grid-cols-7 gap-1">
                {/* 月初めの空白セル */}
                {Array.from({ length: startDayOfWeek }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-24 bg-muted/30 rounded" />
                ))}

                {/* 日付セル */}
                {monthDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const shift = shiftMap.get(dateStr);
                  const dayOfWeek = getDay(day);
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const pattern = shift
                    ? workPatterns.find((p) => p.id === shift.patternId)
                    : null;

                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        "h-24 p-1 rounded border cursor-pointer transition-colors hover:border-primary",
                        isToday(day) && "border-primary border-2",
                        isWeekend && "bg-muted/30"
                      )}
                      onClick={() => openAssignDialog(dateStr, currentUserId)}
                    >
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        dayOfWeek === 0 && "text-red-500",
                        dayOfWeek === 6 && "text-blue-500"
                      )}>
                        {format(day, 'd')}
                      </div>

                      {shift && pattern && (
                        <div
                          className="rounded p-1 text-xs text-white"
                          style={{ backgroundColor: pattern.color }}
                        >
                          <div className="font-medium truncate">{pattern.name}</div>
                          {pattern.workMinutes > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {getLocationIcon(shift.workLocation)}
                              <span>
                                {shift.startTime}-{shift.endTime}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* パターンシフト表 */}
        <TabsContent value="pattern" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">パターンシフト表</CardTitle>
              <CardDescription>
                チームメンバーのシフトパターンを一覧で確認
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background min-w-[120px]">
                        社員名
                      </TableHead>
                      {monthDays.slice(0, 15).map((day) => {
                        const dayOfWeek = getDay(day);
                        return (
                          <TableHead
                            key={format(day, 'yyyy-MM-dd')}
                            className={cn(
                              "text-center min-w-[60px]",
                              dayOfWeek === 0 && "text-red-500 bg-red-50",
                              dayOfWeek === 6 && "text-blue-500 bg-blue-50"
                            )}
                          >
                            <div>{format(day, 'd')}</div>
                            <div className="text-xs">{weekDays[dayOfWeek]}</div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleUsers.map((user) => {
                      const userShifts = teamShifts.filter((s) => s.userId === user.id);
                      const shiftByDate = new Map(
                        userShifts.map((s) => [s.date, s])
                      );

                      return (
                        <TableRow key={user.id}>
                          <TableCell className="sticky left-0 bg-background font-medium">
                            {user.name}
                          </TableCell>
                          {monthDays.slice(0, 15).map((day) => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const shift = shiftByDate.get(dateStr);
                            const pattern = shift
                              ? workPatterns.find((p) => p.id === shift.patternId)
                              : null;
                            const dayOfWeek = getDay(day);

                            return (
                              <TableCell
                                key={dateStr}
                                className={cn(
                                  "text-center p-1",
                                  dayOfWeek === 0 && "bg-red-50",
                                  dayOfWeek === 6 && "bg-blue-50"
                                )}
                              >
                                {pattern && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-normal"
                                    style={{
                                      backgroundColor: pattern.color,
                                      color: 'white',
                                      borderColor: pattern.color,
                                    }}
                                  >
                                    {pattern.code}
                                  </Badge>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* シフト割り当てダイアログ */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>シフト割り当て</DialogTitle>
            <DialogDescription>
              {selectedDate && format(new Date(selectedDate), 'yyyy年M月d日 (E)', { locale: ja })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>勤務パターン</Label>
              <div className="grid grid-cols-2 gap-2">
                {workPatterns.map((pattern) => (
                  <Button
                    key={pattern.id}
                    variant="outline"
                    className="justify-start h-auto py-2"
                    style={{ borderColor: pattern.color }}
                    onClick={() => handleAssignShift(pattern.id, 'office')}
                  >
                    <div
                      className="w-3 h-3 rounded mr-2"
                      style={{ backgroundColor: pattern.color }}
                    />
                    <div className="text-left">
                      <div className="font-medium text-sm">{pattern.name}</div>
                      {pattern.workMinutes > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {pattern.startTime}-{pattern.endTime}
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              キャンセル
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
