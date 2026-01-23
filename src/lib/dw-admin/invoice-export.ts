/**
 * 請求書エクスポートユーティリティ
 * CSV/Excel形式での請求書一覧出力機能
 */

import type { InvoiceData as BaseInvoiceData } from '@/lib/billing/invoice-generator';

// 拡張請求書データ型（issueDate を含む）
type InvoiceData = BaseInvoiceData & {
  issueDate?: Date | string | null;
};

// ===== ヘルパー関数 =====

/**
 * CSVエスケープ処理
 */
const escapeCSV = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // カンマ、改行、ダブルクォートを含む場合はダブルクォートで囲む
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * CSV文字列を生成
 */
const generateCSVString = (headers: string[], rows: (string | number)[][]): string => {
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = rows.map((row) => row.map(escapeCSV).join(',')).join('\n');
  return `${headerRow}\n${dataRows}`;
};

/**
 * CSVファイルをダウンロード
 */
const downloadCSV = (csvString: string, filename: string): void => {
  try {
    // BOM付きUTF-8に変換（Excel対応）
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
const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * ステータスを日本語に変換
 */
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'draft':
      return '下書き';
    case 'sent':
      return '送信済み';
    case 'paid':
      return '支払済み';
    default:
      return status;
  }
};

// ===== エクスポート関数 =====

/**
 * 請求書一覧をCSV出力
 */
export const exportInvoicesToCSV = (
  invoices: InvoiceData[],
  filename?: string
): { success: boolean; error?: string; recordCount: number } => {
  try {
    if (!invoices || invoices.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const headers = [
      '請求書番号',
      'テナント名',
      '請求月',
      '発行日',
      '支払期限',
      '小計（税抜）',
      '消費税',
      '合計（税込）',
      'ステータス',
      '送信日',
      '支払日',
      '支払方法',
      '備考',
    ];

    const rows = invoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.tenantName,
      new Date(invoice.billingMonth).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
      }),
      new Date(invoice.issueDate ?? invoice.billingMonth).toLocaleDateString('ja-JP'),
      new Date(invoice.dueDate).toLocaleDateString('ja-JP'),
      invoice.subtotal,
      invoice.tax,
      invoice.total,
      getStatusLabel(invoice.status),
      invoice.sentDate ? new Date(invoice.sentDate).toLocaleDateString('ja-JP') : '',
      invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString('ja-JP') : '',
      invoice.paymentMethod === 'bank_transfer'
        ? '銀行振込'
        : invoice.paymentMethod === 'credit_card'
        ? 'クレジットカード'
        : invoice.paymentMethod || '',
      invoice.memo || '',
    ]);

    const csvString = generateCSVString(headers, rows);
    const finalFilename = filename || `請求書一覧_${getCurrentDate()}.csv`;

    downloadCSV(csvString, finalFilename);

    return {
      success: true,
      recordCount: invoices.length,
    };
  } catch (error) {
    console.error('Invoice CSV export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'CSV出力に失敗しました',
      recordCount: 0,
    };
  }
};

/**
 * 請求書詳細（明細付き）をCSV出力
 */
export const exportInvoiceDetailsToCSV = (
  invoices: InvoiceData[],
  filename?: string
): { success: boolean; error?: string; recordCount: number } => {
  try {
    if (!invoices || invoices.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const headers = [
      '請求書番号',
      'テナント名',
      '請求月',
      '発行日',
      '項目',
      '数量',
      '単価',
      '金額',
      '小計（税抜）',
      '消費税',
      '合計（税込）',
      'ステータス',
    ];

    const rows: (string | number)[][] = [];

    invoices.forEach((invoice) => {
      invoice.items.forEach((item, index) => {
        rows.push([
          index === 0 ? invoice.invoiceNumber : '', // 最初の行のみ請求書番号を表示
          index === 0 ? invoice.tenantName : '',
          index === 0
            ? new Date(invoice.billingMonth).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
              })
            : '',
          index === 0 ? new Date(invoice.issueDate ?? invoice.billingMonth).toLocaleDateString('ja-JP') : '',
          item.description,
          item.quantity,
          item.unitPrice,
          item.amount,
          index === 0 ? invoice.subtotal : '',
          index === 0 ? invoice.tax : '',
          index === 0 ? invoice.total : '',
          index === 0 ? getStatusLabel(invoice.status) : '',
        ]);
      });

      // 空行を追加（請求書間の区切り）
      rows.push(['', '', '', '', '', '', '', '', '', '', '', '']);
    });

    const csvString = generateCSVString(headers, rows);
    const finalFilename = filename || `請求書明細一覧_${getCurrentDate()}.csv`;

    downloadCSV(csvString, finalFilename);

    return {
      success: true,
      recordCount: invoices.length,
    };
  } catch (error) {
    console.error('Invoice details CSV export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'CSV出力に失敗しました',
      recordCount: 0,
    };
  }
};
