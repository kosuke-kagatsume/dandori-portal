/**
 * カラーコントラストチェッカー
 *
 * WCAG 2.1準拠のカラーコントラスト計算
 */

/**
 * 相対輝度を計算
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * コントラスト比を計算
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format');
  }

  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Hex色をRGBに変換
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * WCAG AA準拠チェック
 */
export function meetsWCAG_AA(foreground: string, background: string, largeText = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * WCAG AAA準拠チェック
 */
export function meetsWCAG_AAA(foreground: string, background: string, largeText = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * カラーコントラスト情報を取得
 */
export interface ContrastInfo {
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
  passAA_large: boolean;
  passAAA_large: boolean;
}

export function getContrastInfo(foreground: string, background: string): ContrastInfo {
  const ratio = getContrastRatio(foreground, background);

  return {
    ratio,
    passAA: meetsWCAG_AA(foreground, background, false),
    passAAA: meetsWCAG_AAA(foreground, background, false),
    passAA_large: meetsWCAG_AA(foreground, background, true),
    passAAA_large: meetsWCAG_AAA(foreground, background, true),
  };
}
