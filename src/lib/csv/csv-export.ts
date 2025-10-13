/**
 * CSV出力ユーティリティ
 * 勤怠・給与・賞与・人事評価データのCSV出力機能
 */

import type { AttendanceRecord, PayrollRecord, BonusRecord, CSVExportResult } from '@/types/csv';
import type { PerformanceEvaluation } from '@/lib/payroll/performance-evaluation-types';
import {
  getWorkLocationLabel,
  getStatusLabel,
  getApprovalStatusLabel,
  getBonusTypeLabel,
} from '@/config/labels';

// ===== ヘルパー関数 =====

/**
 * CSVエスケープ処理
 */
const escapeCSV = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // カンマ、改行、ダブルクォートを含む場合はダブルクォートで囲む
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * CSV文字列を生成
 */
const generateCSVString = (headers: string[], rows: (string | number)[][]): string => {
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = rows.map((row) => row.map(escapeCSV).join(',')).join('\n');
  return `${headerRow}\n${dataRows}`;
};

/**
 * CSVファイルをダウンロード
 */
const downloadCSV = (csvString: string, filename: string): void => {
  try {
    // BOM付きUTF-8に変換（Excel対応）
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('CSV download failed:', error);
    throw new Error('CSVファイルのダウンロードに失敗しました');
  }
};

/**
 * 現在日付を「YYYY-MM-DD」形式で取得
 */
const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// ===== エクスポート関数 =====

/**
 * 勤怠データをCSV出力
 */
export const exportAttendanceToCSV = (
  records: AttendanceRecord[],
  filename?: string
): CSVExportResult => {
  try {
    if (!records || records.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

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

    const rows = records.map((record) => [
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
    ]);

    const csvString = generateCSVString(headers, rows);
    const defaultFilename = `attendance_${getCurrentDate()}.csv`;
    downloadCSV(csvString, filename || defaultFilename);

    return {
      success: true,
      recordCount: records.length,
    };
  } catch (error) {
    console.error('Failed to export attendance CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '勤怠CSVの出力に失敗しました',
      recordCount: 0,
    };
  }
};

/**
 * 給与データをCSV出力
 */
export const exportPayrollToCSV = (
  records: PayrollRecord[],
  filename?: string
): CSVExportResult => {
  try {
    if (!records || records.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

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

    const rows = records.map((record) => [
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
    ]);

    const csvString = generateCSVString(headers, rows);
    const defaultFilename = `payroll_${getCurrentDate()}.csv`;
    downloadCSV(csvString, filename || defaultFilename);

    return {
      success: true,
      recordCount: records.length,
    };
  } catch (error) {
    console.error('Failed to export payroll CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '給与CSVの出力に失敗しました',
      recordCount: 0,
    };
  }
};

/**
 * 賞与データをCSV出力
 */
export const exportBonusToCSV = (
  records: BonusRecord[],
  filename?: string
): CSVExportResult => {
  try {
    if (!records || records.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

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

    const rows = records.map((record) => [
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
    ]);

    const csvString = generateCSVString(headers, rows);
    const defaultFilename = `bonus_${getCurrentDate()}.csv`;
    downloadCSV(csvString, filename || defaultFilename);

    return {
      success: true,
      recordCount: records.length,
    };
  } catch (error) {
    console.error('Failed to export bonus CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '賞与CSVの出力に失敗しました',
      recordCount: 0,
    };
  }
};

/**
 * 人事評価データをCSV出力
 */
export const exportEvaluationToCSV = (
  evaluations: PerformanceEvaluation[],
  filename?: string
): CSVExportResult => {
  try {
    if (!evaluations || evaluations.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const statusLabels = {
      draft: '下書き',
      submitted: '申告済み',
      approved: '承認済み',
      finalized: '確定',
    };

    const headers = [
      '従業員ID',
      '従業員名',
      '部門',
      '役職',
      '年度',
      '期間',
      '総合評価',
      '総合スコア',
      '重み付けスコア',
      '評価者名',
      'ステータス',
      '評価日',
      '業績評価平均',
      '能力評価平均',
      '態度評価平均',
      'リーダーシップ評価平均',
      'チームワーク評価平均',
      '強み',
      '改善点',
      '次期目標',
    ];

    const rows = evaluations.map((evaluation) => {
      // カテゴリ別平均スコアを計算
      const itemsByCategory = evaluation.items.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, typeof evaluation.items>);

      const categoryAverages = {
        performance: 0,
        competency: 0,
        attitude: 0,
        leadership: 0,
        teamwork: 0,
      };

      Object.entries(itemsByCategory).forEach(([category, items]) => {
        const avgScore = items.reduce((sum, item) => sum + item.score, 0) / items.length;
        categoryAverages[category as keyof typeof categoryAverages] = Math.round(avgScore);
      });

      return [
        evaluation.employeeId,
        evaluation.employeeName,
        evaluation.department,
        evaluation.position,
        evaluation.fiscalYear,
        evaluation.period,
        evaluation.overallRating,
        evaluation.overallScore,
        evaluation.weightedScore,
        evaluation.evaluatorName,
        statusLabels[evaluation.status],
        new Date(evaluation.evaluationDate).toLocaleDateString('ja-JP'),
        categoryAverages.performance || '',
        categoryAverages.competency || '',
        categoryAverages.attitude || '',
        categoryAverages.leadership || '',
        categoryAverages.teamwork || '',
        evaluation.strengths || '',
        evaluation.improvements || '',
        evaluation.goals || '',
      ];
    });

    const csvString = generateCSVString(headers, rows);
    const defaultFilename = `evaluation_${getCurrentDate()}.csv`;
    downloadCSV(csvString, filename || defaultFilename);

    return {
      success: true,
      recordCount: evaluations.length,
    };
  } catch (error) {
    console.error('Failed to export evaluation CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '人事評価CSVの出力に失敗しました',
      recordCount: 0,
    };
  }
};
