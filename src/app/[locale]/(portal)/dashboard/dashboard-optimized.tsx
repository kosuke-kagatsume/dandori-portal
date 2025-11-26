'use client';

import { Suspense, lazy, memo, useMemo, useCallback } from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { HoverCard } from '@/components/motion/hover-card';
import { StaggerContainer, StaggerItem } from '@/components/motion/page-transition';
import {
  Users,
  UserCheck,
  AlertCircle,
  Calendar,
  TrendingUp,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useUserStore } from '@/lib/store/user-store';
import { hasPermission, roleDisplayNames, demoUsers } from '@/lib/demo-users';
import { useCachedData } from '@/lib/cache-service';
import { usePerformanceTracking } from '@/lib/performance';
import type { UserRole } from '@/types';

// 重いコンポーネントを動的インポート
const ActivityFeed = lazy(() => import('./components/activity-feed'));
const SystemStatus = lazy(() => import('./components/system-status'));
const QuickActions = lazy(() => import('./components/quick-actions'));

// KPIカードをメモ化
const KPICard = memo(({
  title,
  value,
  trend,
  icon: Icon,
  gradient,
}: {
  title: string;
  value: string | number;
  trend?: string;
  icon: LucideIcon;
  gradient: string;
}) => (
  <HoverCard hoverScale={1.03}>
    <Card className={`relative overflow-hidden border-0 shadow-lg transition-all duration-300 bg-gradient-to-br ${gradient}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-16 -mt-16" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg backdrop-blur">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <p className="text-xs">{trend}</p>
          </div>
        )}
      </CardContent>
    </Card>
  </HoverCard>
));

KPICard.displayName = 'KPICard';

// ローディングスケルトン
const CardSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48 mt-2" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-3 w-full" />
    </CardContent>
  </Card>
);

export default function OptimizedDashboard() {
  // パフォーマンス追跡
  const cleanup = usePerformanceTracking('OptimizedDashboard');
  
  const { currentDemoUser, switchDemoRole } = useUserStore();
  const [effectiveDemoUser, setEffectiveDemoUser] = useState(currentDemoUser);
  
  // 初期化時にローカルストレージから役割を読み込み
  useEffect(() => {
    const storedRole = localStorage.getItem('demo-role') as UserRole;
    if (storedRole && demoUsers[storedRole]) {
      switchDemoRole(storedRole);
      setEffectiveDemoUser(demoUsers[storedRole]);
    } else if (currentDemoUser) {
      setEffectiveDemoUser(currentDemoUser);
    } else {
      setEffectiveDemoUser(demoUsers.employee);
    }
    
    return cleanup;
  }, []);
  
  // 固定の日本語翻訳をメモ化
  const translations: Record<string, string> = useMemo(() => ({
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
  }), []);

  const t = useCallback((key: string): string => translations[key] || key, [translations]);

  // キャッシュされたデータ取得
  const { data: kpiData, loading: kpiLoading } = useCachedData(
    'dashboard-kpi',
    async () => {
      // 実際のAPIコールをシミュレート
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        totalEmployees: 50,
        teamMembers: 8,
        todayAttendance: 42,
        pendingApprovals: 8,
        monthlyUtilization: 87.5,
      };
    },
    { ttl: 5 * 60 * 1000 } // 5分キャッシュ
  );

  const { data: leaveBalance, loading: leaveLoading } = useCachedData(
    'dashboard-leave',
    async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return {
        remaining: 12,
        used: 8,
        pending: 2,
        expiring: 3,
      };
    },
    { ttl: 10 * 60 * 1000 } // 10分キャッシュ
  );

  // 権限チェック（メモ化）
  const permissions = useMemo(() => ({
    canViewAll: hasPermission(effectiveDemoUser, 'view_all'),
    canViewTeam: hasPermission(effectiveDemoUser, 'view_team'),
    canApprove: hasPermission(effectiveDemoUser, 'approve_requests'),
    canManageSystem: hasPermission(effectiveDemoUser, 'manage_system'),
  }), [effectiveDemoUser]);

  // KPIカードの設定をメモ化
  const kpiCards = useMemo(() => {
    const cards = [];
    
    // Card 1: 従業員数/チームメンバー数
    cards.push({
      title: permissions.canViewAll ? t('totalEmployees') : permissions.canViewTeam ? t('teamMembers') : t('myAttendance'),
      value: permissions.canViewAll ? (kpiData?.totalEmployees ?? 0) : permissions.canViewTeam ? (kpiData?.teamMembers ?? 0) : '出勤中',
      trend: permissions.canViewAll ? '+12 先月比' : permissions.canViewTeam ? 'チーム全員出勤' : '08:45 出勤',
      icon: Users,
      gradient: 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900',
    });

    // Card 2: 出勤率
    if (permissions.canViewAll || permissions.canViewTeam) {
      cards.push({
        title: t('todayAttendance'),
        value: permissions.canViewAll ? (kpiData?.todayAttendance ?? 0) : '7/8',
        trend: `出勤率 ${permissions.canViewAll && kpiData ? Math.round((kpiData.todayAttendance / kpiData.totalEmployees) * 100) : 87.5}%`,
        icon: UserCheck,
        gradient: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900',
      });
    }

    // Card 3: 承認待ち
    if (permissions.canApprove) {
      cards.push({
        title: permissions.canViewAll ? t('pendingApprovals') : t('teamApprovals'),
        value: permissions.canViewAll ? (kpiData?.pendingApprovals ?? 0) : 3,
        trend: permissions.canViewAll ? '3件は緊急' : '1件は緊急',
        icon: AlertCircle,
        gradient: 'from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900',
      });
    }

    // Card 4: システム管理/稼働率
    cards.push({
      title: permissions.canManageSystem ? t('systemHealth') : t('monthlyUtilization'),
      value: permissions.canManageSystem ? '99.9%' : `${kpiData?.monthlyUtilization ?? 0}%`,
      trend: permissions.canManageSystem ? '稼働時間' : '+2.1% 先月比',
      icon: permissions.canManageSystem ? ShieldCheck : TrendingUp,
      gradient: permissions.canManageSystem
        ? 'from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900'
        : 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900',
    });

    return cards;
  }, [permissions, kpiData, t]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {effectiveDemoUser ? `${effectiveDemoUser.name}さん（${roleDisplayNames[effectiveDemoUser.role] || effectiveDemoUser.role}）のダッシュボード` : '今日の概要と重要な指標を確認できます'}
        </p>
        {effectiveDemoUser && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={
              effectiveDemoUser.role === 'admin' ? 'destructive' :
              effectiveDemoUser.role === 'hr' ? 'default' :
              effectiveDemoUser.role === 'manager' ? 'secondary' :
              'outline'
            }>
              {effectiveDemoUser.role === 'employee' && '👤 自分の情報のみ表示'}
              {effectiveDemoUser.role === 'manager' && '👥 チーム8名の情報を表示'}
              {effectiveDemoUser.role === 'hr' && '🏢 全社50名の情報を表示'}
              {effectiveDemoUser.role === 'admin' && '⚙️ システム管理機能付き'}
            </Badge>
          </div>
        )}
      </div>

      {/* KPI Cards with Loading State */}
      <StaggerContainer>
        <div className={`grid gap-4 md:grid-cols-2 ${
          effectiveDemoUser?.role === 'employee' ? 'lg:grid-cols-2' : 'lg:grid-cols-4'
        }`}>
          {kpiLoading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              {(permissions.canViewAll || permissions.canViewTeam) && <CardSkeleton />}
              {permissions.canApprove && <CardSkeleton />}
            </>
          ) : (
            kpiCards.map((card, index) => (
              <StaggerItem key={index}>
                <KPICard {...card} />
              </StaggerItem>
            ))
          )}
        </div>
      </StaggerContainer>

      {/* Employee Notice */}
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Leave Balance Summary */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('leaveBalance')}
            </CardTitle>
            <CardDescription>
              {permissions.canViewAll ? '組織全体の有給状況' : '現在の有給休暇の状況'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {leaveLoading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-4 w-full" />
              </>
            ) : leaveBalance && (
              <>
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity - Lazy Loaded */}
        <Suspense fallback={<CardSkeleton />}>
          <ActivityFeed
            permissions={permissions}
            t={t}
          />
        </Suspense>

        {/* System Status - Lazy Loaded */}
        <Suspense fallback={<CardSkeleton />}>
          <SystemStatus
            permissions={permissions}
            t={t}
          />
        </Suspense>
      </div>

      {/* Quick Actions - Lazy Loaded */}
      <Suspense fallback={<CardSkeleton />}>
        <QuickActions
          effectiveDemoUser={effectiveDemoUser}
          permissions={permissions}
        />
      </Suspense>
    </div>
  );
}