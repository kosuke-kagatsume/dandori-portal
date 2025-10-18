/**
 * カラーコントラスト検証ユーティリティ
 *
 * WCAG 2.1ガイドラインに基づいて、色のコントラスト比を計算し、
 * アクセシビリティ基準を満たしているかを検証します。
 *
 * 基準:
 * - WCAG AA 通常テキスト: 4.5:1
 * - WCAG AA 大きいテキスト: 3:1
 * - WCAG AAA 通常テキスト: 7:1
 * - WCAG AAA 大きいテキスト: 4.5:1
 */

/**
 * HSL色を RGB に変換
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/**
 * RGB色の相対輝度を計算
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * 2つの色のコントラスト比を計算
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(
  color1: [number, number, number],
  color2: [number, number, number]
): number {
  const lum1 = getRelativeLuminance(...color1);
  const lum2 = getRelativeLuminance(...color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * HSL文字列をパースして RGB に変換
 * 例: "hsl(199 89% 48%)" または "199 89% 48%"
 */
export function parseHslToRgb(hslString: string): [number, number, number] {
  // "hsl(199 89% 48%)" または "199 89% 48%" から数値を抽出
  const matches = hslString.match(/(\d+\.?\d*)\s+(\d+\.?\d*)%\s+(\d+\.?\d*)%/);

  if (!matches) {
    throw new Error(`Invalid HSL string: ${hslString}`);
  }

  const [, h, s, l] = matches;
  return hslToRgb(parseFloat(h), parseFloat(s), parseFloat(l));
}

/**
 * HEX色を RGB に変換
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (!result) {
    throw new Error(`Invalid HEX string: ${hex}`);
  }

  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

/**
 * WCAG基準に基づくコントラスト比の判定
 */
export interface ContrastResult {
  ratio: number;
  wcagAA: {
    normal: boolean;  // 4.5:1
    large: boolean;   // 3:1
  };
  wcagAAA: {
    normal: boolean;  // 7:1
    large: boolean;   // 4.5:1
  };
}

/**
 * コントラスト比を計算してWCAG基準との照合を行う
 */
export function checkContrast(
  foreground: [number, number, number],
  background: [number, number, number]
): ContrastResult {
  const ratio = getContrastRatio(foreground, background);

  return {
    ratio: Math.round(ratio * 100) / 100,
    wcagAA: {
      normal: ratio >= 4.5,
      large: ratio >= 3,
    },
    wcagAAA: {
      normal: ratio >= 7,
      large: ratio >= 4.5,
    },
  };
}

/**
 * CSS変数から色を取得してコントラストをチェック
 * ブラウザ環境でのみ使用可能
 */
export function checkCssVariableContrast(
  foregroundVar: string,
  backgroundVar: string
): ContrastResult | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const styles = getComputedStyle(document.documentElement);
    const fgHsl = styles.getPropertyValue(foregroundVar).trim();
    const bgHsl = styles.getPropertyValue(backgroundVar).trim();

    const fgRgb = parseHslToRgb(fgHsl);
    const bgRgb = parseHslToRgb(bgHsl);

    return checkContrast(fgRgb, bgRgb);
  } catch (error) {
    console.error('Failed to check CSS variable contrast:', error);
    return null;
  }
}

/**
 * コントラスト比の評価を文字列で返す
 */
export function getContrastRating(ratio: number): 'AAA' | 'AA' | 'Fail' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'Fail';
}

/**
 * 色の組み合わせが推奨されるか判定
 */
export function isRecommendedContrast(
  foreground: [number, number, number],
  background: [number, number, number],
  isLargeText: boolean = false
): boolean {
  const result = checkContrast(foreground, background);
  return isLargeText ? result.wcagAA.large : result.wcagAA.normal;
}

/**
 * Dandori Portalのカラーパレットを検証
 */
export function validateDandoriColors(): Record<string, ContrastResult> {
  if (typeof window === 'undefined') {
    return {};
  }

  const colorPairs = [
    { name: 'background-foreground', fg: '--foreground', bg: '--background' },
    { name: 'card-foreground', fg: '--card-foreground', bg: '--card' },
    { name: 'primary-foreground', fg: '--primary-foreground', bg: '--primary' },
    { name: 'secondary-foreground', fg: '--secondary-foreground', bg: '--secondary' },
    { name: 'muted-foreground', fg: '--muted-foreground', bg: '--muted' },
    { name: 'accent-foreground', fg: '--accent-foreground', bg: '--accent' },
    { name: 'destructive-foreground', fg: '--destructive-foreground', bg: '--destructive' },
  ];

  const results: Record<string, ContrastResult> = {};

  colorPairs.forEach(({ name, fg, bg }) => {
    const result = checkCssVariableContrast(fg, bg);
    if (result) {
      results[name] = result;
    }
  });

  return results;
}
