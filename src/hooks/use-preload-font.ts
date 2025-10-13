/**
 * PDF日本語フォントをプリロードするReact Hook
 * 給与管理・勤怠管理などのPDF出力機能を持つページで使用
 */

'use client';

import { useEffect, useState } from 'react';
import { fontLoader } from '@/lib/pdf/font-loader';

interface UsePreloadFontResult {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}

/**
 * PDF用日本語フォントをプリロードするHook
 *
 * @example
 * ```tsx
 * function PayrollPage() {
 *   const { isLoading, isLoaded, error } = usePreloadFont();
 *
 *   if (isLoading) return <div>フォント読み込み中...</div>;
 *   if (error) return <div>エラー: {error}</div>;
 *
 *   return <div>給与明細ページ</div>;
 * }
 * ```
 */
export function usePreloadFont(): UsePreloadFontResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 既にロード済みの場合はスキップ
    if (fontLoader.isLoaded()) {
      setIsLoaded(true);
      return;
    }

    // フォントをプリロード
    const preload = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fontLoader.preloadFont();

        if (result.success) {
          setIsLoaded(true);
        } else {
          setError(result.error || 'フォントの読み込みに失敗しました');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '不明なエラー';
        setError(errorMessage);
        console.error('[usePreloadFont] Failed to preload font:', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    preload();
  }, []);

  return { isLoading, isLoaded, error };
}

/**
 * フォントプリロードをバックグラウンドで実行するHook
 * ローディング表示なしでサイレントにプリロード
 *
 * @example
 * ```tsx
 * function App() {
 *   usePreloadFontSilent(); // バックグラウンドでプリロード
 *   return <AppContent />;
 * }
 * ```
 */
export function usePreloadFontSilent(): void {
  useEffect(() => {
    if (!fontLoader.isLoaded()) {
      fontLoader.preloadFont().catch((err) => {
        console.warn('[usePreloadFontSilent] Font preload failed (silent):', err);
      });
    }
  }, []);
}
