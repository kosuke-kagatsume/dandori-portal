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
export function lazyLoad<P extends Record<string, unknown> = Record<string, unknown>>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback: () => JSX.Element | null = LoadingFallback,
  ssr = false
): ComponentType<P> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Next.js dynamic の型制限のため必要
  return dynamic(importFunc as any, {
    loading: fallback,
    ssr,
  }) as ComponentType<P>;
}

/**
 * 重いチャートコンポーネントの遅延読み込み
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- recharts の複雑な型定義のため
export const LazyCharts = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- recharts の複雑な型定義のため
  BarChart: lazyLoad<any>(() => import('recharts').then(mod => ({ default: mod.BarChart }))),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- recharts の複雑な型定義のため
  LineChart: lazyLoad<any>(() => import('recharts').then(mod => ({ default: mod.LineChart }))),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- recharts の複雑な型定義のため
  PieChart: lazyLoad<any>(() => import('recharts').then(mod => ({ default: mod.PieChart }))),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- recharts の複雑な型定義のため
  AreaChart: lazyLoad<any>(() => import('recharts').then(mod => ({ default: mod.AreaChart }))),
};

/**
 * モーダル・ダイアログの遅延読み込み
 * （ユーザーがクリックするまで読み込まない）
 */
export function lazyModal<P extends Record<string, unknown> = Record<string, unknown>>(
  importFunc: () => Promise<{ default: ComponentType<P> }>
): ComponentType<P> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Next.js dynamic の型制限のため必要
  return dynamic(importFunc as any, {
    loading: () => null, // モーダルはローディング表示なし
    ssr: false, // モーダルはクライアントサイドのみ
  }) as ComponentType<P>;
}

/**
 * カレンダーコンポーネントの遅延読み込み
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- shadcn/ui Calendar の型定義のため
export const LazyCalendar = lazyLoad<any>(
  () => import('@/components/ui/calendar').then(mod => ({ default: mod.Calendar })),
  SkeletonFallback,
  false
);

/**
 * テーブルコンポーネントの遅延読み込み
 * Note: useReactTable はフックのため、コンポーネントとしてではなくラッパーが必要
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-table のフック型定義のため
export const LazyDataTable = lazyLoad<any>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-table のフック型定義のため
  () => import('@tanstack/react-table').then(mod => ({ default: mod.useReactTable as any })),
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
