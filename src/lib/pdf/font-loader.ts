/**
 * jsPDF用の日本語フォントローダー（クラスベース実装）
 * Singletonパターンでフォントキャッシュを管理
 */

import { jsPDF } from 'jspdf';
import type { FontLoaderResult } from '@/types/pdf';

/**
 * フォント設定
 */
const FONT_CONFIG = {
  FILE_NAME: 'NotoSansJP-Regular.ttf',
  FONT_NAME: 'NotoSansJP',
  FONT_STYLE: 'normal',
  FONT_PATH: '/fonts/NotoSansJP-Regular.ttf',
  FALLBACK_FONT: 'helvetica',
} as const;

/**
 * フォントキャッシュの状態
 */
interface FontCacheState {
  loaded: boolean;
  data: string | null;
  error: Error | null;
}

/**
 * PDF日本語フォントローダー（Singleton）
 */
class PDFFontLoader {
  private static instance: PDFFontLoader;
  private cache: FontCacheState;

  private constructor() {
    this.cache = {
      loaded: false,
      data: null,
      error: null,
    };
  }

  /**
   * Singletonインスタンスを取得
   */
  public static getInstance(): PDFFontLoader {
    if (!PDFFontLoader.instance) {
      PDFFontLoader.instance = new PDFFontLoader();
    }
    return PDFFontLoader.instance;
  }

  /**
   * フォントがロード済みかチェック
   */
  public isLoaded(): boolean {
    return this.cache.loaded;
  }

  /**
   * キャッシュされたフォントデータを取得
   */
  public getCachedData(): string | null {
    return this.cache.data;
  }

  /**
   * キャッシュをクリア（主にテスト用）
   */
  public clearCache(): void {
    this.cache = {
      loaded: false,
      data: null,
      error: null,
    };
  }

  /**
   * フォントをプリロード（jsPDFインスタンス不要）
   * アプリ起動時やページ表示時に呼び出すことで、後のPDF生成を高速化
   */
  public async preloadFont(): Promise<FontLoaderResult> {
    try {
      // 既にロード済みの場合はスキップ
      if (this.cache.loaded && this.cache.data) {
        console.log('[PDFFontLoader] Font already preloaded');
        return { success: true };
      }

      console.log('[PDFFontLoader] Preloading font...');
      const startTime = performance.now();

      // フォントを取得
      const response = await fetch(FONT_CONFIG.FONT_PATH);

      if (!response.ok) {
        throw new Error(`Font fetch failed: ${response.status} ${response.statusText}`);
      }

      // ArrayBufferとして取得
      const arrayBuffer = await response.arrayBuffer();

      // ArrayBufferをBase64に変換
      const base64 = this.arrayBufferToBase64(arrayBuffer);

      // キャッシュに保存
      this.cache.data = base64;
      this.cache.loaded = true;
      this.cache.error = null;

      const loadTime = Math.round(performance.now() - startTime);
      console.log(`[PDFFontLoader] Font preloaded successfully in ${loadTime}ms`);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[PDFFontLoader] Failed to preload font:', errorMessage);

      this.cache.error = error instanceof Error ? error : new Error(errorMessage);

      return {
        success: false,
        error: `フォントのプリロードに失敗しました: ${errorMessage}`,
      };
    }
  }

  /**
   * Noto Sans JP フォントを読み込んでjsPDFに登録
   */
  public async loadFont(doc: jsPDF): Promise<FontLoaderResult> {
    try {
      // 既にロード済みの場合は再利用
      if (this.cache.loaded && this.cache.data) {
        this.registerFont(doc, this.cache.data);
        return { success: true };
      }

      // プリロードされていない場合は、ここで読み込む
      const preloadResult = await this.preloadFont();
      if (!preloadResult.success) {
        throw new Error(preloadResult.error || 'Font preload failed');
      }

      // jsPDFに登録
      if (this.cache.data) {
        this.registerFont(doc, this.cache.data);
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[PDFFontLoader] Failed to load Japanese font:', errorMessage);

      // フォールバック: helveticaを使用
      this.setFallbackFont(doc);
      console.warn('[PDFFontLoader] Falling back to helvetica font');

      return {
        success: false,
        error: `日本語フォントの読み込みに失敗しました: ${errorMessage}`,
      };
    }
  }

  /**
   * jsPDFにフォントを登録
   */
  private registerFont(doc: jsPDF, base64Data: string): void {
    doc.addFileToVFS(FONT_CONFIG.FILE_NAME, base64Data);
    doc.addFont(FONT_CONFIG.FILE_NAME, FONT_CONFIG.FONT_NAME, FONT_CONFIG.FONT_STYLE);
  }

  /**
   * jsPDFに日本語フォントを設定
   */
  public setFont(doc: jsPDF): void {
    if (this.cache.loaded) {
      doc.setFont(FONT_CONFIG.FONT_NAME, FONT_CONFIG.FONT_STYLE);
    } else {
      this.setFallbackFont(doc);
      console.warn('[PDFFontLoader] Japanese font not loaded, using fallback');
    }
  }

  /**
   * フォールバックフォントを設定
   */
  private setFallbackFont(doc: jsPDF): void {
    doc.setFont(FONT_CONFIG.FALLBACK_FONT);
  }

  /**
   * ArrayBufferをBase64文字列に変換（最適化版）
   * FileReader APIを使用せず、直接変換
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000; // 32KB chunks for better performance
    const chunks: string[] = [];

    // チャンク単位で処理（メモリ効率向上）
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      chunks.push(String.fromCharCode.apply(null, Array.from(chunk)));
    }

    const binary = chunks.join('');
    return btoa(binary);
  }
}

// ===== Public API =====

/**
 * Singletonインスタンスを取得
 */
export const fontLoader = PDFFontLoader.getInstance();

/**
 * 日本語フォントを読み込んでjsPDFに登録（後方互換性維持）
 */
export async function loadJapaneseFont(doc: jsPDF): Promise<void> {
  await fontLoader.loadFont(doc);
}

/**
 * jsPDFに日本語フォントを設定（後方互換性維持）
 */
export function setJapaneseFont(doc: jsPDF): void {
  fontLoader.setFont(doc);
}

/**
 * フォントがロード済みかチェック（後方互換性維持）
 */
export function isFontLoaded(): boolean {
  return fontLoader.isLoaded();
}

// Default export for convenience
export default fontLoader;
