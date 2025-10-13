// jsPDF用の日本語フォントローダー
import { jsPDF } from 'jspdf';

// フォントキャッシュ（一度だけロード）
let fontLoaded = false;
let fontData: string | null = null;

/**
 * Noto Sans JP フォントを読み込んでjsPDFに登録
 * @param doc jsPDFインスタンス
 */
export async function loadJapaneseFont(doc: jsPDF): Promise<void> {
  // 既にロード済みの場合はスキップ
  if (fontLoaded && fontData) {
    doc.addFileToVFS('NotoSansJP-Regular.ttf', fontData);
    doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');
    return;
  }

  try {
    // publicディレクトリからフォントを取得
    const response = await fetch('/fonts/NotoSansJP-Regular.ttf');

    if (!response.ok) {
      throw new Error(`Font fetch failed: ${response.status}`);
    }

    // ArrayBufferとして取得
    const arrayBuffer = await response.arrayBuffer();

    // ArrayBufferをBase64に変換
    const base64 = arrayBufferToBase64(arrayBuffer);

    // キャッシュに保存
    fontData = base64;
    fontLoaded = true;

    // jsPDFに追加
    doc.addFileToVFS('NotoSansJP-Regular.ttf', base64);
    doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');

    console.log('[FontLoader] Noto Sans JP font loaded successfully');
  } catch (error) {
    console.error('[FontLoader] Failed to load Japanese font:', error);
    // フォールバック: helveticaを使用
    console.warn('[FontLoader] Falling back to helvetica font');
  }
}

/**
 * ArrayBufferをBase64文字列に変換
 * @param buffer ArrayBuffer
 * @returns Base64文字列
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

/**
 * jsPDFに日本語フォントを設定（フォントがロード済みの場合）
 * @param doc jsPDFインスタンス
 */
export function setJapaneseFont(doc: jsPDF): void {
  if (fontLoaded) {
    doc.setFont('NotoSansJP', 'normal');
  } else {
    // フォールバック
    doc.setFont('helvetica');
    console.warn('[FontLoader] Japanese font not loaded, using helvetica');
  }
}

/**
 * フォントがロード済みかチェック
 */
export function isFontLoaded(): boolean {
  return fontLoaded;
}
