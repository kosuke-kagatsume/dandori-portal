import { jsPDF } from 'jspdf';
import type { LeaveRequest } from '@/lib/store/leave-management-store';
import { loadJapaneseFont } from './font-loader';
import { PDF_LAYOUT, PDF_COMPANY } from '@/config/pdf-constants';

/**
 * 休暇申請一覧PDF生成（統一フォーマット）
 */
export const generateLeavePDF = async (requests: LeaveRequest[]): Promise<jsPDF> => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 日本語フォント読み込み
    await loadJapaneseFont(doc);
    doc.setFont('NotoSansJP', 'normal');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const { MARGIN, FONT_SIZE, COLOR, LINE_WIDTH, SPACING } = PDF_LAYOUT;

    let y = MARGIN.TOP;

    // ===== ヘッダー =====
    doc.setFontSize(FONT_SIZE.BODY);
    doc.setTextColor(...COLOR.TEXT.DARK_GRAY);
    doc.text(PDF_COMPANY.NAME, MARGIN.LEFT, y);

    doc.setFontSize(FONT_SIZE.TITLE);
    doc.setTextColor(...COLOR.TEXT.BLACK);
    doc.text('休暇申請一覧', pageWidth - MARGIN.RIGHT, y, { align: 'right' });
    y += SPACING.SM;

    doc.setFontSize(FONT_SIZE.SMALL);
    doc.setTextColor(...COLOR.TEXT.LIGHT_GRAY);
    doc.text(`${PDF_COMPANY.FULL_ADDRESS} / TEL: ${PDF_COMPANY.TEL}`, MARGIN.LEFT, y);

    const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setFontSize(FONT_SIZE.SUBTITLE);
    doc.text(today, pageWidth - MARGIN.RIGHT, y, { align: 'right' });
    y += SPACING.MD;

    // 区切り線
    doc.setDrawColor(...COLOR.LINE.LIGHT);
    doc.setLineWidth(LINE_WIDTH.THIN);
    doc.line(MARGIN.LEFT, y, pageWidth - MARGIN.RIGHT, y);
    y += SPACING.MD;

    // ===== 統計情報 =====
    const stats = {
      total: requests.length,
      approved: requests.filter(r => r.status === 'approved').length,
      pending: requests.filter(r => r.status === 'pending').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };

    doc.setFontSize(FONT_SIZE.SECTION_TITLE);
    doc.setTextColor(...COLOR.TEXT.DARK_GRAY);
    doc.text('申請状況サマリー', MARGIN.LEFT, y);
    y += SPACING.SM;

    doc.setFontSize(FONT_SIZE.BODY);
    doc.setTextColor(...COLOR.TEXT.BLACK);
    doc.text(`総申請数: ${stats.total}件`, MARGIN.LEFT + 5, y);
    doc.text(`承認済み: ${stats.approved}件`, MARGIN.LEFT + 55, y);
    doc.text(`承認待ち: ${stats.pending}件`, MARGIN.LEFT + 105, y);
    doc.text(`却下: ${stats.rejected}件`, MARGIN.LEFT + 155, y);
    y += SPACING.LG;

    // ===== 申請一覧テーブル =====
    doc.setFontSize(FONT_SIZE.SECTION_TITLE);
    doc.setTextColor(...COLOR.TEXT.DARK_GRAY);
    doc.text('申請一覧', MARGIN.LEFT, y);
    y += SPACING.SM;

    // テーブルヘッダー
    doc.setFillColor(...COLOR.BACKGROUND.BLUE_GRAY);
    doc.rect(MARGIN.LEFT, y, pageWidth - MARGIN.LEFT - MARGIN.RIGHT, 7, 'F');

    doc.setFontSize(FONT_SIZE.SMALL);
    doc.setTextColor(...COLOR.TEXT.BLACK);
    const headerY = y + 5;
    doc.text('従業員名', MARGIN.LEFT + 2, headerY);
    doc.text('種別', MARGIN.LEFT + 40, headerY);
    doc.text('期間', MARGIN.LEFT + 65, headerY);
    doc.text('日数', MARGIN.LEFT + 115, headerY);
    doc.text('ステータス', MARGIN.LEFT + 130, headerY);
    doc.text('承認者', MARGIN.LEFT + 160, headerY);
    y += 7;

    // テーブル行
    doc.setFontSize(FONT_SIZE.SMALL);

    const statusLabels: Record<string, string> = {
      draft: '下書き',
      pending: '承認待ち',
      approved: '承認済み',
      rejected: '却下',
      cancelled: 'キャンセル',
    };

    const typeLabels: Record<string, string> = {
      paid: '有給',
      sick: '病気',
      special: '特別',
      compensatory: '代休',
      half_day_am: '午前半休',
      half_day_pm: '午後半休',
    };

    for (const request of requests) {
      // 改ページチェック
      if (y > pageHeight - 40) {
        doc.addPage();
        y = MARGIN.TOP;
      }

      // 行の背景色（交互）
      const rowIndex = requests.indexOf(request);
      if (rowIndex % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(MARGIN.LEFT, y, pageWidth - MARGIN.LEFT - MARGIN.RIGHT, 6, 'F');
      }

      // ステータスに応じた色
      if (request.status === 'approved') {
        doc.setTextColor(34, 197, 94); // green
      } else if (request.status === 'rejected') {
        doc.setTextColor(239, 68, 68); // red
      } else {
        doc.setTextColor(...COLOR.TEXT.BLACK);
      }

      const rowY = y + 4;
      doc.text(request.userName, MARGIN.LEFT + 2, rowY);
      doc.text(typeLabels[request.type] || request.type, MARGIN.LEFT + 40, rowY);
      doc.text(`${request.startDate}〜`, MARGIN.LEFT + 65, rowY);
      doc.text(`${request.days}日`, MARGIN.LEFT + 115, rowY);
      doc.text(statusLabels[request.status] || request.status, MARGIN.LEFT + 130, rowY);
      doc.text(request.approver || '-', MARGIN.LEFT + 160, rowY);

      y += 6;
    }

    y += SPACING.LG;

    // ===== 詳細セクション（最初の5件のみ） =====
    if (requests.length > 0) {
      const detailRequests = requests.slice(0, 5);

      doc.setFontSize(FONT_SIZE.SECTION_TITLE);
      doc.setTextColor(...COLOR.TEXT.DARK_GRAY);
      doc.text('申請詳細（最新5件）', MARGIN.LEFT, y);
      y += SPACING.SM;

      for (const request of detailRequests) {
        // 改ページチェック
        if (y > pageHeight - 60) {
          doc.addPage();
          y = MARGIN.TOP;
        }

        // 申請カード
        doc.setDrawColor(...COLOR.LINE.MEDIUM);
        doc.setLineWidth(LINE_WIDTH.THIN);
        doc.roundedRect(MARGIN.LEFT, y, pageWidth - MARGIN.LEFT - MARGIN.RIGHT, 25, 2, 2);

        y += 5;

        // 従業員名 + ステータス
        doc.setFontSize(FONT_SIZE.SECTION_TITLE);
        doc.setTextColor(...COLOR.TEXT.BLACK);
        doc.text(`${request.userName} - ${typeLabels[request.type]}`, MARGIN.LEFT + 3, y);

        // ステータスバッジ
        const statusLabel = statusLabels[request.status];
        const badgeX = pageWidth - MARGIN.RIGHT - 30;
        if (request.status === 'approved') {
          doc.setFillColor(34, 197, 94);
        } else if (request.status === 'pending') {
          doc.setFillColor(251, 191, 36);
        } else if (request.status === 'rejected') {
          doc.setFillColor(239, 68, 68);
        } else {
          doc.setFillColor(156, 163, 175);
        }
        doc.roundedRect(badgeX, y - 3, 25, 5, 1, 1, 'F');
        doc.setFontSize(FONT_SIZE.SMALL);
        doc.setTextColor(255, 255, 255);
        doc.text(statusLabel, badgeX + 12.5, y, { align: 'center' });

        y += 5;

        // 詳細情報
        doc.setFontSize(FONT_SIZE.SMALL);
        doc.setTextColor(...COLOR.TEXT.MID_GRAY);
        doc.text(`期間: ${request.startDate} 〜 ${request.endDate} (${request.days}日)`, MARGIN.LEFT + 3, y);
        y += 4;

        doc.text(`理由: ${request.reason}`, MARGIN.LEFT + 3, y);
        y += 4;

        if (request.approver) {
          doc.text(`承認者: ${request.approver}`, MARGIN.LEFT + 3, y);
          if (request.approvedDate) {
            doc.text(`承認日: ${request.approvedDate}`, MARGIN.LEFT + 70, y);
          }
          y += 4;
        }

        doc.setFontSize(8);
        doc.setTextColor(...COLOR.TEXT.LIGHT_GRAY);
        doc.text(`申請日: ${new Date(request.createdAt).toLocaleString('ja-JP')}`, MARGIN.LEFT + 3, y);

        y += 8;
      }
    }

    // ===== フッター =====
    const footerY = pageHeight - MARGIN.BOTTOM;
    doc.setDrawColor(...COLOR.LINE.LIGHT);
    doc.setLineWidth(LINE_WIDTH.THIN);
    doc.line(MARGIN.LEFT, footerY, pageWidth - MARGIN.RIGHT, footerY);

    doc.setTextColor(...COLOR.TEXT.LIGHT_GRAY);
    doc.setFontSize(FONT_SIZE.SMALL);
    doc.text(`お問い合わせ：${PDF_COMPANY.DEPARTMENT}`, MARGIN.LEFT, footerY + 5);
    doc.text('※本書面は大切に保管してください', pageWidth - MARGIN.RIGHT, footerY + 5, { align: 'right' });

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
