'use client';

// import { useTranslations } from 'next-intl'; // 一時的に無効化
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Mock data - in real app this would come from API
  const kpiData = {
    totalEmployees: 247,
    todayAttendance: 186,
    pendingApprovals: 12,
    monthlyUtilization: 87.5,
  };

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('totalEmployees')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              +12 先月比
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('todayAttendance')}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.todayAttendance}</div>
            <p className="text-xs text-muted-foreground">
              出勤率 {Math.round((kpiData.todayAttendance / kpiData.totalEmployees) * 100)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('pendingApprovals')}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              3件は緊急
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('monthlyUtilization')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.monthlyUtilization}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% 先月比
            </p>
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
            <Button className="h-16 flex flex-col space-y-1">
              <Clock className="h-5 w-5" />
              <span className="text-sm">出勤する</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col space-y-1">
              <Calendar className="h-5 w-5" />
              <span className="text-sm">有給申請</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col space-y-1">
              <Users className="h-5 w-5" />
              <span className="text-sm">メンバー確認</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col space-y-1">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">承認待ち</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}