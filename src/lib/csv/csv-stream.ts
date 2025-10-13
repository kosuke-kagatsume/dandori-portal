/**
 * CSV大量データ対応ストリーミング処理
 * 数千～数万行のデータを効率的に処理
 */

import type { AttendanceRecord, PayrollRecord, BonusRecord, CSVExportResult } from '@/types/csv';
import {
  getWorkLocationLabel,
  getStatusLabel,
  getApprovalStatusLabel,
  getBonusTypeLabel,
} from '@/config/labels';

/**
 * ストリーミング処理のオプション
 */
export interface StreamOptions {
  /**
   * チャンクサイズ（一度に処理する行数）
   * デフォルト: 500行
   */
  chunkSize?: number;

  /**
   * 進捗コールバック
   */
  onProgress?: (progress: { processed: number; total: number; percentage: number }) => void;
}

/**
 * CSVエスケープ処理
 */
const escapeCSV = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * 配列をチャンクに分割
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * 現在日付を取得
 */
const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * 勤怠データをストリーミングCSV出力（大量データ対応）
 */
export async function exportAttendanceToCSVStream(
  records: AttendanceRecord[],
  filename?: string,
  options: StreamOptions = {}
): Promise<CSVExportResult> {
  try {
    if (!records || records.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const { chunkSize = 500, onProgress } = options;

    console.log(`[CSVStream] Starting export of ${records.length} records`);
    const startTime = performance.now();

    // ヘッダー
    const headers = [
      '従業員ID',
      '従業員名',
      '日付',
      '出勤時刻',
      '退勤時刻',
      '休憩開始',
      '休憩終了',
      '休憩時間(分)',
      '勤務時間(分)',
      '残業時間(分)',
      '勤務場所',
      'ステータス',
      '承認状況',
      'メモ',
    ];

    const headerRow = headers.map(escapeCSV).join(',');
    const chunks: string[] = [headerRow];

    // チャンク単位で処理
    const dataChunks = chunkArray(records, chunkSize);
    let processed = 0;

    for (const chunk of dataChunks) {
      const rows = chunk.map((record) => {
        const row = [
          record.userId,
          record.userName,
          record.date,
          record.checkIn || '',
          record.checkOut || '',
          record.breakStart || '',
          record.breakEnd || '',
          record.totalBreakMinutes,
          record.workMinutes,
          record.overtimeMinutes,
          getWorkLocationLabel(record.workLocation),
          getStatusLabel(record.status),
          getApprovalStatusLabel(record.approvalStatus),
          record.memo || '',
        ];
        return row.map(escapeCSV).join(',');
      });

      chunks.push(rows.join('\n'));
      processed += chunk.length;

      // 進捗を通知
      onProgress?.({
        processed,
        total: records.length,
        percentage: Math.round((processed / records.length) * 100),
      });

      // UIをブロックしないように、次のチャンクの前に少し待機
      if (processed < records.length) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    // CSVを結合
    const csvString = chunks.join('\n');

    // ダウンロード
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `attendance_${getCurrentDate()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const duration = Math.round(performance.now() - startTime);
    console.log(`[CSVStream] Export completed in ${duration}ms`);

    return {
      success: true,
      recordCount: records.length,
    };
  } catch (error) {
    console.error('Failed to export attendance CSV (stream):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '勤怠CSVの出力に失敗しました',
      recordCount: 0,
    };
  }
}

/**
 * 給与データをストリーミングCSV出力（大量データ対応）
 */
export async function exportPayrollToCSVStream(
  records: PayrollRecord[],
  filename?: string,
  options: StreamOptions = {}
): Promise<CSVExportResult> {
  try {
    if (!records || records.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const { chunkSize = 500, onProgress } = options;
    const startTime = performance.now();

    const headers = [
      '従業員ID',
      '従業員名',
      '部署',
      '支給年月',
      '基本給',
      '手当合計',
      '総支給額',
      '控除合計',
      '差引支給額',
      'ステータス',
      '支払日',
    ];

    const headerRow = headers.map(escapeCSV).join(',');
    const chunks: string[] = [headerRow];

    const dataChunks = chunkArray(records, chunkSize);
    let processed = 0;

    for (const chunk of dataChunks) {
      const rows = chunk.map((record) => {
        const row = [
          record.employeeId,
          record.employeeName,
          record.department,
          record.period,
          record.basicSalary,
          record.totalAllowances,
          record.basicSalary + record.totalAllowances,
          record.totalDeductions,
          record.netSalary,
          getStatusLabel(record.status),
          record.paymentDate || '',
        ];
        return row.map(escapeCSV).join(',');
      });

      chunks.push(rows.join('\n'));
      processed += chunk.length;

      onProgress?.({
        processed,
        total: records.length,
        percentage: Math.round((processed / records.length) * 100),
      });

      if (processed < records.length) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    const csvString = chunks.join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `payroll_${getCurrentDate()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const duration = Math.round(performance.now() - startTime);
    console.log(`[CSVStream] Payroll export completed in ${duration}ms`);

    return {
      success: true,
      recordCount: records.length,
    };
  } catch (error) {
    console.error('Failed to export payroll CSV (stream):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '給与CSVの出力に失敗しました',
      recordCount: 0,
    };
  }
}

/**
 * 賞与データをストリーミングCSV出力（大量データ対応）
 */
export async function exportBonusToCSVStream(
  records: BonusRecord[],
  filename?: string,
  options: StreamOptions = {}
): Promise<CSVExportResult> {
  try {
    if (!records || records.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const { chunkSize = 500, onProgress } = options;
    const startTime = performance.now();

    const headers = [
      '従業員ID',
      '従業員名',
      '部署',
      '支給年月',
      '賞与種別',
      '基本賞与',
      '査定賞与',
      '査定評価',
      '控除合計',
      '差引支給額',
      'ステータス',
      '支払日',
    ];

    const headerRow = headers.map(escapeCSV).join(',');
    const chunks: string[] = [headerRow];

    const dataChunks = chunkArray(records, chunkSize);
    let processed = 0;

    for (const chunk of dataChunks) {
      const rows = chunk.map((record) => {
        const row = [
          record.employeeId,
          record.employeeName,
          record.department,
          record.period,
          getBonusTypeLabel(record.bonusType),
          record.basicBonus,
          record.performanceBonus,
          record.performanceRating,
          record.totalDeductions,
          record.netBonus,
          getStatusLabel(record.status),
          record.paymentDate || '',
        ];
        return row.map(escapeCSV).join(',');
      });

      chunks.push(rows.join('\n'));
      processed += chunk.length;

      onProgress?.({
        processed,
        total: records.length,
        percentage: Math.round((processed / records.length) * 100),
      });

      if (processed < records.length) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    const csvString = chunks.join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `bonus_${getCurrentDate()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const duration = Math.round(performance.now() - startTime);
    console.log(`[CSVStream] Bonus export completed in ${duration}ms`);

    return {
      success: true,
      recordCount: records.length,
    };
  } catch (error) {
    console.error('Failed to export bonus CSV (stream):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '賞与CSVの出力に失敗しました',
      recordCount: 0,
    };
  }
}
