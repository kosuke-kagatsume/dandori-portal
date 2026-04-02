/**
 * CSV出力 — 給与・賞与・人事評価
 */

import type { CSVExportResult } from '@/types/csv';
import type { PayrollCalculation, BonusCalculation } from '@/lib/payroll/types';
import type { PerformanceEvaluation } from '@/lib/payroll/performance-evaluation-types';
import { getStatusLabel, getBonusTypeLabel } from '@/config/labels';
import { exportCSV, emptyResult, errorResult, getCurrentDate } from './csv-helpers';

export const exportPayrollToCSV = (
  records: PayrollCalculation[],
  filename?: string
): CSVExportResult => {
  try {
    if (!records || records.length === 0) return emptyResult('エクスポートするデータがありません');

    const headers = [
      '従業員ID', '従業員名', '部署', '支給年月', '基本給',
      '手当合計', '総支給額', '控除合計', '差引支給額', 'ステータス', '支払日',
    ];

    const rows = records.map((r) => [
      r.employeeId, r.employeeName, r.department, r.period,
      r.basicSalary, r.totalAllowances, r.basicSalary + r.totalAllowances,
      r.totalDeductions, r.netSalary, getStatusLabel(r.status),
      r.calculatedAt ? new Date(r.calculatedAt).toLocaleDateString('ja-JP') : '',
    ]);

    return exportCSV(headers, rows, `payroll_${getCurrentDate()}.csv`, '給与データ', filename);
  } catch (error) {
    console.error('Failed to export payroll CSV:', error);
    return errorResult(error, '給与CSVの出力に失敗しました');
  }
};

export const exportBonusToCSV = (
  records: BonusCalculation[],
  filename?: string
): CSVExportResult => {
  try {
    if (!records || records.length === 0) return emptyResult('エクスポートするデータがありません');

    const headers = [
      '従業員ID', '従業員名', '部署', '支給年月', '賞与種別',
      '基本賞与', '査定賞与', '査定評価', '控除合計', '差引支給額', 'ステータス', '支払日',
    ];

    const rows = records.map((r) => [
      r.employeeId, r.employeeName, r.department, r.period,
      getBonusTypeLabel(r.bonusType), r.basicBonus, r.performanceBonus,
      r.performanceRating, r.totalDeductions, r.netBonus,
      getStatusLabel(r.status), r.paidAt || '',
    ]);

    return exportCSV(headers, rows, `bonus_${getCurrentDate()}.csv`, '賞与データ', filename);
  } catch (error) {
    console.error('Failed to export bonus CSV:', error);
    return errorResult(error, '賞与CSVの出力に失敗しました');
  }
};

export const exportEvaluationToCSV = (
  evaluations: PerformanceEvaluation[],
  filename?: string
): CSVExportResult => {
  try {
    if (!evaluations || evaluations.length === 0) return emptyResult('エクスポートするデータがありません');

    const statusLabels: Record<string, string> = {
      draft: '下書き', submitted: '申告済み', approved: '承認済み', finalized: '確定',
    };

    const headers = [
      '従業員ID', '従業員名', '部署', '役職', '年度', '期間',
      '総合評価', '総合スコア', '重み付けスコア', '評価者名', 'ステータス', '評価日',
      '業績評価平均', '能力評価平均', '態度評価平均', 'リーダーシップ評価平均', 'チームワーク評価平均',
      '強み', '改善点', '次期目標',
    ];

    const rows = evaluations.map((ev) => {
      const itemsByCategory = ev.items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, typeof ev.items>);

      const categoryAverages: Record<string, number> = {
        performance: 0, competency: 0, attitude: 0, leadership: 0, teamwork: 0,
      };
      Object.entries(itemsByCategory).forEach(([cat, items]) => {
        categoryAverages[cat] = Math.round(items.reduce((sum, i) => sum + i.score, 0) / items.length);
      });

      return [
        ev.employeeId, ev.employeeName, ev.department, ev.position,
        ev.fiscalYear, ev.period, ev.overallRating, ev.overallScore, ev.weightedScore,
        ev.evaluatorName, statusLabels[ev.status],
        new Date(ev.evaluationDate).toLocaleDateString('ja-JP'),
        categoryAverages.performance || '', categoryAverages.competency || '',
        categoryAverages.attitude || '', categoryAverages.leadership || '',
        categoryAverages.teamwork || '',
        ev.strengths || '', ev.improvements || '', ev.goals || '',
      ];
    });

    return exportCSV(headers, rows, `evaluation_${getCurrentDate()}.csv`, '人事評価データ', filename);
  } catch (error) {
    console.error('Failed to export evaluation CSV:', error);
    return errorResult(error, '人事評価CSVの出力に失敗しました');
  }
};
