'use client';

import { useState, useEffect } from 'react';
// import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { generateAttendanceData } from '@/lib/mock-data';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/common/data-table';
import { CheckInButton } from '@/features/attendance/check-in-button';
import { AdvancedCheckIn } from '@/features/attendance/advanced-check-in';
import { AttendanceCalendar } from '@/features/attendance/attendance-calendar';
import { toast } from 'sonner';

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
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkedInAt, setCheckedInAt] = useState<string | undefined>();

  // Load attendance data
  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const response = await fetch('/api/attendance');
        const data = await response.json();
        
        // Mock attendance records
        const mockUsers = generateAttendanceData();
        const mockRecords: AttendanceRecord[] = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
          
          return {
            id: `${i}`,
            userId: randomUser.userId,
            userName: randomUser.userName,
            date: date.toISOString().split('T')[0],
            dayOfWeek: ['日', '月', '火', '水', '木', '金', '土'][date.getDay()],
            checkIn: isWeekend ? undefined : `${8 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            checkOut: isWeekend ? undefined : `${17 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            breakTime: isWeekend ? '0:00' : '1:00',
            workHours: isWeekend ? 0 : 7 + Math.random() * 2,
            overtime: Math.random() > 0.7 ? Math.random() * 3 : 0,
            status: isWeekend ? 'absent' : (['present', 'remote', 'late'] as const)[Math.floor(Math.random() * 3)],
            workType: (['office', 'remote', 'hybrid'] as const)[Math.floor(Math.random() * 3)],
            note: Math.random() > 0.8 ? 'クライアント打ち合わせのため外出' : undefined,
          };
        });
        
        setRecords(mockRecords);
        
        // Check if user is currently checked in (mock)
        const mockCheckedIn = Math.random() > 0.5;
        setIsCheckedIn(mockCheckedIn);
        if (mockCheckedIn) {
          setCheckedInAt('09:15');
        }
      } catch (error) {
        toast.error('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, []);

  const handleCheckIn = async () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    setIsCheckedIn(true);
    setCheckedInAt(timeString);
  };

  const handleCheckOut = async () => {
    setIsCheckedIn(false);
    setCheckedInAt(undefined);
  };

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

  const columns: ColumnDef<AttendanceRecord>[] = [
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
      cell: ({ row }) => (
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
  ];

  const calendarRecords = records.map(record => ({
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
  }));

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            勤怠記録の打刻と管理を行います
          </p>
        </div>
      </div>

      {/* Monthly Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('monthlyWorkHours')}</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t('overtimeHours')}</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t('leaveUsed')}</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t('remoteDays')}</CardTitle>
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

      {/* Check-in Section */}
      <div className="flex justify-center">
        <AdvancedCheckIn />
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('attendanceList')}
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('teamAttendance')}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {t('calendar')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('statistics')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataTable
                columns={columns}
                data={records}
                searchKey="date"
                searchPlaceholder="日付で検索..."
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
          <AttendanceCalendar records={calendarRecords} />
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