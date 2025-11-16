/**
 * 請求書自動生成ユーティリティ
 *
 * 月次請求書の自動生成と請求書番号の採番を行います
 */

import { calculateMonthlyPrice, calculateTax } from './pricing-calculator';
import type { PricingTier, DailyProrationResult } from './index';

export interface InvoiceData {
  id: string;
  invoiceNumber: string;        // INV-2025-11-001
  tenantId: string;
  tenantName: string;
  billingMonth: Date;            // 2025-11-01
  subtotal: number;              // 小計（税抜・円）
  tax: number;                   // 消費税（円）
  total: number;                 // 合計（税込・円）
  status: 'draft' | 'sent' | 'paid';
  dueDate: Date;                 // 支払い期限
  paidDate?: Date;               // 支払日
  sentDate?: Date;               // メール送信日時
  billingEmail: string;          // 請求先メールアドレス
  memo?: string;                 // メモ
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;           // 「アクティブユーザー 49名（11/1-11/30）」
  quantity: number;              // ユーザー数
  unitPrice: number;             // 単価（税抜・円）
  amount: number;                // 金額（税抜・円）
  period?: string;               // 「2025-11-01 〜 2025-11-30」
}

/**
 * 請求書番号を生成（INV-YYYY-MM-NNN形式）
 *
 * @param year - 年（2025）
 * @param month - 月（11）
 * @param sequenceNumber - 連番（1, 2, 3...）
 * @returns 請求書番号（例: INV-2025-11-001）
 */
export function generateInvoiceNumber(
  year: number,
  month: number,
  sequenceNumber: number
): string {
  const monthStr = month.toString().padStart(2, '0');
  const seqStr = sequenceNumber.toString().padStart(3, '0');
  return `INV-${year}-${monthStr}-${seqStr}`;
}

/**
 * 次の請求書番号を取得
 *
 * @param existingInvoices - 既存の請求書リスト
 * @param year - 年
 * @param month - 月
 * @returns 次の請求書番号
 */
export function getNextInvoiceNumber(
  existingInvoices: { invoiceNumber: string }[],
  year: number,
  month: number
): string {
  const prefix = `INV-${year}-${month.toString().padStart(2, '0')}-`;
  const invoicesInMonth = existingInvoices.filter((inv) =>
    inv.invoiceNumber.startsWith(prefix)
  );

  let maxSequence = 0;
  invoicesInMonth.forEach((inv) => {
    const parts = inv.invoiceNumber.split('-');
    const seq = parseInt(parts[3], 10);
    if (seq > maxSequence) {
      maxSequence = seq;
    }
  });

  return generateInvoiceNumber(year, month, maxSequence + 1);
}

/**
 * 支払い期限を計算（月末 + 30日）
 *
 * @param billingMonth - 請求月（2025-11-01）
 * @returns 支払い期限（2025-12-31）
 */
export function calculateDueDate(billingMonth: Date): Date {
  const year = billingMonth.getFullYear();
  const month = billingMonth.getMonth();

  // 月末を取得
  const lastDay = new Date(year, month + 1, 0);

  // 30日後を計算
  const dueDate = new Date(lastDay);
  dueDate.setDate(dueDate.getDate() + 30);

  return dueDate;
}

/**
 * 請求書を生成
 *
 * @param params - 請求書生成パラメータ
 * @returns 請求書データ
 */
export function generateInvoice(params: {
  tenantId: string;
  tenantName: string;
  billingMonth: Date;              // 2025-11-01
  userCount: number;               // 月末のユーザー数
  dailyProrations?: DailyProrationResult[]; // 日割り料金リスト
  existingInvoices: { invoiceNumber: string }[];
  billingEmail: string;
  pricingTiers?: PricingTier[];
  memo?: string;
}): Omit<InvoiceData, 'id'> {
  const {
    tenantId,
    tenantName,
    billingMonth,
    userCount,
    dailyProrations = [],
    existingInvoices,
    billingEmail,
    pricingTiers,
    memo,
  } = params;

  const year = billingMonth.getFullYear();
  const month = billingMonth.getMonth() + 1;

  // 請求書番号を生成
  const invoiceNumber = getNextInvoiceNumber(existingInvoices, year, month);

  // 支払い期限を計算
  const dueDate = calculateDueDate(billingMonth);

  // 請求明細を生成
  const items: InvoiceItem[] = [];

  // 1. 基本料金（月額料金）
  const monthlyPricing = calculateMonthlyPrice(userCount, pricingTiers);
  const lastDayOfMonth = new Date(year, month, 0);
  const periodStr = `${billingMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })} 〜 ${lastDayOfMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}`;

  items.push({
    id: `item-base-${tenantId}-${year}-${month}`,
    description: `アクティブユーザー ${userCount}名（${month}/1-${month}/${lastDayOfMonth.getDate()}）`,
    quantity: userCount,
    unitPrice: Math.floor(monthlyPricing.totalPrice / userCount), // 平均単価
    amount: monthlyPricing.totalPrice,
    period: periodStr,
  });

  // 2. 日割り料金（ユーザー追加・削除）
  if (dailyProrations.length > 0) {
    dailyProrations.forEach((proration, index) => {
      const actionStr = {
        added: '追加',
        activated: '有効化',
        deactivated: '無効化',
        deleted: '削除',
      }[proration.action];

      const userChange = proration.userCountAfter - proration.userCountBefore;
      const dateStr = proration.date.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' });

      items.push({
        id: `item-proration-${tenantId}-${year}-${month}-${index}`,
        description: `${dateStr} ユーザー${actionStr}（${Math.abs(userChange)}名、${proration.remainingDays}日分）`,
        quantity: Math.abs(userChange),
        unitPrice: Math.floor(proration.dailyCharge / Math.abs(userChange)),
        amount: proration.dailyCharge - calculateTax(proration.dailyCharge), // 税抜に戻す
        period: dateStr,
      });
    });
  }

  // 小計・消費税・合計を計算
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  return {
    invoiceNumber,
    tenantId,
    tenantName,
    billingMonth,
    subtotal,
    tax,
    total,
    status: 'draft',
    dueDate,
    billingEmail,
    memo,
    items,
  };
}

/**
 * 請求書をPDF用のフォーマットに変換
 *
 * @param invoice - 請求書データ
 * @returns PDF用フォーマット
 */
export function formatInvoiceForPDF(invoice: InvoiceData) {
  return {
    invoiceNumber: invoice.invoiceNumber,
    issueDate: new Date().toLocaleDateString('ja-JP'),
    dueDate: invoice.dueDate.toLocaleDateString('ja-JP'),
    billingMonth: invoice.billingMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }),
    tenantName: invoice.tenantName,
    billingEmail: invoice.billingEmail,
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: `¥${item.unitPrice.toLocaleString()}`,
      amount: `¥${item.amount.toLocaleString()}`,
    })),
    subtotal: `¥${invoice.subtotal.toLocaleString()}`,
    tax: `¥${invoice.tax.toLocaleString()}`,
    total: `¥${invoice.total.toLocaleString()}`,
    memo: invoice.memo || '',
  };
}

/**
 * 請求書ステータスを更新
 */
export function updateInvoiceStatus(
  invoice: InvoiceData,
  status: 'draft' | 'sent' | 'paid',
  options?: {
    sentDate?: Date;
    paidDate?: Date;
  }
): InvoiceData {
  const updated = { ...invoice, status };

  if (status === 'sent' && options?.sentDate) {
    updated.sentDate = options.sentDate;
  }

  if (status === 'paid' && options?.paidDate) {
    updated.paidDate = options.paidDate;
  }

  return updated;
}
