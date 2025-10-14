import { jsPDF } from 'jspdf';
import type { LeaveRequest } from '@/lib/store/leave-management-store';
import { getLeaveTypeLabel, getLeaveStatusLabel } from '@/config/labels';
import { loadJapaneseFont } from './font-loader';

/**
 * 休暇申請一覧PDF生成
 */
export const generateLeavePDF = async (requests: LeaveRequest[]): Promise<jsPDF> => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 日本語フォントをロード
    await loadJapaneseFont(doc);
    doc.setFont('NotoSansJP', 'normal');

    let yPos = 20;

    // タイトル
    doc.setFontSize(20);
    doc.text('休暇申請一覧', 105, yPos, { align: 'center' });
    yPos += 15;

    // 統計情報
    doc.setFontSize(10);
    const totalRequests = requests.length;
    const approvedCount = requests.filter((r) => r.status === 'approved').length;
    const pendingCount = requests.filter((r) => r.status === 'pending').length;
    const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

    doc.text(`総申請数: ${totalRequests}件`, 20, yPos);
    doc.text(`承認済み: ${approvedCount}件`, 80, yPos);
    doc.text(`承認待ち: ${pendingCount}件`, 140, yPos);
    yPos += 6;
    doc.text(`却下: ${rejectedCount}件`, 20, yPos);
    yPos += 10;

    // 区切り線
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 8;

    // 申請データを表示
    for (const request of requests) {
      // 改ページチェック
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      // 申請情報ヘッダー
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`${request.userName} - ${getLeaveTypeLabel(request.type)}`, 20, yPos);

      // ステータスバッジ
      const statusLabel = getLeaveStatusLabel(request.status);
      const statusX = 150;
      doc.setFontSize(9);

      // ステータスに応じて色を設定
      if (request.status === 'approved') {
        doc.setFillColor(34, 197, 94); // green-500
      } else if (request.status === 'pending') {
        doc.setFillColor(251, 191, 36); // amber-400
      } else if (request.status === 'rejected') {
        doc.setFillColor(239, 68, 68); // red-500
      } else if (request.status === 'cancelled') {
        doc.setFillColor(156, 163, 175); // gray-400
      } else {
        doc.setFillColor(209, 213, 219); // gray-300
      }

      doc.roundedRect(statusX, yPos - 3, 30, 5, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(statusLabel, statusX + 15, yPos, { align: 'center' });
      doc.setTextColor(0, 0, 0);

      yPos += 7;

      // 詳細情報
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.text(`従業員ID: ${request.userId}`, 25, yPos);
      yPos += 5;
      doc.text(`期間: ${request.startDate} 〜 ${request.endDate}`, 25, yPos);
      doc.text(`日数: ${request.days}日`, 150, yPos);
      yPos += 5;

      // 理由
      doc.text('理由:', 25, yPos);
      yPos += 4;
      const reasonLines = doc.splitTextToSize(request.reason, 160);
      doc.text(reasonLines, 30, yPos);
      yPos += reasonLines.length * 4;

      // 承認者情報
      if (request.approver) {
        yPos += 2;
        doc.text(`承認者: ${request.approver}`, 25, yPos);
        if (request.approvedDate) {
          doc.text(`承認日: ${request.approvedDate}`, 100, yPos);
        }
        yPos += 5;
      }

      // 却下理由
      if (request.rejectedReason) {
        yPos += 2;
        doc.setFont(undefined, 'bold');
        doc.text('却下理由:', 25, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 4;
        const rejectLines = doc.splitTextToSize(request.rejectedReason, 160);
        doc.text(rejectLines, 30, yPos);
        yPos += rejectLines.length * 4;
      }

      // 申請日・更新日
      yPos += 2;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`申請日: ${new Date(request.createdAt).toLocaleString('ja-JP')}`, 25, yPos);
      doc.text(`更新日: ${new Date(request.updatedAt).toLocaleString('ja-JP')}`, 100, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 8;

      // 区切り線
      doc.setLineWidth(0.1);
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos, 190, yPos);
      doc.setDrawColor(0, 0, 0);
      yPos += 8;
    }

    // フッター（全ページ）
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
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
      doc.setTextColor(0, 0, 0);
    }

    return doc;
  } catch (error) {
    console.error('Failed to generate leave PDF:', error);
    throw new Error('休暇申請PDFの生成に失敗しました');
  }
};

/**
 * 休暇申請一覧PDFダウンロード
 */
export const downloadLeavePDF = async (requests: LeaveRequest[]): Promise<void> => {
  const pdf = await generateLeavePDF(requests);
  const date = new Date().toISOString().split('T')[0];
  const filename = `休暇申請一覧_${date}.pdf`;
  pdf.save(filename);
};

/**
 * 個別休暇申請PDFダウンロード
 */
export const downloadSingleLeavePDF = async (request: LeaveRequest): Promise<void> => {
  const pdf = await generateLeavePDF([request]);
  const filename = `休暇申請_${request.userName}_${request.startDate}.pdf`;
  pdf.save(filename);
};
