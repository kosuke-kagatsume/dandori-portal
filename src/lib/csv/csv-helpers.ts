/**
 * CSV出力 — 共通ヘルパー関数
 */

import type { CSVExportResult } from '@/types/csv';
import { exportAudit } from '@/lib/audit/audit-logger';

/**
 * CSVエスケープ処理
 */
export const escapeCSV = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * CSV文字列を生成
 */
export const generateCSVString = (headers: string[], rows: (string | number)[][]): string => {
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = rows.map((row) => row.map(escapeCSV).join(',')).join('\n');
  return `${headerRow}\n${dataRows}`;
};

/**
 * CSVファイルをダウンロード
 */
export const downloadCSV = (csvString: string, filename: string): void => {
  try {
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
export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * CSV出力の共通ラッパー
 * バリデーション・CSV生成・ダウンロード・監査ログを一括処理
 */
export const exportCSV = (
  headers: string[],
  rows: (string | number)[][],
  defaultFilename: string,
  auditLabel: string,
  filename?: string,
  recordCount?: number,
): CSVExportResult => {
  const csvString = generateCSVString(headers, rows);
  downloadCSV(csvString, filename || defaultFilename);
  exportAudit.csv(auditLabel, recordCount ?? rows.length);
  return { success: true, recordCount: recordCount ?? rows.length };
};

/**
 * 空データチェック
 */
export const emptyResult = (errorMessage: string): CSVExportResult => ({
  success: false,
  error: errorMessage,
  recordCount: 0,
});

/**
 * エラー結果
 */
export const errorResult = (error: unknown, fallbackMessage: string): CSVExportResult => ({
  success: false,
  error: error instanceof Error ? error.message : fallbackMessage,
  recordCount: 0,
});
