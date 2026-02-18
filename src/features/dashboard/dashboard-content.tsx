'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Users,
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
import { useDashboardStore } from '@/lib/store/dashboard-store';
import { type UserRole, ROLE_LABELS } from '@/lib/rbac';
import { LatestAnnouncementCard } from '@/features/announcements/latest-announcement-card';
import {
  DepartmentLeaveChart,
  DepartmentSalaryChart,
  HeadcountTrendChart,
  SaasCostTrendChart,
  SaasCostByCategoryChart,
  AssetUtilizationChart,
} from '@/components/dashboard/role-based-charts';

export function DashboardContent() {
  const { currentUser } = useUserStore();
  const { kpiData, isLoading: isLoadingStats, fetchDashboardStats } = useDashboardStore();
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ダッシュボード表示設定（設定でON/OFF可能な項目）
  const [dashboardSettings, setDashboardSettings] = useState({
    showLeaveBalance: false,      // 有給残日数（デフォルト非表示）
    showRecentActivity: false,    // 最近のアクティビティ（デフォルト非表示）
    showSystemStatus: false,      // システム接続状況（デフォルト非表示）
    showAttendanceButton: true,   // 勤怠打刻ボタン（デフォルト表示）
    showLeaveRequestButton: true, // 休暇申請ボタン（デフォルト表示）
  });

  // ローカルストレージから設定を読み込み
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('dashboard-display-settings');
        if (savedSettings) {
          setDashboardSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Failed to load dashboard settings:', error);
      }
    }
  }, []);

  // 本番ユーザーのロールを取得
  const getCurrentUserRole = (): UserRole => {
    if (currentUser?.roles && currentUser.roles.length > 0) {
      return currentUser.roles[0] as UserRole;
    }
    return 'employee';
  };

  const currentUserRole = getCurrentUserRole();

  // マウント完了を設定
  useEffect(() => {
    setMounted(true);
  }, []);

  // 固定の日本語翻訳関数
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'title': 'ダッシュボード',
      'totalEmployees': '総従業員数',
      'teamMembers': 'チームメンバー',
      'todayAttendance': '本日の出勤率',
      'pendingApprovals': '承認待ち',
      'approvalRequests': '承認依頼',
      'myPendingRequests': '申請中',
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

  // ダッシュボードデータを取得
  useEffect(() => {
    if (mounted) {
      fetchDashboardStats();
    }
  }, [mounted, fetchDashboardStats]);

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

  // 権限チェック（本番ユーザーのロールを使用）
  const rolePermissions: Record<UserRole, { viewAll: boolean; viewTeam: boolean; approve: boolean; manageSystem: boolean; manageUsers: boolean }> = {
    employee: { viewAll: false, viewTeam: false, approve: false, manageSystem: false, manageUsers: false },
    manager: { viewAll: false, viewTeam: true, approve: true, manageSystem: false, manageUsers: false },
    executive: { viewAll: true, viewTeam: true, approve: true, manageSystem: false, manageUsers: true },
    hr: { viewAll: true, viewTeam: true, approve: true, manageSystem: false, manageUsers: true },
    admin: { viewAll: true, viewTeam: true, approve: true, manageSystem: true, manageUsers: true },
    applicant: { viewAll: false, viewTeam: false, approve: false, manageSystem: false, manageUsers: false },
  };

  const permissions = rolePermissions[currentUserRole] || rolePermissions.employee;
  const canViewAll = permissions.viewAll;
  const canViewTeam = permissions.viewTeam;
  const canApprove = permissions.approve;
  const canManageSystem = permissions.manageSystem;
  const canManageUsers = permissions.manageUsers;

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
      {/* ページタイトル */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {currentUser ? `${ROLE_LABELS[currentUserRole]}としてログイン中` : '今日の概要と重要な指標を確認できます'}
        </p>
      </div>

      {/* クイックアクション - ページTOPに移動 */}
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
          <CardDescription>
            {currentUser ? `${ROLE_LABELS[currentUserRole]}として実行可能な操作` : 'よく使う操作をすばやく実行できます'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {/* 全員共通: 勤怠打刻（ON/OFF設定可能） */}
            {dashboardSettings.showAttendanceButton && (
              <Link href="/ja/attendance">
                <Button className="h-16 w-full flex flex-col space-y-1">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm">勤怠打刻</span>
                </Button>
              </Link>
            )}
            {/* 全員共通: 休暇申請（ON/OFF設定可能） */}
            {dashboardSettings.showLeaveRequestButton && (
              <Link href="/ja/leave">
                <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">休暇申請</span>
                </Button>
              </Link>
            )}
            {/* 全員共通: メンバー確認 */}
            <Link href="/ja/members">
              <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                <Users className="h-5 w-5" />
                <span className="text-sm">メンバー確認</span>
              </Button>
            </Link>
            {/* 承認権限: 承認待ち */}
            {canApprove && (
              <Link href="/ja/workflow">
                <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">承認待ち</span>
                </Button>
              </Link>
            )}
            {/* ユーザー管理権限（admin + hr） */}
            {canManageUsers && (
              <Link href="/ja/users">
                <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="text-sm">ユーザー管理</span>
                </Button>
              </Link>
            )}
            {/* システム管理者のみ: システム設定 */}
            {canManageSystem && (
              <Link href="/ja/settings">
                <Button variant="outline" className="h-16 w-full flex flex-col space-y-1">
                  <Settings className="h-5 w-5" />
                  <span className="text-sm">システム設定</span>
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 最新アナウンス */}
      <LatestAnnouncementCard />

      {/* Role-based KPI Cards - 新しい構成 */}
      <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${
        canViewAll ? 'lg:grid-cols-4' : canApprove ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
      }`}>
        {/* Card 1: 総従業員数（管理者系のみ） */}
        {canViewAll && (
          <Link href="/ja/users">
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 cursor-pointer">
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
                <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                  {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : kpiData.totalEmployees}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    アクティブユーザー
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Card: 本日の出勤状況 */}
        <Link href="/ja/members">
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
                {t('todayAttendance')}
              </CardTitle>
              <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur">
                <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : `${kpiData.attendanceRate}%`}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Users className="h-3 w-3 text-green-600" />
                <p className="text-xs text-green-700 dark:text-green-300">
                  {isLoadingStats ? '...' : `${kpiData.todayAttendance}名出勤中`}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: 承認依頼（自分が承認すべきもの）- 承認権限がある場合 */}
        {canApprove && (
          <Link href="/ja/workflow">
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  {t('approvalRequests')}
                </CardTitle>
                <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                  {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : (canViewAll ? kpiData.pendingApprovals : 3)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-amber-600" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    自分が承認すべき申請
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Card 3: 申請中（自分の申請）- 全員表示 */}
        <Link href="/ja/workflow">
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {t('myPendingRequests')}
              </CardTitle>
              <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : 2}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Activity className="h-3 w-3 text-blue-600" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  未承認の申請
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 権限別グラフセクション - 要件に応じて表示を制御 */}

      {/* 人事: 部門別休暇取得率 + 入退社予定リスト */}
      {currentUserRole === 'hr' && (
        <>
          <h2 className="text-2xl font-bold tracking-tight mt-8 mb-4">全社統計</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <DepartmentLeaveChart />
            <HeadcountTrendChart />
          </div>
        </>
      )}

      {/* 経営者: SaaSコスト + 資産利用状況 + 部門別平均給与 + 入退社予定リスト */}
      {currentUserRole === 'executive' && (
        <>
          <h2 className="text-2xl font-bold tracking-tight mt-8 mb-4">経営統計</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <SaasCostTrendChart />
            <SaasCostByCategoryChart />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mt-6">
            <AssetUtilizationChart />
            <DepartmentSalaryChart />
          </div>
          <div className="grid gap-6 mt-6">
            <HeadcountTrendChart />
          </div>
        </>
      )}

      {/* システム管理者: SaaSコスト + 資産利用状況 */}
      {currentUserRole === 'admin' && (
        <>
          <h2 className="text-2xl font-bold tracking-tight mt-8 mb-4">システム統計</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <SaasCostTrendChart />
            <SaasCostByCategoryChart />
          </div>
          <div className="grid gap-6 mt-6">
            <AssetUtilizationChart />
          </div>
        </>
      )}

      {/* 設定でON/OFF可能な項目 */}
      {(dashboardSettings.showLeaveBalance || dashboardSettings.showRecentActivity || dashboardSettings.showSystemStatus) && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Leave Balance Summary - 設定でON/OFF */}
          {dashboardSettings.showLeaveBalance && (
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
          )}

          {/* Recent Activity - 設定でON/OFF */}
          {dashboardSettings.showRecentActivity && (
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
                      return index === 0;
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
          )}

          {/* System Status - 設定でON/OFF */}
          {dashboardSettings.showSystemStatus && (
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
          )}
        </div>
      )}

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
