/**
 * 遅延読み込み用コンポーネントユーティリティ
 *
 * Next.js 14のdynamic importを活用したコード分割
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

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
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback: ComponentType = LoadingFallback,
  ssr = false
) {
  return dynamic(importFunc, {
    loading: fallback,
    ssr,
  });
}

/**
 * 重いチャートコンポーネントの遅延読み込み
 */
export const LazyCharts = {
  BarChart: lazyLoad(() => import('recharts').then(mod => ({ default: mod.BarChart }))),
  LineChart: lazyLoad(() => import('recharts').then(mod => ({ default: mod.LineChart }))),
  PieChart: lazyLoad(() => import('recharts').then(mod => ({ default: mod.PieChart }))),
  AreaChart: lazyLoad(() => import('recharts').then(mod => ({ default: mod.AreaChart }))),
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
  () => import('@/components/ui/calendar').then(mod => ({ default: mod.Calendar })),
  SkeletonFallback,
  false
);

/**
 * テーブルコンポーネントの遅延読み込み
 */
export const LazyDataTable = lazyLoad(
  () => import('@tanstack/react-table').then(mod => ({ default: mod.useReactTable })),
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
