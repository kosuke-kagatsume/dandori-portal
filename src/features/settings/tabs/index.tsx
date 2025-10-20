/**
 * Settings タブコンポーネントのDynamic import
 *
 * 各タブは初めて表示される時のみロードされます
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
    <span className="ml-2 text-sm text-muted-foreground">読み込み中...</span>
  </div>
);

// 各タブを動的にインポート（初回表示時のみロード）
export const AppearanceTab = dynamic(
  () => import('./AppearanceTab').then(mod => ({ default: mod.AppearanceTab })),
  { loading: LoadingFallback, ssr: false }
);

export const RegionalTab = dynamic(
  () => import('./RegionalTab').then(mod => ({ default: mod.RegionalTab })),
  { loading: LoadingFallback, ssr: false }
);

export const CompanyTab = dynamic(
  () => import('./CompanyTab').then(mod => ({ default: mod.CompanyTab })),
  { loading: LoadingFallback, ssr: false }
);

export const PayrollTab = dynamic(
  () => import('./PayrollTab').then(mod => ({ default: mod.PayrollTab })),
  { loading: LoadingFallback, ssr: false }
);

export const YearEndTab = dynamic(
  () => import('./YearEndTab').then(mod => ({ default: mod.YearEndTab })),
  { loading: LoadingFallback, ssr: false }
);

export const AttendanceTab = dynamic(
  () => import('./AttendanceTab').then(mod => ({ default: mod.AttendanceTab })),
  { loading: LoadingFallback, ssr: false }
);

export const AssetsTab = dynamic(
  () => import('./AssetsTab').then(mod => ({ default: mod.AssetsTab })),
  { loading: LoadingFallback, ssr: false }
);

export const SaaSTab = dynamic(
  () => import('./SaaSTab').then(mod => ({ default: mod.SaaSTab })),
  { loading: LoadingFallback, ssr: false }
);

export const WorkflowTab = dynamic(
  () => import('./WorkflowTab').then(mod => ({ default: mod.WorkflowTab })),
  { loading: LoadingFallback, ssr: false }
);

export const DataTab = dynamic(
  () => import('./DataTab').then(mod => ({ default: mod.DataTab })),
  { loading: LoadingFallback, ssr: false }
);

export const SystemTab = dynamic(
  () => import('./SystemTab').then(mod => ({ default: mod.SystemTab })),
  { loading: LoadingFallback, ssr: false }
);
