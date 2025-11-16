/**
 * PDF生成共通関数
 * 給与明細・賞与明細・源泉徴収票の共通ロジックを統合
 */

import { jsPDF } from 'jspdf';
import { loadJapaneseFont } from './font-loader';
import { PDF_COMPANY, PDF_LAYOUT, PDF_TEXT } from '@/config/pdf-constants';
import type { PDFConfig, PDFSection } from '@/types/pdf';

/**
 * 日本語フォントをセットアップ
 */
const setupJapaneseFont = async (doc: jsPDF) => {
  await loadJapaneseFont(doc);
  doc.setFont('NotoSansJP', 'normal');
};

/**
 * ヘッダーを描画（会社情報 + タイトル + サブタイトル）
 */
const drawHeader = (
  doc: jsPDF,
  config: {
    title: string;
    subtitle: string;
    companyName?: string;
    companyAddress?: string;
  },
  y: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const { MARGIN, FONT_SIZE, COLOR } = PDF_LAYOUT;

  // 会社情報（左）
  doc.setFontSize(FONT_SIZE.BODY);
  doc.setTextColor(...COLOR.TEXT.DARK_GRAY);
  doc.text(config.companyName || PDF_COMPANY.NAME, MARGIN.LEFT, y);

  // タイトル（右）
  doc.setFontSize(FONT_SIZE.TITLE);
  doc.setTextColor(...COLOR.TEXT.BLACK);
  doc.text(config.title, pageWidth - MARGIN.RIGHT, y, { align: 'right' });

  y += PDF_LAYOUT.SPACING.SM;

  // 会社住所・電話（左）+ サブタイトル（右）
  doc.setFontSize(FONT_SIZE.SMALL);
  doc.setTextColor(...COLOR.TEXT.LIGHT_GRAY);
  doc.text(
    config.companyAddress || `${PDF_COMPANY.FULL_ADDRESS} / TEL: ${PDF_COMPANY.TEL}`,
    MARGIN.LEFT,
    y
  );

  doc.setFontSize(FONT_SIZE.SUBTITLE);
  doc.text(config.subtitle, pageWidth - MARGIN.RIGHT, y, { align: 'right' });

  y += PDF_LAYOUT.SPACING.MD;

  // 区切り線
  doc.setDrawColor(...COLOR.LINE.LIGHT);
  doc.setLineWidth(PDF_LAYOUT.LINE_WIDTH.THIN);
  doc.line(MARGIN.LEFT, y, pageWidth - MARGIN.RIGHT, y);

  return y;
};

/**
 * 社員情報を描画
 */
const drawEmployeeInfo = (
  doc: jsPDF,
  config: PDFConfig['employeeInfo'],
  y: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const { MARGIN, FONT_SIZE, COLOR, SPACING } = PDF_LAYOUT;

  y += SPACING.MD;

  // 社員名（左）+ 社員番号（右）
  doc.setFontSize(FONT_SIZE.SUBTITLE);
  doc.setTextColor(...COLOR.TEXT.BLACK);
  doc.text(`${config.name} 様`, MARGIN.LEFT, y);

  doc.setFontSize(FONT_SIZE.INFO);
  doc.setTextColor(...COLOR.TEXT.MID_GRAY);
  doc.text(`社員番号: ${config.id}`, pageWidth - MARGIN.RIGHT, y, { align: 'right' });

  y += SPACING.XS;

  // 追加フィールド（部署、住所など）
  if (config.department) {
    doc.text(`所属: ${config.department}`, MARGIN.LEFT, y);
  }
  if (config.extraFields) {
    const extraEntries = Object.entries(config.extraFields);
    extraEntries.forEach(([key, value], index) => {
      if (index % 2 === 0) {
        // 左側
        doc.text(value, MARGIN.LEFT, y);
      } else {
        // 右側
        doc.text(value, pageWidth - MARGIN.RIGHT, y, { align: 'right' });
        y += SPACING.XS;
      }
    });

    // 奇数個の場合は最後に改行
    if (extraEntries.length % 2 === 1) {
      y += SPACING.XS;
    }
  } else {
    y += SPACING.XS;
  }

  return y;
};

/**
 * メインアマウントカード（最重要金額）を描画
 */
const drawMainAmountCard = (
  doc: jsPDF,
  config: {
    label: string;
    value: number;
  },
  y: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const { MARGIN, FONT_SIZE, COLOR, CARD, LINE_WIDTH, SPACING } = PDF_LAYOUT;

  y += SPACING.LG;

  // カード背景
  doc.setDrawColor(...COLOR.LINE.DARK);
  doc.setLineWidth(LINE_WIDTH.THICK);
  doc.setFillColor(...COLOR.BACKGROUND.BLUE_GRAY);
  doc.roundedRect(
    MARGIN.LEFT,
    y,
    pageWidth - MARGIN.LEFT - MARGIN.RIGHT,
    CARD.HEIGHT,
    CARD.BORDER_RADIUS,
    CARD.BORDER_RADIUS,
    'FD'
  );

  y += SPACING.MD;

  // ラベル
  doc.setFontSize(FONT_SIZE.SECTION_TITLE);
  doc.setTextColor(...COLOR.TEXT.GRAY);
  doc.text(config.label, MARGIN.LEFT + 5, y);

  // 金額
  doc.setFontSize(FONT_SIZE.MAIN_AMOUNT);
  doc.setTextColor(...COLOR.TEXT.BLACK);
  doc.text(`¥${config.value.toLocaleString()}`, pageWidth - MARGIN.RIGHT - 5, y + 6, {
    align: 'right',
  });

  y += SPACING.XXL;

  return y;
};

/**
 * 2カラムセクション（支給/控除 or 収入/控除）を描画
 */
const drawTwoColumnSections = (
  doc: jsPDF,
  leftSection: PDFSection,
  rightSection: PDFSection,
  y: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const { MARGIN, FONT_SIZE, COLOR, LINE_WIDTH, SPACING } = PDF_LAYOUT;

  const leftX = MARGIN.LEFT;
  const rightX = pageWidth / 2 + 3;
  const colWidth = (pageWidth - MARGIN.LEFT - MARGIN.RIGHT) / 2 - 3;

  // 左カラム
  let leftY = y;
  doc.setFontSize(FONT_SIZE.SECTION_TITLE);
  doc.setTextColor(...COLOR.TEXT.DARK_GRAY);
  doc.text(leftSection.title, leftX, leftY);
  leftY += SPACING.SM;

  doc.setFontSize(FONT_SIZE.BODY);
  doc.setTextColor(...COLOR.TEXT.BLACK);

  leftSection.items.forEach((item) => {
    doc.text(`• ${item.label}`, leftX + 2, leftY);
    const valueText = typeof item.value === 'number' ? `¥${item.value.toLocaleString()}` : item.value;
    doc.text(valueText, leftX + colWidth, leftY, { align: 'right' });
    leftY += SPACING.XS;
  });

  leftY += SPACING.XXS;
  doc.setDrawColor(...COLOR.LINE.MEDIUM);
  doc.setLineWidth(LINE_WIDTH.THIN);
  doc.line(leftX, leftY, leftX + colWidth, leftY);
  leftY += SPACING.XS;

  doc.setFontSize(FONT_SIZE.SECTION_TITLE);
  doc.text('合計', leftX + 2, leftY);
  doc.text(
    `¥${(leftSection.total || 0).toLocaleString()}`,
    leftX + colWidth,
    leftY,
    { align: 'right' }
  );

  // 右カラム
  let rightY = y;
  doc.setFontSize(FONT_SIZE.SECTION_TITLE);
  doc.setTextColor(...COLOR.TEXT.DARK_GRAY);
  doc.text(rightSection.title, rightX, rightY);
  rightY += SPACING.SM;

  doc.setFontSize(FONT_SIZE.BODY);
  doc.setTextColor(...COLOR.TEXT.BLACK);

  rightSection.items.forEach((item) => {
    doc.text(`• ${item.label}`, rightX + 2, rightY);
    const valueText = typeof item.value === 'number' ? `¥${item.value.toLocaleString()}` : item.value;
    doc.text(valueText, rightX + colWidth, rightY, { align: 'right' });
    rightY += SPACING.XS;
  });

  rightY += SPACING.XXS;
  doc.setDrawColor(...COLOR.LINE.MEDIUM);
  doc.setLineWidth(LINE_WIDTH.THIN);
  doc.line(rightX, rightY, rightX + colWidth, rightY);
  rightY += SPACING.XS;

  doc.setFontSize(FONT_SIZE.SECTION_TITLE);
  doc.text('合計', rightX + 2, rightY);
  doc.text(
    `¥${(rightSection.total || 0).toLocaleString()}`,
    rightX + colWidth,
    rightY,
    { align: 'right' }
  );

  return Math.max(leftY, rightY);
};

/**
 * 合計バー（支給合計 - 控除合計 = 差引）を描画
 */
const drawSummaryBar = (
  doc: jsPDF,
  config: PDFConfig['summaryBar'],
  y: number
): number => {
  if (!config) return y;

  const pageWidth = doc.internal.pageSize.getWidth();
  const { MARGIN, FONT_SIZE, COLOR, SPACING } = PDF_LAYOUT;

  y += SPACING.XL;

  // 背景
  doc.setFillColor(...COLOR.BACKGROUND.LIGHT_GRAY);
  doc.rect(MARGIN.LEFT, y, pageWidth - MARGIN.LEFT - MARGIN.RIGHT, 10, 'F');

  doc.setFontSize(FONT_SIZE.SECTION_TITLE);
  doc.setTextColor(...COLOR.TEXT.DARK_GRAY);

  const barY = y + 6;

  // 左側（支給合計）
  doc.text(config.leftLabel, MARGIN.LEFT + 5, barY);
  doc.text(`¥${config.leftTotal.toLocaleString()}`, 70, barY, { align: 'right' });

  // マイナス記号
  doc.text('−', 75, barY);

  // 中央（控除合計）
  doc.text(config.rightLabel, 80, barY);
  doc.text(`¥${config.rightTotal.toLocaleString()}`, 130, barY, { align: 'right' });

  // イコール記号
  doc.text('=', 135, barY);

  // 右側（差引）
  doc.setTextColor(...COLOR.TEXT.BLACK);
  doc.text(config.netLabel, 140, barY);
  doc.text(`¥${config.net.toLocaleString()}`, pageWidth - MARGIN.RIGHT - 5, barY, {
    align: 'right',
  });

  y += 10;

  return y;
};

/**
 * フッターを描画
 */
const drawFooter = (
  doc: jsPDF,
  config: {
    contact: string;
    note: string;
  }
): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { MARGIN, FONT_SIZE, COLOR, LINE_WIDTH } = PDF_LAYOUT;

  let y = pageHeight - MARGIN.BOTTOM;

  // 区切り線
  doc.setDrawColor(...COLOR.LINE.LIGHT);
  doc.setLineWidth(LINE_WIDTH.THIN);
  doc.line(MARGIN.LEFT, y, pageWidth - MARGIN.RIGHT, y);

  y += 5;

  // フッターテキスト
  doc.setTextColor(...COLOR.TEXT.LIGHT_GRAY);
  doc.setFontSize(FONT_SIZE.SMALL);
  doc.text(config.contact, MARGIN.LEFT, y);
  doc.text(config.note, pageWidth - MARGIN.RIGHT, y, { align: 'right' });
};

/**
 * 汎用PDFドキュメント生成関数
 */
export const generateBasePDF = async (config: PDFConfig): Promise<jsPDF> => {
  const doc = new jsPDF();
  await setupJapaneseFont(doc);

  let y = PDF_LAYOUT.MARGIN.TOP;

  // 1. ヘッダー
  y = drawHeader(doc, config, y);

  // 2. 社員情報
  y = drawEmployeeInfo(doc, config.employeeInfo, y);

  // 3. メインアマウントカード
  y = drawMainAmountCard(doc, config.mainAmount, y);

  // 4. 2カラムセクション
  y = drawTwoColumnSections(doc, config.leftSection, config.rightSection, y);

  // 5. 合計バー（オプション）
  if (config.summaryBar) {
    y = drawSummaryBar(doc, config.summaryBar, y);
  }

  // 6. フッター
  drawFooter(doc, {
    contact: `お問い合わせ：${PDF_COMPANY.DEPARTMENT}`,
    note: '※本書面は大切に保管してください',
  });

  return doc;
};

/**
 * ヘルパー関数: 日付を「YYYY年MM月」形式に変換
 */
export const formatDateToJapanese = (dateString: string): string => {
  return dateString.replace('-', '年').replace('-', '月') + '月分';
};

/**
 * ヘルパー関数: 日付を「YYYY/MM/DD」形式に変換
 */
export const formatDateToSlash = (date: string | Date): string => {
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
  return date.replace(/-/g, '/');
};

/**
 * ヘルパー関数: 現在日付を「YYYY/MM/DD」形式で取得
 */
export const getCurrentDateFormatted = (): string => {
  return new Date().toLocaleDateString('ja-JP');
};
