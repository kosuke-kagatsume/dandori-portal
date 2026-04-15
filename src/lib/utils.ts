import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ExportTimeFormat } from '@/features/settings/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Date を YYYY-MM-DD 文字列に変換（タイムゾーンずれ防止用）
 * JSON.stringifyでUTC ISO文字列になる問題を回避する
 */
export function formatDateForAPI(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 日本の会計年度を取得（4月起算）
 * 1-3月は前年度扱い
 */
export function getFiscalYear(date: Date): number {
  const month = date.getMonth(); // 0-indexed: 0=Jan, 3=Apr
  const year = date.getFullYear();
  return month < 3 ? year - 1 : year;
}

/**
 * 現在の会計年度を取得
 */
export function getCurrentFiscalYear(): number {
  return getFiscalYear(new Date());
}

/**
 * 分数を指定のフォーマットで時間文字列に変換（P.22 エクスポート時間フォーマット）
 * @param minutes - 変換する分数
 * @param format - 出力フォーマット
 * @returns フォーマットされた時間文字列
 *
 * @example
 * formatTimeForExport(90, 'time')       // => "1:30"
 * formatTimeForExport(90, 'hour_minute') // => "1.30"
 * formatTimeForExport(90, 'decimal')    // => "1.50"
 * formatTimeForExport(90, 'minutes')    // => "90"
 */
export function formatTimeForExport(minutes: number, format: ExportTimeFormat): string {
  if (minutes === 0) {
    switch (format) {
      case 'time':
        return '0:00';
      case 'hour_minute':
        return '0.00';
      case 'decimal':
        return '0.00';
      case 'minutes':
        return '0';
    }
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  switch (format) {
    case 'time':
      // 時刻表示: 1:30
      return `${hours}:${mins.toString().padStart(2, '0')}`;

    case 'hour_minute':
      // 時間+分表示: 1.30 (時間.分)
      return `${hours}.${mins.toString().padStart(2, '0')}`;

    case 'decimal':
      // 小数点表示: 1.50 (時間の小数表記)
      return (minutes / 60).toFixed(2);

    case 'minutes':
      // 分表示: 90
      return minutes.toString();

    default:
      return `${hours}:${mins.toString().padStart(2, '0')}`;
  }
}

/**
 * エクスポート設定をlocalStorageから取得
 */
export function getExportSettings(): {
  timeFormat: ExportTimeFormat;
  encoding: 'utf-8' | 'shift_jis';
  dateFormat: 'YYYY-MM-DD' | 'YYYY/MM/DD' | 'MM/DD/YYYY';
} {
  const defaults = {
    timeFormat: 'time' as ExportTimeFormat,
    encoding: 'utf-8' as const,
    dateFormat: 'YYYY-MM-DD' as const,
  };

  if (typeof window === 'undefined') {
    return defaults;
  }

  try {
    const stored = localStorage.getItem('dandori_simple_settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        timeFormat: parsed.export?.timeFormat || defaults.timeFormat,
        encoding: parsed.export?.encoding || defaults.encoding,
        dateFormat: parsed.export?.dateFormat || defaults.dateFormat,
      };
    }
  } catch {
    // Ignore parse errors
  }

  return defaults;
}

/**
 * 和暦変換
 * 例: R6.4.1, H元.1.8, S64.1.7
 */
export function toWareki(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();

  let era: string;
  let eraYear: number;

  if (y >= 2019 || (y === 2019 && m >= 5)) {
    era = 'R';
    eraYear = y - 2018;
  } else if (y >= 1989 || (y === 1989 && m >= 1 && day >= 8)) {
    era = 'H';
    eraYear = y - 1988;
  } else if (y >= 1926 || (y === 1926 && m >= 12 && day >= 25)) {
    era = 'S';
    eraYear = y - 1925;
  } else {
    era = 'T';
    eraYear = y - 1911;
  }

  const eraYearStr = eraYear === 1 ? '元' : String(eraYear);
  return `${era}${eraYearStr}.${m}.${day}`;
}

/**
 * 指定年度の翌4/1時点の年齢を計算
 * 例: 令和8年度（2026）→ 2027/4/1時点の年齢
 */
export function calculateAgeAtFiscalYearEnd(birthDate: Date, fiscalYear: number): number {
  const refDate = new Date(fiscalYear + 1, 3, 1); // 翌年4/1
  const birth = new Date(birthDate);
  let age = refDate.getFullYear() - birth.getFullYear();
  const monthDiff = refDate.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * 休職履歴レコード
 */
export interface LeaveOfAbsenceRecord {
  id: string;
  startDate: string;
  endDate?: string;
  reason: string;
  notes?: string;
}

/**
 * 指定日がユーザーの休職期間中かどうかをチェック（P.21 休職・休業連携）
 * @param date - チェックする日付 (YYYY-MM-DD形式)
 * @param leaveOfAbsenceHistory - ユーザーの休職履歴
 * @returns 休職中の場合はその休職レコード、そうでなければnull
 */
export function checkLeaveOfAbsence(
  date: string,
  leaveOfAbsenceHistory?: LeaveOfAbsenceRecord[]
): LeaveOfAbsenceRecord | null {
  if (!leaveOfAbsenceHistory || leaveOfAbsenceHistory.length === 0) {
    return null;
  }

  const targetDate = new Date(date);

  for (const record of leaveOfAbsenceHistory) {
    const startDate = new Date(record.startDate);
    const endDate = record.endDate ? new Date(record.endDate) : null;

    // 開始日以降かつ（終了日がないOR終了日以前）
    if (targetDate >= startDate && (!endDate || targetDate <= endDate)) {
      return record;
    }
  }

  return null;
}

/**
 * 休職理由を日本語ラベルに変換
 */
export function getLeaveOfAbsenceReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    'medical': '傷病',
    'maternity': '産休',
    'childcare': '育休',
    'family_care': '介護休業',
    'personal': '私事都合',
    'other': 'その他',
  };
  return labels[reason] || reason;
}