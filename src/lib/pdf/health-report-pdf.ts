/**
 * 健康管理レポートPDF生成
 * - 産業医報告書
 * - 高ストレス者一覧
 * - 健康診断サマリー
 */

import { jsPDF } from 'jspdf';

// 健康診断データ型
export interface HealthCheckupForPDF {
  id: string;
  userId: string;
  userName: string;
  departmentName?: string;
  checkupDate: Date | string;
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
  findings?: { category: string; finding: string; severity: string }[];
}

// ストレスチェックデータ型
export interface StressCheckForPDF {
  id: string;
  userId: string;
  userName: string;
  departmentName?: string;
  fiscalYear: number;
  checkDate: Date | string;
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

// ラベル変換
const getCheckupTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    regular: '定期健診',
    hiring: '雇入れ時健診',
    specific: '特定健診',
  };
  return labels[type] || type;
};

const getOverallResultLabel = (result: string): string => {
  const labels: Record<string, string> = {
    A: 'A（異常なし）',
    B: 'B（軽度異常）',
    C: 'C（要経過観察）',
    D: 'D（要精密検査）',
    E: 'E（要治療）',
  };
  return labels[result] || result;
};

const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

/**
 * 産業医報告書PDF生成
 */
export const generateIndustrialPhysicianReportPDF = async (
  checkups: HealthCheckupForPDF[],
  stressChecks: StressCheckForPDF[],
  fiscalYear: number,
  companyName: string = '株式会社サンプル'
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // タイトル
  doc.setFontSize(18);
  doc.text('産業医報告書', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(12);
  doc.text(`${fiscalYear}年度`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // 報告情報
  doc.setFontSize(10);
  doc.text(`会社名: ${companyName}`, 20, yPos);
  yPos += 6;
  doc.text(`報告日: ${formatDate(new Date())}`, 20, yPos);
  yPos += 6;
  doc.text(`対象年度: ${fiscalYear}年度`, 20, yPos);
  yPos += 10;

  // 区切り線
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  // === 1. 健康診断実施状況 ===
  doc.setFontSize(14);
  doc.text('1. 健康診断実施状況', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  const totalCheckups = checkups.length;
  const resultCounts = checkups.reduce((acc, c) => {
    acc[c.overallResult] = (acc[c.overallResult] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  doc.text(`受診者数: ${totalCheckups}名`, 25, yPos);
  yPos += 6;

  doc.text('判定結果内訳:', 25, yPos);
  yPos += 5;
  ['A', 'B', 'C', 'D', 'E'].forEach((result) => {
    const count = resultCounts[result] || 0;
    const percentage = totalCheckups > 0 ? ((count / totalCheckups) * 100).toFixed(1) : '0.0';
    doc.text(`  ${getOverallResultLabel(result)}: ${count}名 (${percentage}%)`, 30, yPos);
    yPos += 5;
  });
  yPos += 5;

  // 要再検査・要治療
  const reexamCount = checkups.filter(c => c.requiresReexam).length;
  const treatmentCount = checkups.filter(c => c.requiresTreatment).length;
  const guidanceCount = checkups.filter(c => c.requiresGuidance).length;

  doc.text(`要再検査者: ${reexamCount}名`, 25, yPos);
  yPos += 5;
  doc.text(`要治療者: ${treatmentCount}名`, 25, yPos);
  yPos += 5;
  doc.text(`要指導者: ${guidanceCount}名`, 25, yPos);
  yPos += 10;

  // === 2. 有所見者一覧 ===
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text('2. 有所見者一覧（要再検査・要治療）', 20, yPos);
  yPos += 8;

  doc.setFontSize(9);
  const requireFollowUp = checkups.filter(c => c.requiresReexam || c.requiresTreatment);

  if (requireFollowUp.length === 0) {
    doc.text('該当者なし', 25, yPos);
    yPos += 6;
  } else {
    // ヘッダー
    doc.text('氏名', 25, yPos);
    doc.text('所属', 70, yPos);
    doc.text('判定', 110, yPos);
    doc.text('所見', 130, yPos);
    yPos += 2;
    doc.line(25, yPos, pageWidth - 20, yPos);
    yPos += 4;

    requireFollowUp.forEach((checkup) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(checkup.userName, 25, yPos);
      doc.text(checkup.departmentName || '-', 70, yPos);
      doc.text(checkup.overallResult, 110, yPos);

      const findingsList = checkup.findings?.map(f => f.finding).join(', ') || '-';
      const truncated = findingsList.length > 25 ? findingsList.substring(0, 25) + '...' : findingsList;
      doc.text(truncated, 130, yPos);
      yPos += 5;
    });
  }
  yPos += 10;

  // === 3. ストレスチェック実施状況 ===
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text('3. ストレスチェック実施状況', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  const totalStress = stressChecks.length;
  const highStressCount = stressChecks.filter(s => s.isHighStress).length;
  const interviewRequestedCount = stressChecks.filter(s => s.interviewRequested).length;
  const interviewCompletedCount = stressChecks.filter(s => s.interviewCompleted).length;

  doc.text(`受検者数: ${totalStress}名`, 25, yPos);
  yPos += 6;
  doc.text(`高ストレス者数: ${highStressCount}名 (${totalStress > 0 ? ((highStressCount / totalStress) * 100).toFixed(1) : '0.0'}%)`, 25, yPos);
  yPos += 6;
  doc.text(`面談希望者数: ${interviewRequestedCount}名`, 25, yPos);
  yPos += 6;
  doc.text(`面談実施済み: ${interviewCompletedCount}名`, 25, yPos);
  yPos += 10;

  // 平均スコア
  if (totalStress > 0) {
    const avgFactors = stressChecks.reduce((sum, s) => sum + s.stressFactorsScore, 0) / totalStress;
    const avgResponse = stressChecks.reduce((sum, s) => sum + s.stressResponseScore, 0) / totalStress;
    const avgSupport = stressChecks.reduce((sum, s) => sum + s.socialSupportScore, 0) / totalStress;
    const avgTotal = stressChecks.reduce((sum, s) => sum + s.totalScore, 0) / totalStress;

    doc.text('平均スコア:', 25, yPos);
    yPos += 5;
    doc.text(`  ストレス要因: ${avgFactors.toFixed(1)}点`, 30, yPos);
    yPos += 5;
    doc.text(`  ストレス反応: ${avgResponse.toFixed(1)}点`, 30, yPos);
    yPos += 5;
    doc.text(`  周囲のサポート: ${avgSupport.toFixed(1)}点`, 30, yPos);
    yPos += 5;
    doc.text(`  総合スコア: ${avgTotal.toFixed(1)}点`, 30, yPos);
    yPos += 10;
  }

  // === 4. 高ストレス者一覧 ===
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text('4. 高ストレス者一覧', 20, yPos);
  yPos += 8;

  doc.setFontSize(9);
  const highStressList = stressChecks.filter(s => s.isHighStress);

  if (highStressList.length === 0) {
    doc.text('該当者なし', 25, yPos);
    yPos += 6;
  } else {
    // ヘッダー
    doc.text('氏名', 25, yPos);
    doc.text('所属', 60, yPos);
    doc.text('総合スコア', 100, yPos);
    doc.text('面談希望', 130, yPos);
    doc.text('面談実施', 155, yPos);
    yPos += 2;
    doc.line(25, yPos, pageWidth - 20, yPos);
    yPos += 4;

    highStressList.forEach((stress) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(stress.userName, 25, yPos);
      doc.text(stress.departmentName || '-', 60, yPos);
      doc.text(`${stress.totalScore}点`, 100, yPos);
      doc.text(stress.interviewRequested ? 'あり' : 'なし', 130, yPos);
      doc.text(stress.interviewCompleted ? '済' : '未', 155, yPos);
      yPos += 5;
    });
  }
  yPos += 10;

  // === 5. 産業医所見 ===
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text('5. 産業医所見・意見', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.text('（以下に産業医による所見・意見を記載）', 25, yPos);
  yPos += 10;

  // 署名欄の枠
  doc.setLineWidth(0.3);
  doc.rect(25, yPos, pageWidth - 50, 40);
  yPos += 50;

  // 署名欄
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(10);
  doc.text('産業医署名:', 25, yPos);
  doc.line(60, yPos, 120, yPos);
  yPos += 10;

  doc.text('記載日:', 25, yPos);
  doc.line(50, yPos, 100, yPos);
  yPos += 10;

  // フッター（全ページ）
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `生成日時: ${new Date().toLocaleString('ja-JP')}`,
      pageWidth / 2,
      287,
      { align: 'center' }
    );
    doc.text(
      `Page ${i} / ${pageCount}`,
      pageWidth - 20,
      287,
      { align: 'right' }
    );
  }

  return doc;
};

/**
 * 産業医報告書PDFダウンロード
 */
export const downloadIndustrialPhysicianReportPDF = async (
  checkups: HealthCheckupForPDF[],
  stressChecks: StressCheckForPDF[],
  fiscalYear: number,
  companyName?: string
): Promise<void> => {
  const pdf = await generateIndustrialPhysicianReportPDF(
    checkups,
    stressChecks,
    fiscalYear,
    companyName
  );
  const filename = `産業医報告書_${fiscalYear}年度.pdf`;
  pdf.save(filename);
};

/**
 * 高ストレス者一覧PDF生成
 */
export const generateHighStressListPDF = async (
  stressChecks: StressCheckForPDF[],
  fiscalYear: number
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // タイトル
  doc.setFontSize(16);
  doc.text('高ストレス者一覧', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(11);
  doc.text(`${fiscalYear}年度`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  const highStressList = stressChecks.filter(s => s.isHighStress);

  doc.setFontSize(10);
  doc.text(`対象者数: ${highStressList.length}名`, 20, yPos);
  yPos += 10;

  if (highStressList.length === 0) {
    doc.text('高ストレス該当者はいません', 20, yPos);
  } else {
    // ヘッダー
    doc.setFontSize(9);
    doc.text('No.', 20, yPos);
    doc.text('氏名', 30, yPos);
    doc.text('所属', 65, yPos);
    doc.text('受検日', 100, yPos);
    doc.text('要因', 130, yPos);
    doc.text('反応', 150, yPos);
    doc.text('サポート', 170, yPos);
    doc.text('総合', 195, yPos);
    doc.text('面談希望', 215, yPos);
    doc.text('面談実施', 240, yPos);
    doc.text('理由', 260, yPos);
    yPos += 2;
    doc.line(20, yPos, pageWidth - 15, yPos);
    yPos += 4;

    highStressList.forEach((stress, index) => {
      if (yPos > 190) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(`${index + 1}`, 20, yPos);
      doc.text(stress.userName, 30, yPos);
      doc.text(stress.departmentName || '-', 65, yPos);
      doc.text(formatDate(stress.checkDate), 100, yPos);
      doc.text(`${stress.stressFactorsScore}`, 130, yPos);
      doc.text(`${stress.stressResponseScore}`, 150, yPos);
      doc.text(`${stress.socialSupportScore}`, 170, yPos);
      doc.text(`${stress.totalScore}`, 195, yPos);
      doc.text(stress.interviewRequested ? 'あり' : 'なし', 215, yPos);
      doc.text(stress.interviewCompleted ? '済' : '未', 240, yPos);

      const reason = stress.highStressReason || '-';
      const truncated = reason.length > 15 ? reason.substring(0, 15) + '...' : reason;
      doc.text(truncated, 260, yPos);
      yPos += 5;
    });
  }

  // フッター
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `生成日時: ${new Date().toLocaleString('ja-JP')} | Page ${i} / ${pageCount}`,
      pageWidth / 2,
      200,
      { align: 'center' }
    );
  }

  return doc;
};

/**
 * 高ストレス者一覧PDFダウンロード
 */
export const downloadHighStressListPDF = async (
  stressChecks: StressCheckForPDF[],
  fiscalYear: number
): Promise<void> => {
  const pdf = await generateHighStressListPDF(stressChecks, fiscalYear);
  const filename = `高ストレス者一覧_${fiscalYear}年度.pdf`;
  pdf.save(filename);
};

/**
 * 健康診断サマリーPDF生成
 */
export const generateHealthCheckupSummaryPDF = async (
  checkups: HealthCheckupForPDF[],
  fiscalYear: number
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // タイトル
  doc.setFontSize(16);
  doc.text('健康診断結果サマリー', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(11);
  doc.text(`${fiscalYear}年度`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // 概要統計
  doc.setFontSize(12);
  doc.text('受診状況', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  const totalCount = checkups.length;
  const typeBreakdown = checkups.reduce((acc, c) => {
    acc[c.checkupType] = (acc[c.checkupType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  doc.text(`総受診者数: ${totalCount}名`, 25, yPos);
  yPos += 6;

  Object.entries(typeBreakdown).forEach(([type, count]) => {
    doc.text(`  ${getCheckupTypeLabel(type)}: ${count}名`, 30, yPos);
    yPos += 5;
  });
  yPos += 10;

  // 判定結果分布
  doc.setFontSize(12);
  doc.text('判定結果分布', 20, yPos);
  yPos += 8;

  const resultCounts = checkups.reduce((acc, c) => {
    acc[c.overallResult] = (acc[c.overallResult] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  doc.setFontSize(10);
  ['A', 'B', 'C', 'D', 'E'].forEach((result) => {
    const count = resultCounts[result] || 0;
    const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0';
    doc.text(`${getOverallResultLabel(result)}: ${count}名 (${percentage}%)`, 25, yPos);
    yPos += 6;
  });
  yPos += 10;

  // フォローアップ状況
  doc.setFontSize(12);
  doc.text('フォローアップ必要者', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  const reexamCount = checkups.filter(c => c.requiresReexam).length;
  const treatmentCount = checkups.filter(c => c.requiresTreatment).length;
  const guidanceCount = checkups.filter(c => c.requiresGuidance).length;

  doc.text(`要再検査: ${reexamCount}名`, 25, yPos);
  yPos += 6;
  doc.text(`要治療: ${treatmentCount}名`, 25, yPos);
  yPos += 6;
  doc.text(`要保健指導: ${guidanceCount}名`, 25, yPos);
  yPos += 15;

  // 所見カテゴリ別集計
  doc.setFontSize(12);
  doc.text('所見カテゴリ別集計', 20, yPos);
  yPos += 8;

  const findingCategories = checkups.reduce((acc, c) => {
    c.findings?.forEach(f => {
      acc[f.category] = (acc[f.category] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  doc.setFontSize(10);
  if (Object.keys(findingCategories).length === 0) {
    doc.text('所見なし', 25, yPos);
    yPos += 6;
  } else {
    Object.entries(findingCategories)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        doc.text(`${category}: ${count}件`, 25, yPos);
        yPos += 6;
      });
  }

  // フッター
  doc.setFontSize(8);
  doc.text(
    `生成日時: ${new Date().toLocaleString('ja-JP')}`,
    pageWidth / 2,
    287,
    { align: 'center' }
  );

  return doc;
};

/**
 * 健康診断サマリーPDFダウンロード
 */
export const downloadHealthCheckupSummaryPDF = async (
  checkups: HealthCheckupForPDF[],
  fiscalYear: number
): Promise<void> => {
  const pdf = await generateHealthCheckupSummaryPDF(checkups, fiscalYear);
  const filename = `健康診断サマリー_${fiscalYear}年度.pdf`;
  pdf.save(filename);
};
