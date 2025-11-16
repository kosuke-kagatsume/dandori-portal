/**
 * Billing Utilities
 *
 * テナント管理・請求書機能のユーティリティライブラリ
 */

// 料金計算
export {
  calculateMonthlyPrice,
  calculateTax,
  calculateTotalWithTax,
  simulateUserAddition,
  validatePricingTiers,
  DEFAULT_PRICING_TIERS,
  type PricingTier,
  type PricingCalculationResult,
  type TierBreakdown,
} from './pricing-calculator';

// 日割り計算
export {
  calculateDailyProration,
  calculateMonthlyBilling,
  simulateDailyProration,
  getDaysInMonth,
  getRemainingDaysInMonth,
  generateProrationBreakdown,
  type DailyProrationResult,
} from './daily-proration';

// 請求書生成
export {
  generateInvoice,
  generateInvoiceNumber,
  getNextInvoiceNumber,
  calculateDueDate,
  formatInvoiceForPDF,
  updateInvoiceStatus,
  type InvoiceData,
  type InvoiceItem,
} from './invoice-generator';
