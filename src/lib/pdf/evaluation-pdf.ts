import { jsPDF } from 'jspdf';
import type { PerformanceEvaluation } from '@/lib/payroll/performance-evaluation-types';

const RATING_LABELS = {
  S: 'S（卓越）',
  A: 'A（優秀）',
  B: 'B（良好）',
  C: 'C（要改善）',
  D: 'D（不十分）',
};

const CATEGORY_LABELS = {
  performance: '業績評価',
  competency: '能力評価',
  attitude: '態度評価',
  leadership: 'リーダーシップ評価',
  teamwork: 'チームワーク評価',
};

const STATUS_LABELS = {
  draft: '下書き',
  submitted: '申告済み',
  approved: '承認済み',
  finalized: '確定',
};

/**
 * 人事評価結果PDF生成
 */
export const generateEvaluationPDF = async (evaluation: PerformanceEvaluation): Promise<jsPDF> => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let yPos = 20;

    // タイトル
    doc.setFontSize(20);
    doc.text('人事評価結果', 105, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(12);
    doc.text(
      `${evaluation.fiscalYear}年度 ${evaluation.period}`,
      105,
      yPos,
      { align: 'center' }
    );
    yPos += 15;

    // 従業員情報
    doc.setFontSize(10);
    doc.text(`従業員名: ${evaluation.employeeName}`, 20, yPos);
    yPos += 6;
    doc.text(`従業員ID: ${evaluation.employeeId}`, 20, yPos);
    yPos += 6;
    doc.text(`部門: ${evaluation.department}`, 20, yPos);
    yPos += 6;
    doc.text(`役職: ${evaluation.position}`, 20, yPos);
    yPos += 6;
    doc.text(`評価日: ${new Date(evaluation.evaluationDate).toLocaleDateString('ja-JP')}`, 20, yPos);
    yPos += 6;
    doc.text(`ステータス: ${STATUS_LABELS[evaluation.status]}`, 20, yPos);
    yPos += 10;

    // 区切り線
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    // 総合評価
    doc.setFontSize(14);
    doc.text('総合評価', 20, yPos);
    yPos += 8;

    doc.setFontSize(16);
    doc.text(
      `${RATING_LABELS[evaluation.overallRating]} - ${evaluation.overallScore}点`,
      105,
      yPos,
      { align: 'center' }
    );
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`評価者: ${evaluation.evaluatorName}`, 20, yPos);
    yPos += 6;
    doc.text(`重み付けスコア: ${evaluation.weightedScore}点`, 20, yPos);
    yPos += 10;

    // 区切り線
    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    // カテゴリ別評価
    doc.setFontSize(14);
    doc.text('カテゴリ別評価', 20, yPos);
    yPos += 8;

    // カテゴリごとにグループ化
    const itemsByCategory = evaluation.items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof evaluation.items>);

    doc.setFontSize(10);
    for (const [category, items] of Object.entries(itemsByCategory)) {
      // カテゴリ名
      doc.setFontSize(12);
      doc.text(CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category, 20, yPos);
      yPos += 6;

      doc.setFontSize(9);
      for (const item of items) {
        // 改ページチェック
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.text(`  ${item.name}: ${RATING_LABELS[item.rating]} (${item.score}点)`, 25, yPos);
        yPos += 5;

        if (item.comments) {
          const commentLines = doc.splitTextToSize(`    コメント: ${item.comments}`, 160);
          doc.text(commentLines, 25, yPos);
          yPos += commentLines.length * 4;
        }
        yPos += 2;
      }
      yPos += 4;
    }

    // 改ページチェック
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    // 区切り線
    doc.line(20, yPos, 190, yPos);
    yPos += 8;

    // 総合コメント
    doc.setFontSize(14);
    doc.text('総合コメント', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);

    // 強み
    if (evaluation.strengths) {
      doc.setFont('helvetica', 'bold');
      doc.text('✓ 強み', 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 5;
      const strengthLines = doc.splitTextToSize(evaluation.strengths, 170);
      doc.text(strengthLines, 20, yPos);
      yPos += strengthLines.length * 5 + 5;
    }

    // 改ページチェック
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // 改善点
    if (evaluation.improvements) {
      doc.setFont('helvetica', 'bold');
      doc.text('△ 改善点', 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 5;
      const improvementLines = doc.splitTextToSize(evaluation.improvements, 170);
      doc.text(improvementLines, 20, yPos);
      yPos += improvementLines.length * 5 + 5;
    }

    // 改ページチェック
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // 次期目標
    if (evaluation.goals) {
      doc.setFont('helvetica', 'bold');
      doc.text('→ 次期目標', 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 5;
      const goalLines = doc.splitTextToSize(evaluation.goals, 170);
      doc.text(goalLines, 20, yPos);
      yPos += goalLines.length * 5 + 5;
    }

    // 改ページチェック
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // 評価者総合コメント
    if (evaluation.evaluatorComments) {
      doc.setFont('helvetica', 'bold');
      doc.text('評価者総合コメント', 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 5;
      const commentLines = doc.splitTextToSize(evaluation.evaluatorComments, 170);
      doc.text(commentLines, 20, yPos);
      yPos += commentLines.length * 5 + 5;
    }

    // フッター（全ページ）
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `生成日時: ${new Date().toLocaleString('ja-JP')}`,
        105,
        287,
        { align: 'center' }
      );
      doc.text(
        `Page ${i} / ${pageCount}`,
        190,
        287,
        { align: 'right' }
      );
    }

    return doc;
  } catch (error) {
    console.error('Failed to generate evaluation PDF:', error);
    throw new Error('人事評価PDFの生成に失敗しました');
  }
};

/**
 * 評価結果PDFダウンロード
 */
export const downloadEvaluationPDF = async (evaluation: PerformanceEvaluation): Promise<void> => {
  const pdf = await generateEvaluationPDF(evaluation);
  const filename = `人事評価_${evaluation.employeeName}_${evaluation.fiscalYear}年度_${evaluation.period}.pdf`;
  pdf.save(filename);
};
