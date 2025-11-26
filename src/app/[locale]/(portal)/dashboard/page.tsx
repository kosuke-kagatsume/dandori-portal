import dynamic from 'next/dynamic';
import { DashboardSkeleton } from '@/features/dashboard/dashboard-skeleton';

// ダッシュボード全体を SSR 無効化（Hydration Error 完全回避）
const DashboardContent = dynamic(
  () => import('@/features/dashboard/dashboard-content').then((mod) => ({
    default: mod.DashboardContent,
  })),
  {
    ssr: false,
    loading: () => <DashboardSkeleton />,
  }
);

export default function DashboardPage() {
  return <DashboardContent />;
}
