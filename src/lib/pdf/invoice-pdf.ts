import { jsPDF } from 'jspdf';
import { generateBasePDF, formatDateToSlash, getCurrentDateFormatted } from './pdf-common';
import type { InvoiceData } from '@/lib/billing/invoice-generator';
import type { PDFConfig } from '@/types/pdf';

/**
 * 請求書PDF生成
 */
export const generateInvoicePDF = async (invoiceData: InvoiceData): Promise<jsPDF> => {
  try {
    // 請求明細項目
    const invoiceItems = invoiceData.items.map((item) => ({
      label: item.description,
      value: item.amount,
    }));

    // PDF設定
    const config: PDFConfig = {
      title: `請求書 ${invoiceData.invoiceNumber}`,
      subtitle: `${new Date(invoiceData.billingMonth).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}分`,
      mainAmount: {
        label: 'お支払い金額（税込）',
        value: invoiceData.total,
      },
      leftSection: {
        title: '請求明細',
        items: invoiceItems,
        total: invoiceData.subtotal,
      },
      rightSection: {
        title: '請求情報',
        items: [
          { label: '小計（税抜）', value: invoiceData.subtotal },
          { label: '消費税（10%）', value: invoiceData.tax },
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
          invoiceNumber: `請求書番号: ${invoiceData.invoiceNumber}`,
          billingEmail: `請求先: ${invoiceData.billingEmail}`,
          dueDate: `お支払い期限: ${formatDateToSlash(new Date(invoiceData.dueDate))}`,
          issueDate: `発行日: ${getCurrentDateFormatted()}`,
          memo: invoiceData.memo ? `備考: ${invoiceData.memo}` : '',
        },
      },
    };

    return await generateBasePDF(config);
  } catch (error) {
    console.error('Failed to generate invoice PDF:', error);
    throw new Error('請求書PDFの生成に失敗しました');
  }
};

/**
 * 請求書PDFをダウンロード
 */
export const downloadInvoicePDF = async (invoiceData: InvoiceData): Promise<void> => {
  try {
    const pdf = await generateInvoicePDF(invoiceData);
    const fileName = `請求書_${invoiceData.invoiceNumber}_${invoiceData.tenantName}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Failed to download invoice PDF:', error);
    throw error;
  }
};
