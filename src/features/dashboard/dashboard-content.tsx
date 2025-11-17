'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardStats } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  ShieldCheck,
  Settings,
  Loader2,
} from 'lucide-react';
import { useUserStore } from '@/lib/store/user-store';
import { hasPermission, roleDisplayNames, demoUsers } from '@/lib/demo-users';
import type { UserRole } from '@/types';
import { QuickCheckIn } from '@/features/dashboard/quick-check-in';
import { LatestAnnouncementCard } from '@/features/announcements/latest-announcement-card';
import {
  PersonalAttendanceChart,
  PersonalLeaveChart,
  PersonalWorkHoursChart,
  TeamAttendanceChart,
  TeamWorkloadChart,
  ApprovalTasksChart,
  CompanyAttendanceChart,
  DepartmentLeaveChart,
  DepartmentSalaryChart,
  HeadcountTrendChart,
  SaasCostTrendChart,
  SaasCostByCategoryChart,
  AssetUtilizationChart,
  SystemHealthChart,
} from '@/components/dashboard/role-based-charts';

export function DashboardContent() {
  const { currentDemoUser, switchDemoRole } = useUserStore();
  // 初期値を確実に設定（SSR/CSR一致のため）
  const [effectiveDemoUser, setEffectiveDemoUser] = useState(demoUsers.employee);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 初期化時にローカルストレージから役割を読み込み
  useEffect(() => {
    setMounted(true);

    // localStorageへの安全なアクセス
    if (typeof window !== 'undefined') {
      try {
        const storedRole = localStorage.getItem('demo-role') as UserRole;
        if (storedRole && demoUsers[storedRole]) {
          switchDemoRole(storedRole);
          setEffectiveDemoUser(demoUsers[storedRole]);
        } else if (currentDemoUser) {
          setEffectiveDemoUser(currentDemoUser);
        } else {
          setEffectiveDemoUser(demoUsers.employee);
        }
      } catch (error) {
        console.error('Failed to access localStorage:', error);
        setEffectiveDemoUser(demoUsers.employee);
      }
    }
  }, []); // 依存配列を空にして初回のみ実行

  // currentDemoUserの変更を監視してeffectiveDemoUserを同期
  useEffect(() => {
    if (mounted && currentDemoUser) {
      setEffectiveDemoUser(currentDemoUser);
    }
  }, [currentDemoUser, mounted]);

  // 固定の日本語翻訳関数
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'title': 'ダッシュボード',
      'totalEmployees': '総従業員数',
      'teamMembers': 'チームメンバー',
      'todayAttendance': '本日の出勤率',
      'pendingApprovals': '承認待ち',
      'monthlyUtilization': '月間稼働率',
      'leaveBalance': '有給残日数',
      'remainingDays': '残日数',
      'usedLeave': '使用済み',
      'pendingLeave': '申請中',
      'expiringLeave': '失効予定',
      'recentActivity': '最近のアクティビティ',
      'systemConnection': 'システム接続状況',
      'myAttendance': '私の勤怠',
      'teamApprovals': 'チーム承認待ち',
      'systemHealth': 'システム健全性',
      'userManagement': 'ユーザー管理'
    };
    return translations[key] || key;
  };

  // データを取得
  const [kpiData, setKpiData] = useState({
    totalEmployees: 50,
    teamMembers: 8,
    todayAttendance: 42,
    pendingApprovals: 8,
    monthlyUtilization: 87.5,
  });

  useEffect(() => {
    const stats = getDashboardStats();
    setKpiData({
      totalEmployees: stats.totalEmployees,
      teamMembers: 8,
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
    { id: 1, user: '田中太郎', action: '有給申請を提出', time: '5分前', type: 'leave' as const },
    { id: 2, user: '佐藤花子', action: '勤怠記録を修正', time: '15分前', type: 'attendance' as const },
    { id: 3, user: '山田次郎', action: '経費申請を承認', time: '30分前', type: 'approval' as const },
    { id: 4, user: '鈴木一郎', action: '出勤記録', time: '1時間前', type: 'attendance' as const },
  ];

  // 全ての活動（モーダル用）
  const allActivities = [
    { id: 1, user: '田中太郎', action: '有給申請を提出', time: '5分前', type: 'leave' as const },
    { id: 2, user: '佐藤花子', action: '勤怠記録を修正', time: '15分前', type: 'attendance' as const },
    { id: 3, user: '山田次郎', action: '経費申請を承認', time: '30分前', type: 'approval' as const },
    { id: 4, user: '鈴木一郎', action: '出勤記録', time: '1時間前', type: 'attendance' as const },
    { id: 5, user: '高橋美咲', action: '退勤記録', time: '2時間前', type: 'attendance' as const },
    { id: 6, user: '伊藤健太', action: '休暇申請を承認', time: '3時間前', type: 'approval' as const },
    { id: 7, user: '渡辺由美', action: '勤怠報告書を提出', time: '4時間前', type: 'report' as const },
    { id: 8, user: '中村雅人', action: 'プロフィールを更新', time: '5時間前', type: 'profile' as const },
    { id: 9, user: '小林優子', action: '給与明細を確認', time: '6時間前', type: 'payroll' as const },
    { id: 10, user: '加藤大輔', action: '有給申請を提出', time: '7時間前', type: 'leave' as const },
    { id: 11, user: '吉田春奈', action: '出勤記録', time: '8時間前', type: 'attendance' as const },
    { id: 12, user: '山口隆', action: '経費申請を提出', time: '9時間前', type: 'expense' as const },
  ];

  // 権限チェック（effectiveDemoUserを使用）
  const canViewAll = hasPermission(effectiveDemoUser, 'view_all');
  const canViewTeam = hasPermission(effectiveDemoUser, 'view_team');
  const canApprove = hasPermission(effectiveDemoUser, 'approve_requests');
  const canManageSystem = hasPermission(effectiveDemoUser, 'manage_system');

  // マウント完了までローディング表示
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* クイックアクション（打刻ボタン） - モバイルのみ表示 */}
      <div className="block md:hidden">
        <QuickCheckIn />
      </div>

      {/* 最新アナウンス */}
      <LatestAnnouncementCard />

      {/* Role-based KPI Cards */}
      <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${
        effectiveDemoUser.role === 'employee' ? 'lg:grid-cols-2' : 'lg:grid-cols-4'
      }`}>
        {/* Card 1: 従業員数/チームメンバー数 */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">
              {canViewAll ? t('totalEmployees') : canViewTeam ? t('teamMembers') : t('myAttendance')}
            </CardTitle>
            <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur">
              <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
              {canViewAll ? kpiData.totalEmployees : canViewTeam ? kpiData.teamMembers : '出勤中'}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <p className="text-xs text-orange-700 dark:text-orange-300">
                {canViewAll ? '+12 先月比' : canViewTeam ? 'チーム全員出勤' : '08:45 出勤'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: 出勤率 */}
        {(canViewAll || canViewTeam) && (
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
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {canViewAll ? kpiData.todayAttendance : '7/8'}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Activity className="h-3 w-3 text-blue-600" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  出勤率 {canViewAll ? Math.round((kpiData.todayAttendance / kpiData.totalEmployees) * 100) : 87.5}%
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card 3: 承認待ち（承認権限がある場合のみ） */}
        {canApprove && (
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">
                {canViewAll ? t('pendingApprovals') : t('teamApprovals')}
              </CardTitle>
              <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                {canViewAll ? kpiData.pendingApprovals : 3}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3 text-amber-600" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {canViewAll ? '3件は緊急' : '1件は緊急'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card 4: システム管理（管理者のみ） */}
        {canManageSystem ? (
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
                {t('systemHealth')}
              </CardTitle>
              <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">99.9%</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  稼働時間
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
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
        )}
      </div>

      {/* 一般社員専用の追加情報 */}
      {effectiveDemoUser?.role === 'employee' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              権限制限のお知らせ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              一般社員として、自分の情報のみ閲覧可能です。チームや全社の情報を見るには、マネージャー以上の権限が必要です。
            </p>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs">閲覧可能な情報：</p>
              <ul className="text-xs mt-1 space-y-1">
                <li>✅ 自分の勤怠記録</li>
                <li>✅ 自分の有給残日数</li>
                <li>❌ 他の社員の情報</li>
                <li>❌ 承認機能</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 権限別グラフセクション */}
      {effectiveDemoUser?.role === 'employee' && (
        <>
          <h2 className="text-2xl font-bold tracking-tight mt-8 mb-4">個人統計</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <PersonalAttendanceChart />
            <PersonalLeaveChart />
          </div>
          <div className="grid gap-6 mt-6">
            <PersonalWorkHoursChart />
          </div>
        </>
      )}

      {effectiveDemoUser?.role === 'manager' && (
        <>
          <h2 className="text-2xl font-bold tracking-tight mt-8 mb-4">チーム統計</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <TeamAttendanceChart />
            <TeamWorkloadChart />
          </div>
          <div className="grid gap-6 mt-6">
            <ApprovalTasksChart />
          </div>
        </>
      )}

      {effectiveDemoUser?.role === 'hr' && (
        <>
          <h2 className="text-2xl font-bold tracking-tight mt-8 mb-4">全社統計</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <CompanyAttendanceChart />
            <DepartmentLeaveChart />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mt-6">
            <DepartmentSalaryChart />
            <HeadcountTrendChart />
          </div>
        </>
      )}

      {effectiveDemoUser?.role === 'admin' && (
        <>
          <h2 className="text-2xl font-bold tracking-tight mt-8 mb-4">システム統計</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <SaasCostTrendChart />
            <SaasCostByCategoryChart />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mt-6">
            <AssetUtilizationChart />
            <SystemHealthChart />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mt-8 mb-4">全社統計（管理者用）</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <CompanyAttendanceChart />
            <DepartmentSalaryChart />
          </div>
        </>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Leave Balance Summary - 全ロール共通 */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('leaveBalance')}
            </CardTitle>
            <CardDescription>
              {canViewAll ? '組織全体の有給状況' : '現在の有給休暇の状況'}
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

        {/* Recent Activity - 権限に応じて内容を変更 */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('recentActivity')}
            </CardTitle>
            <CardDescription>
              {canViewAll ? '全社の活動' : canViewTeam ? 'チームの活動' : '自分の活動'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity
                .filter((activity, index) => {
                  if (canViewAll) return true;
                  if (canViewTeam) return index < 3;
                  return index === 0; // 自分の活動のみ
                })
                .map((activity) => (
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
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => setShowAllActivities(true)}
            >
              すべての活動を表示
            </Button>
          </CardContent>
        </Card>

        {/* System Status - システム接続状況 */}
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

      {/* Quick Actions - 役割に応じた操作 */}
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
          <CardDescription>
            {effectiveDemoUser ? `${roleDisplayNames[effectiveDemoUser.role]}として実行可能な操作` : 'よく使う操作をすばやく実行できます'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {/* 全員共通 */}
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

            {/* チーム管理者以上 */}
            {canViewTeam && (
              <Link href="/ja/members">
                <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">メンバー確認</span>
                </Button>
              </Link>
            )}

            {/* 承認権限 */}
            {canApprove && (
              <Link href="/ja/workflow">
                <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">承認待ち</span>
                </Button>
              </Link>
            )}

            {/* 管理者のみ */}
            {canManageSystem && (
              <>
                <Link href="/ja/users">
                  <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-sm">ユーザー管理</span>
                  </Button>
                </Link>
                <Link href="/ja/settings">
                  <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                    <Settings className="h-5 w-5" />
                    <span className="text-sm">システム設定</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 全ての活動を表示するモーダル */}
      <Dialog open={showAllActivities} onOpenChange={setShowAllActivities}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>すべての活動</DialogTitle>
            <DialogDescription>
              {canViewAll ? '全社の活動履歴' : canViewTeam ? 'チームの活動履歴' : '自分の活動履歴'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {allActivities
              .filter((activity, index) => {
                if (canViewAll) return true;
                if (canViewTeam) return index < 8;
                return index < 4;
              })
              .map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {activity.time}
                  </Badge>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
