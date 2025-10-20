/**
 * PDF生成ライブラリの遅延読み込みラッパー
 * jsPDFは大きなライブラリなので、使用時のみロードする
 */

import type { PayrollData, BonusData } from '@/types/pdf';
import type { LeaveRequest, PerformanceEvaluation } from '@/types';

export async function generatePayrollPDFLazy(data: PayrollData) {
  const { generatePayrollPDF } = await import('./payroll-pdf');
  return generatePayrollPDF(data);
}

export async function generateBonusPDFLazy(data: BonusData) {
  const { generateBonusPDF } = await import('./payroll-pdf');
  return generateBonusPDF(data);
}

export async function generateLeavePDFLazy(data: LeaveRequest[]) {
  const { generateLeavePDF } = await import('./leave-pdf');
  return generateLeavePDF(data);
}

export async function generateEvaluationPDFLazy(data: PerformanceEvaluation) {
  const { generateEvaluationPDF } = await import('./evaluation-pdf');
  return generateEvaluationPDF(data);
}
