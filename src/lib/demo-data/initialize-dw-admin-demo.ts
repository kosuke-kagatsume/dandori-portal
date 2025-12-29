/**
 * DW管理画面のデモデータ初期化
 *
 * @deprecated 2025-12: ストアがAPIベースに移行したため、このファイルは廃止されました。
 * デモデータはサーバーサイドで初期化してください（prisma/seed.ts など）。
 *
 * 以前の機能：
 * - 全テナントに対して過去6ヶ月分の請求書を生成
 * - リマインダーを生成
 * - 通知履歴を生成
 */

/**
 * DW管理画面のデモデータを初期化
 * @deprecated ストアがAPIベースに移行したため廃止。サーバーサイドでデモデータを初期化してください。
 */
export function initializeDWAdminDemo(): {
  tenants: number;
  invoices: number;
  notifications: number;
  reminders: number;
} {
  console.warn('⚠️ initializeDWAdminDemo is deprecated. Demo data should be initialized on the server side.');
  return {
    tenants: 0,
    invoices: 0,
    notifications: 0,
    reminders: 0,
  };
}
