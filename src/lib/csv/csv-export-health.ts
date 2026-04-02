/**
 * CSV出力 — 健康管理（健康診断・ストレスチェック）
 */

import type { CSVExportResult } from '@/types/csv';
import { exportCSV, errorResult, getCurrentDate } from './csv-helpers';

// ── 型定義 ──────────────────────────────────────────

export interface HealthCheckupExport {
  id: string;
  userId: string;
  userName: string;
  departmentName?: string;
  checkupDate: string;
  checkupType: string;
  medicalInstitution: string;
  fiscalYear: number;
  overallResult: string;
  requiresReexam: boolean;
  requiresTreatment: boolean;
  requiresGuidance: boolean;
  height?: number;
  weight?: number;
  bmi?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  followUpStatus?: string;
  findings?: string[] | { category: string; finding: string; severity: string }[];
}

export interface StressCheckExport {
  id: string;
  userId: string;
  userName: string;
  departmentName?: string;
  fiscalYear: number;
  checkDate: string;
  status: string;
  stressFactorsScore: number;
  stressResponseScore: number;
  socialSupportScore: number;
  totalScore: number;
  isHighStress: boolean;
  highStressReason?: string;
  interviewRequested: boolean;
  interviewScheduled: boolean;
  interviewCompleted: boolean;
}

// ── ラベル変換 ──────────────────────────────────────────

const getCheckupTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    regular: '定期健康診断', hiring: '雇入れ時健康診断', specific: '特定健康診査',
  };
  return labels[type] || type;
};

const getOverallResultLabel = (result: string): string => {
  const labels: Record<string, string> = {
    A: 'A（異常なし）', B: 'B（軽度異常）', C: 'C（要経過観察）',
    D: 'D（要精密検査）', E: 'E（要治療）',
  };
  return labels[result] || result;
};

const getFollowUpStatusLabel = (status: string | undefined): string => {
  if (!status) return '';
  const labels: Record<string, string> = {
    none: '対応不要', scheduled: '対応予定', completed: '対応完了',
  };
  return labels[status] || status;
};

const getStressCheckStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '未受検', completed: '受検済', interview_recommended: '面談推奨',
  };
  return labels[status] || status;
};

// ── エクスポート関数 ──────────────────────────────────────────

export const exportHealthCheckupsToCSV = (
  checkups: HealthCheckupExport[],
  filename?: string
): CSVExportResult => {
  try {
    const headers = [
      '社員ID', '社員名', '部署', '受診日', '健診種別', '医療機関', '年度',
      '総合判定', '要再検査', '要治療', '要保健指導',
      '身長(cm)', '体重(kg)', 'BMI', '血圧（収縮期）', '血圧（拡張期）',
      'フォロー状況', '所見',
    ];

    const rows = checkups.map((c) => [
      c.userId, c.userName, c.departmentName || '', c.checkupDate,
      getCheckupTypeLabel(c.checkupType), c.medicalInstitution, c.fiscalYear,
      getOverallResultLabel(c.overallResult),
      c.requiresReexam ? '要' : '不要', c.requiresTreatment ? '要' : '不要',
      c.requiresGuidance ? '要' : '不要',
      c.height || '', c.weight || '', c.bmi || '',
      c.bloodPressureSystolic || '', c.bloodPressureDiastolic || '',
      getFollowUpStatusLabel(c.followUpStatus),
      c.findings?.map((f) => typeof f === 'string' ? f : `${f.category}:${f.finding}`).join('; ') || '',
    ]);

    return exportCSV(headers, rows, `health_checkups_${getCurrentDate()}.csv`, '健康診断結果データ', filename);
  } catch (error) {
    console.error('Failed to export health checkups CSV:', error);
    return errorResult(error, '健康診断結果CSVの出力に失敗しました');
  }
};

export const exportFindingsListToCSV = (
  checkups: HealthCheckupExport[],
  filename?: string
): CSVExportResult => {
  try {
    const withFindings = checkups.filter(
      (c) => ['C', 'D', 'E'].includes(c.overallResult) || c.requiresReexam || c.requiresTreatment
    );

    const headers = [
      '社員ID', '社員名', '部署', '受診日', '総合判定',
      '要再検査', '要治療', '要保健指導', '所見カテゴリ', '所見内容', '重症度', 'フォロー状況',
    ];

    const rows: (string | number)[][] = [];
    withFindings.forEach((c) => {
      if (c.findings && c.findings.length > 0) {
        c.findings.forEach((finding) => {
          const f = typeof finding === 'string' ? { category: '', finding, severity: '' } : finding;
          rows.push([
            c.userId, c.userName, c.departmentName || '', c.checkupDate,
            getOverallResultLabel(c.overallResult),
            c.requiresReexam ? '要' : '不要', c.requiresTreatment ? '要' : '不要',
            c.requiresGuidance ? '要' : '不要',
            f.category, f.finding,
            f.severity === 'critical' ? '重度' : f.severity === 'warning' ? '注意' : '軽度',
            getFollowUpStatusLabel(c.followUpStatus),
          ]);
        });
      } else {
        rows.push([
          c.userId, c.userName, c.departmentName || '', c.checkupDate,
          getOverallResultLabel(c.overallResult),
          c.requiresReexam ? '要' : '不要', c.requiresTreatment ? '要' : '不要',
          c.requiresGuidance ? '要' : '不要', '', '', '',
          getFollowUpStatusLabel(c.followUpStatus),
        ]);
      }
    });

    return exportCSV(headers, rows, `findings_list_${getCurrentDate()}.csv`, '有所見者リストデータ', filename, withFindings.length);
  } catch (error) {
    console.error('Failed to export findings list CSV:', error);
    return errorResult(error, '有所見者リストCSVの出力に失敗しました');
  }
};

export const exportStressChecksToCSV = (
  stressChecks: StressCheckExport[],
  filename?: string
): CSVExportResult => {
  try {
    const headers = [
      '社員ID', '社員名', '部署', '年度', '受検日', 'ステータス',
      'ストレス要因スコア', 'ストレス反応スコア', '周囲サポートスコア', '総合スコア',
      '高ストレス判定', '高ストレス理由', '面談申込み', '面談予約済', '面談完了',
    ];

    const rows = stressChecks.map((c) => [
      c.userId, c.userName, c.departmentName || '', c.fiscalYear, c.checkDate,
      getStressCheckStatusLabel(c.status),
      c.stressFactorsScore, c.stressResponseScore, c.socialSupportScore, c.totalScore,
      c.isHighStress ? '該当' : '非該当', c.highStressReason || '',
      c.interviewRequested ? 'あり' : 'なし', c.interviewScheduled ? 'あり' : 'なし',
      c.interviewCompleted ? 'あり' : 'なし',
    ]);

    return exportCSV(headers, rows, `stress_checks_${getCurrentDate()}.csv`, 'ストレスチェック結果データ', filename);
  } catch (error) {
    console.error('Failed to export stress checks CSV:', error);
    return errorResult(error, 'ストレスチェック結果CSVの出力に失敗しました');
  }
};

export const exportHighStressListToCSV = (
  stressChecks: StressCheckExport[],
  filename?: string
): CSVExportResult => {
  try {
    const highStress = stressChecks.filter((c) => c.isHighStress);

    const headers = [
      '社員ID', '社員名', '部署', '年度', '受検日',
      'ストレス要因スコア', 'ストレス反応スコア', '周囲サポートスコア', '総合スコア',
      '高ストレス理由', '面談申込み', '面談予約済', '面談完了', '対応状況',
    ];

    const rows = highStress.map((c) => [
      c.userId, c.userName, c.departmentName || '', c.fiscalYear, c.checkDate,
      c.stressFactorsScore, c.stressResponseScore, c.socialSupportScore, c.totalScore,
      c.highStressReason || '',
      c.interviewRequested ? 'あり' : 'なし', c.interviewScheduled ? 'あり' : 'なし',
      c.interviewCompleted ? 'あり' : 'なし',
      c.interviewCompleted ? '対応完了' : c.interviewScheduled ? '面談予定' : c.interviewRequested ? '面談申込済' : '未対応',
    ]);

    return exportCSV(headers, rows, `high_stress_list_${getCurrentDate()}.csv`, '高ストレス者リストデータ', filename, highStress.length);
  } catch (error) {
    console.error('Failed to export high stress list CSV:', error);
    return errorResult(error, '高ストレス者リストCSVの出力に失敗しました');
  }
};
