import { jsPDF } from 'jspdf';
import { generateBasePDF, formatDateToSlash, getCurrentDateFormatted } from './pdf-common';
import type { InvoiceData } from '@/lib/billing/invoice-generator';
import type { PDFConfig } from '@/types/pdf';

/**
 * 支払い方法の日本語ラベル
 */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: '銀行振込',
  credit_card: 'クレジットカード',
  invoice: '請求書払い',
  other: 'その他',
};

/**
 * 領収書PDF生成
 */
export const generateReceiptPDF = async (invoiceData: InvoiceData): Promise<jsPDF> => {
  try {
    // 支払い済みでない場合はエラー
    if (invoiceData.status !== 'paid' || !invoiceData.paidDate) {
      throw new Error('支払い済みの請求書のみ領収書を発行できます');
    }

    // 領収明細項目
    const receiptItems = invoiceData.items.map((item) => ({
      label: item.description,
      value: item.amount,
    }));

    // 支払い方法ラベル
    const paymentMethodLabel = invoiceData.paymentMethod
      ? PAYMENT_METHOD_LABELS[invoiceData.paymentMethod] || 'その他'
      : '銀行振込';

    // PDF設定
    const config: PDFConfig = {
      title: `領収書 ${invoiceData.invoiceNumber}`,
      subtitle: `${new Date(invoiceData.billingMonth).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}分`,
      mainAmount: {
        label: 'お支払い金額（税込）',
        value: invoiceData.total,
      },
      leftSection: {
        title: '領収明細',
        items: receiptItems,
        total: invoiceData.subtotal,
      },
      rightSection: {
        title: '支払い情報',
        items: [
          { label: '小計（税抜）', value: invoiceData.subtotal },
          { label: '消費税（10%）', value: invoiceData.tax },
          { label: '支払日', value: formatDateToSlash(new Date(invoiceData.paidDate)) },
          { label: '支払い方法', value: paymentMethodLabel },
        ],
        total: invoiceData.total,
      },
      summaryBar: {
        leftLabel: '小計',
        leftTotal: invoiceData.subtotal,
        rightLabel: '消費税',
        rightTotal: invoiceData.tax,
        netLabel: '合計（税込）',
        net: invoiceData.total,
      },
      employeeInfo: {
        name: invoiceData.tenantName,
        id: invoiceData.tenantId,
        department: '',
        extraFields: {
          invoiceNumber: `領収書番号: ${invoiceData.invoiceNumber}`,
          billingEmail: `請求先: ${invoiceData.billingEmail}`,
          paidDate: `支払日: ${formatDateToSlash(new Date(invoiceData.paidDate))}`,
          paymentMethod: `支払い方法: ${paymentMethodLabel}`,
          issueDate: `発行日: ${getCurrentDateFormatted()}`,
          memo: invoiceData.memo ? `備考: ${invoiceData.memo}` : '',
        },
      },
    };

    return await generateBasePDF(config);
  } catch (error) {
    console.error('Failed to generate receipt PDF:', error);
    throw new Error('領収書PDFの生成に失敗しました');
  }
};

/**
 * 領収書PDFをダウンロード
 */
export const downloadReceiptPDF = async (invoiceData: InvoiceData): Promise<void> => {
  try {
    const pdf = await generateReceiptPDF(invoiceData);
    const fileName = `領収書_${invoiceData.invoiceNumber}_${invoiceData.tenantName}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Failed to download receipt PDF:', error);
    throw error;
  }
};
