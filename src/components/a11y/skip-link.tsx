'use client';

import { cn } from '@/lib/utils';

/**
 * スキップリンク - スクリーンリーダーとキーボードユーザーのためのナビゲーション補助
 *
 * メインコンテンツへジャンプするリンクを提供し、繰り返しのナビゲーションをスキップできるようにします。
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className={cn(
        // デフォルトは画面外に配置
        'sr-only',
        // フォーカス時のみ表示
        'focus:not-sr-only',
        'focus:absolute',
        'focus:top-4',
        'focus:left-4',
        'focus:z-50',
        'focus:inline-block',
        'focus:rounded-md',
        'focus:bg-primary',
        'focus:px-4',
        'focus:py-2',
        'focus:text-primary-foreground',
        'focus:shadow-lg',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-ring',
        'focus:ring-offset-2'
      )}
    >
      メインコンテンツへスキップ
    </a>
  );
}

/**
 * スクリーンリーダー専用テキスト
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

/**
 * ライブリージョン - 動的コンテンツの変更を通知
 */
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = false,
  relevant = 'additions text',
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  );
}
