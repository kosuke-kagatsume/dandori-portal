'use client';

import { useState, useEffect, Suspense, lazy, memo, useMemo } from 'react';
import { generateRealisticAttendanceData } from '@/lib/realistic-mock-data';
import { useAttendanceStore } from '@/lib/attendance-store';
import {
  Clock,
  Calendar as CalendarIcon,
  BarChart3,
  Users,
  Timer,
  Home,
  AlertTriangle,
  TrendingUp,
  Download,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCardsLoadingSkeleton, TableLoadingSkeleton } from '@/components/ui/loading-skeleton';
import { toast } from 'sonner';
import { exportAttendanceToCSV } from '@/lib/csv/csv-export';
import { useAttendanceHistoryStore } from '@/lib/store/attendance-history-store';
import { useUserStore } from '@/lib/store/user-store';

// 重いコンポーネントをlazyロード
const LazySimplePunchCard = lazy(() =>
  import('@/features/attendance/simple-punch-card').then(module => ({
    default: module.SimplePunchCard
  }))
);

const LazyAttendanceCalendar = lazy(() =>
  import('@/features/attendance/attendance-calendar').then(module => ({
    default: module.AttendanceCalendar
  }))
);

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

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  dayOfWeek: string;
  checkIn?: string;
  checkOut?: string;
  breakTime: string;
  workHours: number;
  overtime: number;
  status: 'present' | 'absent' | 'remote' | 'late' | 'early_leave';
  workType: 'office' | 'remote' | 'hybrid';
  note?: string;
}

// メモ化された統計カードコンポーネント
const StatsCards = memo(({ loading }: { loading: boolean }) => {
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">休暇取得</CardTitle>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2日</div>
          <p className="text-xs text-muted-foreground">
            今月取得
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
  // const t = useTranslations('attendance');
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'title': '勤怠管理',
      'monthlyWorkHours': '月間実働時間',
      'overtimeHours': '残業時間',
      'leaveUsed': '休暇取得',
      'remoteDays': '在宅勤務',
      'attendanceList': '勤怠一覧',
      'teamAttendance': 'チーム勤怠',
      'calendar': 'カレンダー',
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
  const { getTodayRecord } = useAttendanceStore();
  const { records: allHistoryRecords, addOrUpdateRecord } = useAttendanceHistoryStore();

  // ユーザー権限の確認
  const { currentUser, currentDemoUser, isDemoMode } = useUserStore();
  const currentUserRoles = isDemoMode
    ? (currentDemoUser?.roles || ['employee'])
    : (currentUser?.roles || ['employee']);

  // チーム勤怠タブを表示できる権限（人事/マネージャー/経営者/システム管理者）
  const canViewTeamAttendance = currentUserRoles.some(role =>
    ['hr', 'manager', 'executive', 'admin', 'system_admin'].includes(role)
  );

  // ストアのデータを表示用に変換
  const records = useMemo(() => {
    const mappedRecords: AttendanceRecord[] = allHistoryRecords.map((record) => {
      const date = new Date(record.date);
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];

      // 休憩時間を時間:分形式に変換
      const breakHours = Math.floor((record.totalBreakMinutes || 0) / 60);
      const breakMinutes = (record.totalBreakMinutes || 0) % 60;
      const breakTime = breakHours > 0 || breakMinutes > 0
        ? `${breakHours}時間${breakMinutes}分`
        : '-';

      // ステータスのマッピング
      const statusMap: Record<string, AttendanceRecord['status']> = {
        'present': 'present',
        'absent': 'absent',
        'holiday': 'absent',
        'leave': 'absent',
        'late': 'late',
        'early': 'early_leave',
      };

      // 勤務場所のマッピング
      const workTypeMap: Record<string, AttendanceRecord['workType']> = {
        'office': 'office',
        'home': 'remote',
        'client': 'office',
        'other': 'hybrid',
      };

      return {
        id: record.id,
        userId: record.userId,
        userName: record.userName || '',
        date: record.date,
        dayOfWeek,
        checkIn: record.checkIn || undefined,
        checkOut: record.checkOut || undefined,
        breakTime,
        workHours: (record.workMinutes || 0) / 60,
        overtime: (record.overtimeMinutes || 0) / 60,
        status: statusMap[record.status] || 'present',
        workType: workTypeMap[record.workLocation] || 'office',
        note: record.memo || '',
      };
    });

    // 今日の打刻データがあれば一覧に追加
    const todayRecord = getTodayRecord();
    return todayRecord ? [todayRecord, ...mappedRecords] : mappedRecords;
  }, [allHistoryRecords, getTodayRecord]);

  // CSV出力ハンドラー
  const handleExportCSV = () => {
    try {
      // 勤怠履歴ストアから全データを取得
      const allRecords = allHistoryRecords;

      if (allRecords.length === 0) {
        toast.error('データがありません', {
          description: 'エクスポートする勤怠データがありません',
        });
        return;
      }

      exportAttendanceToCSV(allRecords);
      toast.success('CSV出力完了', {
        description: `${allRecords.length}件の勤怠データをエクスポートしました`,
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('エラー', {
        description: 'CSVの出力に失敗しました',
      });
    }
  };


  // デモデータの自動生成
  useEffect(() => {
    if (allHistoryRecords.length === 0) {
      console.log('[Demo] 勤怠履歴が空のため、デモデータを生成します...');

      // デモデータ生成
      const demoData = generateRealisticAttendanceData();

      // 勤怠履歴ストアの形式に変換して追加
      demoData.forEach((record) => {
        // 日付を YYYY-MM-DD 形式に変換
        const today = new Date();
        const [month, day] = record.date.split('/');
        const dateString = `${today.getFullYear()}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        // ステータスをマッピング
        const statusMap: Record<string, 'present' | 'absent' | 'holiday' | 'leave' | 'late' | 'early'> = {
          'normal': 'present',
          'late': 'late',
          'early_leave': 'early',
          'absence': 'absent',
          'holiday': 'holiday',
          'paid_leave': 'leave',
          'sick_leave': 'leave',
          'remote': 'present',
        };

        // 休憩時間を分に変換（文字列から）
        const parseBreakTime = (breakTime: string): number => {
          if (breakTime === '-') return 0;
          const match = breakTime.match(/(\d+)分/);
          return match ? parseInt(match[1]) : 60; // デフォルト60分
        };

        addOrUpdateRecord({
          id: record.id,
          userId: record.userId,
          userName: record.userName,
          date: dateString,
          checkIn: record.checkIn || null,
          checkOut: record.checkOut || null,
          breakStart: record.breakStart || null,
          breakEnd: record.breakEnd || null,
          totalBreakMinutes: parseBreakTime(record.breakTime),
          workMinutes: Math.round(record.workHours * 60),
          overtimeMinutes: Math.round(record.overtime * 60),
          workLocation: record.workLocation,
          status: statusMap[record.status] || 'present',
          memo: record.memo,
          approvalStatus: record.approvalStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      console.log(`[Demo] ${demoData.length}件の勤怠データを生成しました`);
    }
  }, [allHistoryRecords.length, addOrUpdateRecord]);

  // 初期ローディング状態の管理
  useEffect(() => {
    setLoading(false);
  }, []);

  // メモ化されたカレンダーレコード
  const calendarRecords = useMemo(() => records.map(record => ({
    date: new Date(record.date),
    status: record.status === 'present' || record.status === 'late' ? 'present' as const :
            record.status === 'remote' ? 'remote' as const :
            record.status === 'absent' ? 'absent' as const : 'present' as const,
    checkIn: record.checkIn,
    checkOut: record.checkOut,
    workHours: record.workHours,
    overtime: record.overtime,
    workType: record.workType,
    note: record.note,
  })), [records]);

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
      <StatsCards loading={loading} />

      {/* Check-in Section */}
      <div className="flex justify-center">
        <Suspense fallback={
          <Card className="w-full max-w-2xl">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        }>
          <LazySimplePunchCard />
        </Suspense>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="list" className="space-y-4 w-full">
        <TabsList className={`grid w-full ${canViewTeamAttendance ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">{t('attendanceList')}</span>
            <span className="sm:hidden">一覧</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">勤務表</span>
            <span className="sm:hidden">勤務表</span>
          </TabsTrigger>
          {canViewTeamAttendance && (
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{t('teamAttendance')}</span>
              <span className="sm:hidden">チーム</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t('calendar')}</span>
            <span className="sm:hidden">カレンダー</span>
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

        {canViewTeamAttendance && (
          <TabsContent value="team" className="space-y-4">
            <Suspense fallback={<TableLoadingSkeleton />}>
              <LazyTeamAttendance />
            </Suspense>
          </TabsContent>
        )}

        <TabsContent value="calendar" className="space-y-4">
          <Suspense fallback={<TableLoadingSkeleton />}>
            <LazyAttendanceCalendar records={calendarRecords} />
          </Suspense>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    勤務表
                  </CardTitle>
                  <CardDescription>月間勤怠の集計と締め申請</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    CSV出力
                  </Button>
                  <Button
                    onClick={() => setClosingDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <FileCheck className="h-4 w-4" />
                    締め申請
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 月間サマリー */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">所定労働時間</div>
                  <div className="text-2xl font-bold">160h</div>
                  <div className="text-xs text-muted-foreground">20日 × 8h</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">総実働時間</div>
                  <div className="text-2xl font-bold">162.5h</div>
                  <Progress value={101.5} className="mt-2 h-1" />
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">残業時間</div>
                  <div className="text-2xl font-bold text-orange-600">28.5h</div>
                  <div className="text-xs text-muted-foreground">36協定上限: 45h</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">深夜労働</div>
                  <div className="text-2xl font-bold">2.5h</div>
                  <div className="text-xs text-muted-foreground">22:00-05:00</div>
                </div>
              </div>

              {/* 詳細データテーブル */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">日付</th>
                        <th className="px-4 py-3 text-left font-medium">曜日</th>
                        <th className="px-4 py-3 text-left font-medium">出勤</th>
                        <th className="px-4 py-3 text-left font-medium">退勤</th>
                        <th className="px-4 py-3 text-left font-medium">休憩</th>
                        <th className="px-4 py-3 text-left font-medium">実働</th>
                        <th className="px-4 py-3 text-left font-medium">残業</th>
                        <th className="px-4 py-3 text-left font-medium">勤務形態</th>
                        <th className="px-4 py-3 text-left font-medium">備考</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {records.slice(0, 10).map((record) => (
                        <tr key={record.id} className="hover:bg-muted/30">
                          <td className="px-4 py-2">{new Date(record.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}</td>
                          <td className="px-4 py-2">{record.dayOfWeek}</td>
                          <td className="px-4 py-2">{record.checkIn || '-'}</td>
                          <td className="px-4 py-2">{record.checkOut || '-'}</td>
                          <td className="px-4 py-2">{record.breakTime}</td>
                          <td className="px-4 py-2">{record.workHours > 0 ? `${record.workHours.toFixed(1)}h` : '-'}</td>
                          <td className="px-4 py-2">
                            {record.overtime > 0 ? (
                              <span className="text-orange-600 font-medium">{record.overtime.toFixed(1)}h</span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-2">
                            <Badge variant="outline" className="text-xs">
                              {record.workType === 'office' ? 'オフィス' : record.workType === 'remote' ? 'リモート' : 'ハイブリッド'}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground truncate max-w-[150px]">{record.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 36協定状況 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">36協定状況</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>月間残業時間</span>
                        <span>28.5h / 45h</span>
                      </div>
                      <Progress value={63.3} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>年間残業時間</span>
                        <span>180h / 360h</span>
                      </div>
                      <Progress value={50} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">勤務統計</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>平均出勤時刻</span>
                      <span className="font-medium">09:12</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>平均退勤時刻</span>
                      <span className="font-medium">18:34</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>残業日数</span>
                      <span className="font-medium">12日</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>在宅勤務日数</span>
                      <span className="font-medium">8日</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
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