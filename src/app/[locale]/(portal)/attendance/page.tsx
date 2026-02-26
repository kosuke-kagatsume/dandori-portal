'use client';

import { useState, useEffect, Suspense, lazy, memo, useMemo, useCallback } from 'react';
// 勤怠ストアはlazyロードされた子コンポーネントで使用
import {
  Clock,
  BarChart3,
  Users,
  Timer,
  Home,
  AlertTriangle,
  CalendarClock,
  CalendarDays,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCardsLoadingSkeleton, TableLoadingSkeleton } from '@/components/ui/loading-skeleton';
// CSV出力は勤怠一覧/勤怠集計の各コンポーネントに移動済み
import { useAttendanceHistoryStore } from '@/lib/store/attendance-history-store';
import { useUserStore } from '@/lib/store/user-store';
import { useAttendanceStore } from '@/lib/attendance-store';

// 重いコンポーネントをlazyロード
const LazySimplePunchCard = lazy(() =>
  import('@/features/attendance/simple-punch-card').then(module => ({
    default: module.SimplePunchCard
  }))
);

// カレンダータブは要件により削除（P.2-3参照）

const LazyMonthlyAttendanceList = lazy(() =>
  import('@/features/attendance/monthly-attendance-list').then(module => ({
    default: module.MonthlyAttendanceList
  }))
);

const LazyAttendanceClosingDialog = lazy(() =>
  import('@/features/attendance/attendance-closing-dialog').then(module => ({
    default: module.AttendanceClosingDialog
  }))
);

const LazyTeamAttendance = lazy(() =>
  import('@/features/attendance/team-attendance').then(module => ({
    default: module.TeamAttendance
  }))
);

const LazyShiftManagement = lazy(() =>
  import('@/features/attendance/shift-management').then(module => ({
    default: module.ShiftManagement
  }))
);

const LazyAttendanceSummaryTab = lazy(() =>
  import('@/features/attendance/attendance-summary-tab').then(module => ({
    default: module.AttendanceSummaryTab
  }))
);

// メモ化された統計カードコンポーネント
const StatsCards = memo(({ loading, onLeaveCardClick }: { loading: boolean; onLeaveCardClick?: () => void }) => {
  if (loading) return <StatCardsLoadingSkeleton />;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">月間実働時間</CardTitle>
          <Timer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">162.5h</div>
          <p className="text-xs text-muted-foreground">
            標準: 160h
          </p>
          <Progress value={101.5} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">残業時間</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">28.5h</div>
          <p className="text-xs text-muted-foreground">
            36協定上限: 45h
          </p>
          <Progress value={63.3} className="mt-2" />
        </CardContent>
      </Card>

      {/* 休暇取得カード - クリックで休暇管理へ遷移 */}
      <Card
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onLeaveCardClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">休暇取得</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2日</div>
          <p className="text-xs text-muted-foreground">
            今月取得 → 休暇管理へ
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">在宅勤務</CardTitle>
          <Home className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">8日</div>
          <p className="text-xs text-muted-foreground">
            今月在宅勤務
          </p>
        </CardContent>
      </Card>
    </div>
  );
});

StatsCards.displayName = 'StatsCards';

export default function AttendancePage() {
  const router = useRouter();
  // const t = useTranslations('attendance');
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'title': '勤怠管理',
      'monthlyWorkHours': '月間実働時間',
      'overtimeHours': '残業時間',
      'leaveUsed': '休暇取得',
      'remoteDays': '在宅勤務',
      'attendanceList': '勤怠一覧',
      'attendanceSummary': '勤怠集計',
      'attendanceApproval': '勤怠承認',
      'shift': 'シフト',
      'statistics': '統計',
    };
    return translations[key] || key;
  };
  const [loading, setLoading] = useState(true);
  const [closingDialogOpen, setClosingDialogOpen] = useState(false);

  // Current month for closing dialog
  const currentDate = new Date();
  const closingYear = currentDate.getFullYear();
  const closingMonth = currentDate.getMonth() + 1;

  // Attendance store integration
  // getTodayRecord は勤怠一覧コンポーネントに移動済み
  const { records: allHistoryRecords, addOrUpdateRecord } = useAttendanceHistoryStore();

  // ユーザー権限の確認
  const { currentUser } = useUserStore();
  const currentUserRoles = currentUser?.roles || ['employee'];

  // 勤怠承認タブを表示できる権限（人事/マネージャー/経営者のみ）
  const canViewAttendanceApproval = currentUserRoles.some((role: string) =>
    ['hr', 'manager', 'executive'].includes(role)
  );

  // 休暇管理への遷移ハンドラー
  const handleLeaveCardClick = () => {
    router.push('/leave');
  };

  // NOTE: records と handleExportCSV は勤怠集計タブの専用コンポーネントに移動済み

  // 打刻ストアの今日の状態を監視
  const { todayStatus } = useAttendanceStore();

  // 打刻ストアの変更を勤怠一覧ストアに同期
  const syncPunchToHistory = useCallback(() => {
    if (!currentUser?.id || !todayStatus.recordDate) return;

    const today = new Date().toISOString().split('T')[0];
    if (todayStatus.recordDate !== today) return;

    // 最新の打刻ペアから checkIn/checkOut を取得
    const punchPairs = todayStatus.punchPairs || [];
    const latestPair = punchPairs.length > 0
      ? punchPairs.reduce((latest, pair) => pair.order > latest.order ? pair : latest, punchPairs[0])
      : null;

    // 全打刻ペアの休憩時間を合計
    const totalBreakMinutes = todayStatus.totalBreakTime || 0;

    // checkIn/checkOut を決定（最初の出勤、最後の退勤）
    const firstCheckIn = punchPairs.length > 0 ? punchPairs[0].checkIn?.time : todayStatus.checkIn;
    const lastCheckOut = latestPair?.checkOut?.time || todayStatus.checkOut;

    // 勤怠一覧ストアに同期
    addOrUpdateRecord({
      userId: currentUser.id,
      userName: currentUser.name || '',
      date: today,
      checkIn: firstCheckIn || null,
      checkOut: lastCheckOut || null,
      breakStart: latestPair?.breakStart?.time || todayStatus.breakStart || null,
      breakEnd: latestPair?.breakEnd?.time || todayStatus.breakEnd || null,
      totalBreakMinutes,
      workLocation: todayStatus.workLocation || 'office',
      status: todayStatus.status === 'finished' ? 'present' :
              todayStatus.status === 'working' ? 'present' :
              todayStatus.status === 'onBreak' ? 'present' : 'absent',
      memo: todayStatus.memo,
    });
  }, [currentUser, todayStatus, addOrUpdateRecord]);

  // 打刻状態が変わったら勤怠一覧を同期
  useEffect(() => {
    if (todayStatus.status !== 'notStarted') {
      syncPunchToHistory();
    }
  }, [todayStatus.status, todayStatus.checkIn, todayStatus.checkOut, todayStatus.punchPairs, syncPunchToHistory]);

  // 初期ローディング状態の管理
  useEffect(() => {
    setLoading(false);
  }, []);

  // カレンダータブ削除のため calendarRecords は不要

  // 月間勤怠一覧用のレコード
  const monthlyListRecords = useMemo(() => {
    return allHistoryRecords.map(record => ({
      date: record.date,
      status: record.status === 'present' ? 'present' as const :
              record.status === 'absent' || record.status === 'holiday' || record.status === 'leave' ? 'absent' as const :
              record.status === 'late' ? 'late' as const :
              record.status === 'early' ? 'early_leave' as const :
              record.workLocation === 'home' ? 'remote' as const : 'present' as const,
      checkIn: record.checkIn || undefined,
      checkOut: record.checkOut || undefined,
      breakStart: record.breakStart || undefined,
      breakEnd: record.breakEnd || undefined,
      breakMinutes: record.totalBreakMinutes,
      workHours: (record.workMinutes || 0) / 60,
      overtime: (record.overtimeMinutes || 0) / 60,
      workLocation: record.workLocation as 'office' | 'home' | 'client' | 'other' | undefined,
      note: record.memo || undefined,
      approvalStatus: record.approvalStatus as 'pending' | 'approved' | 'rejected' | undefined,
    }));
  }, [allHistoryRecords]);

  // 勤怠記録更新ハンドラー
  const handleRecordUpdate = (date: string, updates: Record<string, unknown>) => {
    const existingRecord = allHistoryRecords.find(r => r.date === date);
    if (existingRecord) {
      addOrUpdateRecord({
        ...existingRecord,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            勤怠記録の打刻と管理を行います
          </p>
        </div>
      </div>

      {/* Monthly Status Cards */}
      <StatsCards loading={loading} onLeaveCardClick={handleLeaveCardClick} />

      {/* Check-in Section */}
      <div className="flex justify-center">
        <Suspense fallback={
          <Card className="w-full max-w-2xl">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded" />
                <div className="h-16 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        }>
          <LazySimplePunchCard />
        </Suspense>
      </div>

      {/* Tabs Content */}
      {/*
        タブ構成（Phase 1 リファクタリング）:
        - 一般/システム管理者: 勤怠一覧 / 勤怠集計 / シフト
        - 人事/マネージャー/経営者: 勤怠一覧 / 勤怠集計 / 勤怠承認 / シフト
      */}
      <Tabs defaultValue="list" className="space-y-4 w-full">
        <TabsList className={`grid w-full ${canViewAttendanceApproval ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">{t('attendanceList')}</span>
            <span className="sm:hidden">一覧</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('attendanceSummary')}</span>
            <span className="sm:hidden">集計</span>
          </TabsTrigger>
          {canViewAttendanceApproval && (
            <TabsTrigger value="approval" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{t('attendanceApproval')}</span>
              <span className="sm:hidden">承認</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="shift" className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            <span className="hidden sm:inline">{t('shift')}</span>
            <span className="sm:hidden">シフト</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Suspense fallback={<TableLoadingSkeleton />}>
            <LazyMonthlyAttendanceList
              records={monthlyListRecords}
              onRecordUpdate={handleRecordUpdate}
            />
          </Suspense>
        </TabsContent>

        {/* 勤怠承認タブ（人事/マネージャー/経営者のみ） */}
        {canViewAttendanceApproval && (
          <TabsContent value="approval" className="space-y-4">
            <Suspense fallback={<TableLoadingSkeleton />}>
              <LazyTeamAttendance />
            </Suspense>
          </TabsContent>
        )}

        {/* シフトタブ（全員表示可能） */}
        <TabsContent value="shift" className="space-y-4">
          <Suspense fallback={<TableLoadingSkeleton />}>
            <LazyShiftManagement />
          </Suspense>
        </TabsContent>

        {/* 勤怠集計タブ */}
        <TabsContent value="summary" className="space-y-4">
          <Suspense fallback={<TableLoadingSkeleton />}>
            <LazyAttendanceSummaryTab />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* 勤怠締め申請ダイアログ */}
      <Suspense fallback={null}>
        <LazyAttendanceClosingDialog
          open={closingDialogOpen}
          onOpenChange={setClosingDialogOpen}
          year={closingYear}
          month={closingMonth}
          onSubmit={async (data) => {
            console.log('Closing request submitted:', data);
            // TODO: 実際のAPI呼び出し
          }}
        />
      </Suspense>
    </div>
  );
}