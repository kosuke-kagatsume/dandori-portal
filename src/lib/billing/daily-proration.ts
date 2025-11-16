/**
 * 日割り計算ユーティリティ
 *
 * ユーザーの追加・削除時に日割り料金を計算します
 */

import { calculateMonthlyPrice, calculateTax, type PricingTier } from './pricing-calculator';

export interface DailyProrationResult {
  date: Date;                  // 操作日
  action: 'added' | 'activated' | 'deactivated' | 'deleted';
  userCountBefore: number;     // 操作前のユーザー数
  userCountAfter: number;      // 操作後のユーザー数
  daysInMonth: number;         // 月の日数
  remainingDays: number;       // 残り日数（当日含む）
  monthlyPriceBefore: number;  // 操作前の月額料金（税抜）
  monthlyPriceAfter: number;   // 操作後の月額料金（税抜）
  dailyCharge: number;         // 日次料金（税込）
}

/**
 * 指定月の日数を取得
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * 月の残り日数を計算（当日含む）
 */
export function getRemainingDaysInMonth(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0-indexed → 1-indexed
  const day = date.getDate();
  const daysInMonth = getDaysInMonth(year, month);

  return daysInMonth - day + 1;
}

/**
 * 日割り料金を計算
 *
 * @param date - 操作日
 * @param action - 操作種別
 * @param userCountBefore - 操作前のユーザー数
 * @param userCountAfter - 操作後のユーザー数
 * @param tiers - 料金ティア
 * @returns 日割り計算結果
 */
export function calculateDailyProration(
  date: Date,
  action: 'added' | 'activated' | 'deactivated' | 'deleted',
  userCountBefore: number,
  userCountAfter: number,
  tiers?: PricingTier[]
): DailyProrationResult {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const daysInMonth = getDaysInMonth(year, month);
  const remainingDays = getRemainingDaysInMonth(date);

  // 操作前後の月額料金を計算
  const pricingBefore = calculateMonthlyPrice(userCountBefore, tiers);
  const pricingAfter = calculateMonthlyPrice(userCountAfter, tiers);

  const monthlyPriceBefore = pricingBefore.totalPrice;
  const monthlyPriceAfter = pricingAfter.totalPrice;

  // 日次料金の計算
  // (操作後の月額料金 - 操作前の月額料金) × (残り日数 / 月の日数) × 1.1（消費税）
  const priceDifference = monthlyPriceAfter - monthlyPriceBefore;
  const proratedAmount = Math.floor((priceDifference * remainingDays) / daysInMonth);
  const dailyCharge = proratedAmount + calculateTax(proratedAmount);

  return {
    date,
    action,
    userCountBefore,
    userCountAfter,
    daysInMonth,
    remainingDays,
    monthlyPriceBefore,
    monthlyPriceAfter,
    dailyCharge,
  };
}

/**
 * 月次請求額の計算（複数の日割り料金を合算）
 *
 * @param dailyCharges - 日次料金の配列
 * @param baseUserCount - 月初のユーザー数
 * @param tiers - 料金ティア
 * @returns 月次請求額（税込）
 */
export function calculateMonthlyBilling(
  dailyCharges: DailyProrationResult[],
  baseUserCount: number,
  tiers?: PricingTier[]
): {
  baseFee: number;          // 基本料金（税抜）
  baseFeeTax: number;       // 基本料金の消費税
  prorationTotal: number;   // 日割り料金合計（税込）
  subtotal: number;         // 小計（税抜）
  tax: number;              // 消費税
  total: number;            // 合計（税込）
} {
  // 基本料金（月初のユーザー数での月額料金）
  const basePricing = calculateMonthlyPrice(baseUserCount, tiers);
  const baseFee = basePricing.totalPrice;
  const baseFeeTax = calculateTax(baseFee);

  // 日割り料金の合計
  const prorationTotal = dailyCharges.reduce((sum, charge) => sum + charge.dailyCharge, 0);

  // 小計と消費税
  const subtotal = baseFee;
  const tax = baseFeeTax;

  // 合計（基本料金（税込） + 日割り料金合計）
  const total = baseFee + baseFeeTax + prorationTotal;

  return {
    baseFee,
    baseFeeTax,
    prorationTotal,
    subtotal,
    tax,
    total,
  };
}

/**
 * 日割り料金のシミュレーション（ユーザー追加時）
 *
 * @param currentUserCount - 現在のユーザー数
 * @param additionalUsers - 追加するユーザー数
 * @param addDate - 追加予定日（未指定の場合は今日）
 * @param tiers - 料金ティア
 * @returns シミュレーション結果
 */
export function simulateDailyProration(
  currentUserCount: number,
  additionalUsers: number,
  addDate: Date = new Date(),
  tiers?: PricingTier[]
) {
  const result = calculateDailyProration(
    addDate,
    'added',
    currentUserCount,
    currentUserCount + additionalUsers,
    tiers
  );

  return {
    ...result,
    message: `${additionalUsers}名追加した場合、${result.remainingDays}日分の日割り料金として ¥${result.dailyCharge.toLocaleString()} が課金されます。`,
  };
}

/**
 * 月の日割り料金履歴を取得（デバッグ用）
 */
export function generateProrationBreakdown(
  dailyCharges: DailyProrationResult[]
): string {
  const breakdown = dailyCharges.map((charge) => {
    const dateStr = charge.date.toLocaleDateString('ja-JP');
    const actionStr = {
      added: '追加',
      activated: '有効化',
      deactivated: '無効化',
      deleted: '削除',
    }[charge.action];

    return (
      `${dateStr}: ${actionStr} ` +
      `(${charge.userCountBefore}名 → ${charge.userCountAfter}名) ` +
      `¥${charge.dailyCharge.toLocaleString()}`
    );
  });

  return breakdown.join('\n');
}
