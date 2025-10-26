'use client';

import { useState, useEffect, Suspense, lazy, memo, useMemo } from 'react';
// import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
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
  CheckCircle,
  XCircle,
  MapPin,
  Edit,
  MoreHorizontal,
  TrendingUp,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OptimizedDataTable } from '@/components/ui/common/optimized-data-table';
import { StatCardsLoadingSkeleton, TableLoadingSkeleton } from '@/components/ui/loading-skeleton';
import { toast } from 'sonner';
import { exportAttendanceToCSV } from '@/lib/csv/csv-export';
import { useAttendanceHistoryStore } from '@/lib/store/attendance-history-store';

// 重いコンポーネントをlazyロード
const LazyAdvancedCheckIn = lazy(() => 
  import('@/features/attendance/advanced-check-in').then(module => ({ 
    default: module.AdvancedCheckIn 
  }))
);

const LazyAttendanceCalendar = lazy(() => 
  import('@/features/attendance/attendance-calendar').then(module => ({ 
    default: module.AttendanceCalendar 
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
    <div className="grid gap-4 md:grid-cols-4">
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

  // Attendance store integration
  const { getTodayRecord, setOnAttendanceUpdate } = useAttendanceStore();
  const { records: allHistoryRecords, addOrUpdateRecord } = useAttendanceHistoryStore();

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


  const getStatusBadge = (status: AttendanceRecord['status']) => {
    const config = {
      present: { label: '出勤', variant: 'default' as const, icon: CheckCircle },
      remote: { label: '在宅', variant: 'secondary' as const, icon: Home },
      absent: { label: '欠勤', variant: 'outline' as const, icon: XCircle },
      late: { label: '遅刻', variant: 'destructive' as const, icon: AlertTriangle },
      early_leave: { label: '早退', variant: 'destructive' as const, icon: AlertTriangle },
    };

    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // メモ化された列定義
  const columns: ColumnDef<AttendanceRecord>[] = useMemo(() => [
    {
      accessorKey: 'date',
      header: '日付',
      cell: ({ row }) => {
        const record = row.original;
        const date = new Date(record.date);
        return (
          <div>
            <div className="font-medium">
              {date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
            </div>
            <div className="text-sm text-muted-foreground">
              ({record.dayOfWeek})
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'userName',
      header: 'ユーザー',
      cell: ({ row }) => {
        return (
          <div className="font-medium">
            {row.original.userName}
          </div>
        );
      },
    },
    {
      accessorKey: 'checkIn',
      header: '出勤',
      cell: ({ row }) => {
        const time = row.original.checkIn;
        return time ? (
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            {time}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'checkOut',
      header: '退勤',
      cell: ({ row }) => {
        const time = row.original.checkOut;
        return time ? (
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            {time}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'breakTime',
      header: '休憩',
    },
    {
      accessorKey: 'workHours',
      header: '実働',
      cell: ({ row }) => {
        const hours = row.original.workHours;
        return hours > 0 ? `${hours.toFixed(1)}h` : '-';
      },
    },
    {
      accessorKey: 'overtime',
      header: '残業',
      cell: ({ row }) => {
        const overtime = row.original.overtime;
        return overtime > 0 ? (
          <span className="text-orange-600 font-medium">
            {overtime.toFixed(1)}h
          </span>
        ) : (
          '-'
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'workType',
      header: '勤務形態',
      cell: ({ row }) => {
        const type = row.original.workType;
        const config = {
          office: { label: 'オフィス', icon: MapPin },
          remote: { label: 'リモート', icon: Home },
          hybrid: { label: 'ハイブリッド', icon: MapPin },
        };
        
        const { label, icon: Icon } = config[type];
        return (
          <div className="flex items-center gap-1">
            <Icon className="h-3 w-3" />
            <span className="text-sm">{label}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'note',
      header: '備考',
      cell: ({ row }) => {
        const note = row.original.note;
        return note ? (
          <span className="text-sm text-muted-foreground truncate max-w-32">
            {note}
          </span>
        ) : (
          '-'
        );
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              修正
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], []);

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
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        }>
          <LazyAdvancedCheckIn />
        </Suspense>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="list" className="space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">{t('attendanceList')}</span>
            <span className="sm:hidden">一覧</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('teamAttendance')}</span>
            <span className="sm:hidden">チーム</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t('calendar')}</span>
            <span className="sm:hidden">カレンダー</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('statistics')}</span>
            <span className="sm:hidden">統計</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>勤怠一覧</CardTitle>
                  <CardDescription>過去の勤怠記録を確認・管理</CardDescription>
                </div>
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  CSV出力
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <OptimizedDataTable
                columns={columns}
                data={records}
                searchKey="date"
                searchPlaceholder="日付で検索..."
                pageSize={20}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>チーム勤怠状況</CardTitle>
              <CardDescription>
                チームメンバーの今日の勤怠状況
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                チーム勤怠機能は開発中です
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Suspense fallback={<TableLoadingSkeleton />}>
            <LazyAttendanceCalendar records={calendarRecords} />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  月次実績サマリー
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>総実働時間</span>
                    <span className="font-medium">162.5h</span>
                  </div>
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>36協定状況</CardTitle>
                <CardDescription>
                  法定労働時間の管理状況
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>月間残業時間</span>
                    <span>28.5h / 45h</span>
                  </div>
                  <Progress value={63.3} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    上限まで 16.5時間
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>深夜労働時間</span>
                    <span>2.5h</span>
                  </div>
                  <Progress value={12.5} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}