/**
 * PDF生成ライブラリの遅延読み込みラッパー
 * jsPDFは大きなライブラリなので、使用時のみロードする
 */

export async function generatePayrollPDFLazy(data: any) {
  const { generatePayrollPDF } = await import('./payroll-pdf');
  return generatePayrollPDF(data);
}

export async function generateBonusPDFLazy(data: any) {
  const { generateBonusPDF } = await import('./payroll-pdf');
  return generateBonusPDF(data);
}

export async function generateLeavePDFLazy(data: any) {
  const { generateLeavePDF } = await import('./leave-pdf');
  return generateLeavePDF(data);
}

export async function generateEvaluationPDFLazy(data: any) {
  const { generateEvaluationPDF } = await import('./evaluation-pdf');
  return generateEvaluationPDF(data);
}
