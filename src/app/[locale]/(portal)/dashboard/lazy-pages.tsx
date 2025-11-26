'use client';

import { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// ローディングコンポーネント
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    </div>
  );
}

// カードローダー（小さいコンポーネント用）
function CardLoader() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </CardContent>
    </Card>
  );
}

// 遅延ロードされるページコンポーネント
export const LazyUsersPage = lazy(() => import('../users/page'));
export const LazyMembersPage = lazy(() => import('../members/page'));
export const LazyAttendancePage = lazy(() => import('../attendance/page'));
export const LazyLeavePage = lazy(() => import('../leave/page'));
export const LazyWorkflowPage = lazy(() => import('../workflow/page'));
export const LazySettingsPage = lazy(() => import('../settings/page'));

// 遅延ロードされる大きなコンポーネント
export const LazyDataTable = lazy(() =>
  import('@/components/ui/common/virtual-data-table').then(module => ({
    default: module.VirtualDataTable
  }))
);

// Suspenseラッパー
export function SuspenseWrapper({ children, fallback = <PageLoader /> }: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

// ページごとのSuspenseラッパー
export function LazyUsersPageWrapper() {
  return (
    <SuspenseWrapper>
      <LazyUsersPage />
    </SuspenseWrapper>
  );
}

export function LazyMembersPageWrapper() {
  return (
    <SuspenseWrapper>
      <LazyMembersPage />
    </SuspenseWrapper>
  );
}

export function LazyAttendancePageWrapper() {
  return (
    <SuspenseWrapper>
      <LazyAttendancePage />
    </SuspenseWrapper>
  );
}

export function LazyLeavePageWrapper() {
  return (
    <SuspenseWrapper>
      <LazyLeavePage />
    </SuspenseWrapper>
  );
}

export function LazyWorkflowPageWrapper() {
  return (
    <SuspenseWrapper>
      <LazyWorkflowPage />
    </SuspenseWrapper>
  );
}