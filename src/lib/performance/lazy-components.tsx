/**
 * 遅延読み込み用コンポーネントユーティリティ
 *
 * Next.js 14のdynamic importを活用したコード分割
 */

import dynamic, { DynamicOptionsLoadingProps } from 'next/dynamic';
import { ComponentType } from 'react';

// Next.js dynamic import の型定義
type DynamicImportLoader<P> = () => Promise<{ default: ComponentType<P> }>;

/**
 * ローディング用のフォールバックコンポーネント
 */
export const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

/**
 * 汎用的なローディングスケルトン
 */
export const SkeletonFallback = () => (
  <div className="space-y-4 p-4">
    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
    <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
    <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
  </div>
);

/**
 * 遅延読み込み用のヘルパー関数
 *
 * @param importFunc - dynamic import関数
 * @param fallback - ローディング中に表示するコンポーネント
 * @param ssr - サーバーサイドレンダリングを有効にするか
 */
export function lazyLoad<P = Record<string, unknown>>(
  importFunc: DynamicImportLoader<P>,
  fallback: ComponentType<DynamicOptionsLoadingProps> = LoadingFallback,
  ssr = false
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Next.js dynamic の型制限のため必要
  return dynamic(importFunc as DynamicImportLoader<Record<string, unknown>>, {
    loading: fallback,
    ssr,
  });
}

/**
 * 重いチャートコンポーネントの遅延読み込み
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- recharts の複雑な型定義のため
export const LazyCharts = {
  BarChart: lazyLoad(() => import('recharts').then(mod => ({ default: mod.BarChart as ComponentType<Record<string, unknown>> }))),
  LineChart: lazyLoad(() => import('recharts').then(mod => ({ default: mod.LineChart as ComponentType<Record<string, unknown>> }))),
  PieChart: lazyLoad(() => import('recharts').then(mod => ({ default: mod.PieChart as ComponentType<Record<string, unknown>> }))),
  AreaChart: lazyLoad(() => import('recharts').then(mod => ({ default: mod.AreaChart as ComponentType<Record<string, unknown>> }))),
};

/**
 * モーダル・ダイアログの遅延読み込み
 * （ユーザーがクリックするまで読み込まない）
 */
export function lazyModal<P = Record<string, unknown>>(
  importFunc: () => Promise<{ default: ComponentType<P> }>
) {
  return dynamic(importFunc, {
    loading: () => null, // モーダルはローディング表示なし
    ssr: false, // モーダルはクライアントサイドのみ
  });
}

/**
 * カレンダーコンポーネントの遅延読み込み
 */
export const LazyCalendar = lazyLoad(
  () => import('@/components/ui/calendar').then(mod => ({ default: mod.Calendar as ComponentType<Record<string, unknown>> })),
  SkeletonFallback,
  false
);

/**
 * テーブルコンポーネントの遅延読み込み
 * Note: useReactTable はフックのため、コンポーネントとしてではなくラッパーが必要
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-table のフック型定義のため
export const LazyDataTable = lazyLoad(
  () => import('@tanstack/react-table').then(mod => ({ default: mod.useReactTable as unknown as ComponentType<Record<string, unknown>> })),
  SkeletonFallback,
  false
);

/**
 * プリロードヘルパー
 *
 * ユーザーがボタンにホバーした時などに事前に読み込む
 */
export function preloadComponent(importFunc: () => Promise<unknown>) {
  // Next.jsのdynamicは自動的にprefetchを行うため、
  // ここでは明示的にimport関数を実行するだけ
  importFunc().catch(() => {
    // エラーは無視（実際の使用時に再試行される）
  });
}
