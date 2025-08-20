'use client';

// import { useTranslations } from 'next-intl'; // 一時的に無効化
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardStats, generateAttendanceData } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  UserCheck, 
  Clock, 
  AlertCircle,
  Calendar,
  TrendingUp,
  Activity,
  Wifi,
  WifiOff,
} from 'lucide-react';

export default function DashboardPage() {
  // const t = useTranslations('dashboard'); // 一時的に無効化
  
  // 固定の日本語翻訳関数
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'title': 'ダッシュボード',
      'totalEmployees': '総従業員数',
      'todayAttendance': '本日の出勤率',
      'pendingApprovals': '承認待ち',
      'monthlyUtilization': '月間稼働率',
      'leaveBalance': '有給残日数',
      'remainingDays': '残日数',
      'usedLeave': '使用済み',
      'pendingLeave': '申請中',
      'expiringLeave': '失効予定',
      'recentActivity': '最近のアクティビティ',
      'systemConnection': 'システム接続状況'
    };
    return translations[key] || key;
  };

  // データを取得
  const [kpiData, setKpiData] = useState({
    totalEmployees: 50,
    todayAttendance: 42,
    pendingApprovals: 8,
    monthlyUtilization: 87.5,
  });

  useEffect(() => {
    const stats = getDashboardStats();
    setKpiData({
      totalEmployees: stats.totalEmployees,
      todayAttendance: stats.todayAttendance,
      pendingApprovals: stats.pendingApprovals,
      monthlyUtilization: stats.monthlyUtilization,
    });
  }, []);

  const leaveBalance = {
    remaining: 12,
    used: 8,
    pending: 2,
    expiring: 3,
  };

  const recentActivity = [
    { id: 1, user: '田中太郎', action: '有給申請を提出', time: '5分前' },
    { id: 2, user: '佐藤花子', action: '勤怠記録を修正', time: '15分前' },
    { id: 3, user: '山田次郎', action: '経費申請を承認', time: '30分前' },
    { id: 4, user: '鈴木一郎', action: '出勤記録', time: '1時間前' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          今日の概要と重要な指標を確認できます
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">
              {t('totalEmployees')}
            </CardTitle>
            <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur">
              <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{kpiData.totalEmployees}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <p className="text-xs text-orange-700 dark:text-orange-300">
                +12 先月比
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {t('todayAttendance')}
            </CardTitle>
            <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur">
              <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{kpiData.todayAttendance}</div>
            <div className="flex items-center gap-1 mt-1">
              <Activity className="h-3 w-3 text-blue-600" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                出勤率 {Math.round((kpiData.todayAttendance / kpiData.totalEmployees) * 100)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">
              {t('pendingApprovals')}
            </CardTitle>
            <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{kpiData.pendingApprovals}</div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-amber-600" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                3件は緊急
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
              {t('monthlyUtilization')}
            </CardTitle>
            <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">{kpiData.monthlyUtilization}%</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <p className="text-xs text-green-700 dark:text-green-300">
                +2.1% 先月比
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Leave Balance Summary */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('leaveBalance')}
            </CardTitle>
            <CardDescription>
              現在の有給休暇の状況
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-green-600">{leaveBalance.remaining}</p>
                <p className="text-xs text-muted-foreground">{t('remainingDays')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-blue-600">{leaveBalance.used}</p>
                <p className="text-xs text-muted-foreground">{t('usedLeave')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-yellow-600">{leaveBalance.pending}</p>
                <p className="text-xs text-muted-foreground">{t('pendingLeave')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-red-600">{leaveBalance.expiring}</p>
                <p className="text-xs text-muted-foreground">{t('expiringLeave')}</p>
              </div>
            </div>
            <Progress value={(leaveBalance.used / 20) * 100} className="w-full" />
            <p className="text-xs text-center text-muted-foreground">
              年間20日中 {leaveBalance.used}日使用済み
            </p>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('recentActivity')}
            </CardTitle>
            <CardDescription>
              最近のシステム活動
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.user}</p>
                    <p className="text-xs text-muted-foreground">{activity.action}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {activity.time}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              すべての活動を表示
            </Button>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-green-500" />
              {t('systemConnection')}
            </CardTitle>
            <CardDescription>
              システム接続状態
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">データベース</span>
                <Badge variant="default" className="bg-green-500">
                  <Wifi className="h-3 w-3 mr-1" />
                  接続中
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">外部API</span>
                <Badge variant="default" className="bg-green-500">
                  <Wifi className="h-3 w-3 mr-1" />
                  接続中
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">メール配信</span>
                <Badge variant="secondary">
                  <WifiOff className="h-3 w-3 mr-1" />
                  メンテナンス中
                </Badge>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                最終更新: 2024年1月15日 14:30
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
          <CardDescription>
            よく使う操作をすばやく実行できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/ja/attendance">
              <Button className="h-16 w-full flex flex-col space-y-1">
                <Clock className="h-5 w-5" />
                <span className="text-sm">出勤する</span>
              </Button>
            </Link>
            <Link href="/ja/leave">
              <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                <Calendar className="h-5 w-5" />
                <span className="text-sm">有給申請</span>
              </Button>
            </Link>
            <Link href="/ja/members">
              <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                <Users className="h-5 w-5" />
                <span className="text-sm">メンバー確認</span>
              </Button>
            </Link>
            <Link href="/ja/leave">
              <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">承認待ち</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}