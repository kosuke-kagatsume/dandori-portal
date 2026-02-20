import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ExportTimeFormat } from '@/features/settings/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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