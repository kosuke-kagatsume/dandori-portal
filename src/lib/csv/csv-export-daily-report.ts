/**
 * CSV出力 — 日報
 */

import type { CSVExportResult } from '@/types/csv';
import { exportCSV, emptyResult, errorResult, getCurrentDate } from './csv-helpers';

// ── 型定義 ──────────────────────────────────────────

export interface DailyReportEmployeeCSV {
  employeeId: string;
  employeeName: string;
  departmentName: string;
  submittedCount: number;
  expectedCount: number;
  submissionRate: number;
  lastSubmittedDate: string | null;
}

export interface DailyReportFieldAggregationCSV {
  templateName: string;
  reportCount: number;
  fields: Array<{
    fieldId: string;
    label: string;
    fieldType: string;
    stats: {
      type: string;
      sum?: number;
      average?: number;
      min?: number;
      max?: number;
      count?: number;
      entryCount?: number;
      emptyCount?: number;
      avgLength?: number;
      options?: Array<{ label: string; count: number; percentage: number }>;
      total?: number;
    };
  }>;
}

// ── エクスポート関数 ──────────────────────────────────────────

export const exportSubmissionRateToCSV = (
  employees: DailyReportEmployeeCSV[],
  filename?: string
): CSVExportResult => {
  try {
    if (!employees || employees.length === 0) return emptyResult('エクスポートするデータがありません');

    const headers = ['従業員ID', '従業員名', '部署', '提出数', '期待数', '提出率(%)', '最終提出日'];

    const rows = employees.map((e) => [
      e.employeeId, e.employeeName, e.departmentName,
      e.submittedCount, e.expectedCount, e.submissionRate,
      e.lastSubmittedDate ? new Date(e.lastSubmittedDate).toLocaleDateString('ja-JP') : '',
    ]);

    return exportCSV(headers, rows, `daily_report_submission_rate_${getCurrentDate()}.csv`, '日報提出率データ', filename);
  } catch (error) {
    console.error('Failed to export submission rate CSV:', error);
    return errorResult(error, '提出率CSVの出力に失敗しました');
  }
};

export const exportDailyReportListToCSV = (
  employees: DailyReportEmployeeCSV[],
  filename?: string
): CSVExportResult => {
  try {
    if (!employees || employees.length === 0) return emptyResult('エクスポートするデータがありません');

    const headers = ['従業員ID', '従業員名', '部署', '提出数', '期待数', '提出率(%)', '最終提出日'];

    const rows = employees.map((e) => [
      e.employeeId, e.employeeName, e.departmentName,
      e.submittedCount, e.expectedCount, e.submissionRate,
      e.lastSubmittedDate ? new Date(e.lastSubmittedDate).toLocaleDateString('ja-JP') : '',
    ]);

    return exportCSV(headers, rows, `daily_report_list_${getCurrentDate()}.csv`, '日報一覧データ', filename);
  } catch (error) {
    console.error('Failed to export daily report list CSV:', error);
    return errorResult(error, '日報一覧CSVの出力に失敗しました');
  }
};

export const exportFieldAggregationToCSV = (
  aggregation: DailyReportFieldAggregationCSV,
  filename?: string
): CSVExportResult => {
  try {
    if (!aggregation || aggregation.fields.length === 0) return emptyResult('エクスポートするデータがありません');

    const headers = [
      'テンプレート名', '対象日報数', 'フィールドID', 'フィールド名', 'フィールドタイプ',
      '集計タイプ', '合計', '平均', '最小', '最大', '件数',
      '入力数', '未入力数', '平均文字数', 'オプション詳細',
    ];

    const rows = aggregation.fields.map((f) => {
      const s = f.stats;
      let optionDetail = '';
      if (s.type === 'select' && s.options) {
        optionDetail = s.options.map((o) => `${o.label}: ${o.count}件(${o.percentage}%)`).join(' / ');
      }
      return [
        aggregation.templateName, aggregation.reportCount,
        f.fieldId, f.label, f.fieldType, s.type,
        s.sum ?? '', s.average ?? '', s.min ?? '', s.max ?? '',
        s.count ?? s.total ?? '', s.entryCount ?? '', s.emptyCount ?? '',
        s.avgLength ?? '', optionDetail,
      ];
    });

    return exportCSV(headers, rows, `daily_report_field_aggregation_${getCurrentDate()}.csv`, '日報フィールド集計データ', filename);
  } catch (error) {
    console.error('Failed to export field aggregation CSV:', error);
    return errorResult(error, 'フィールド集計CSVの出力に失敗しました');
  }
};
