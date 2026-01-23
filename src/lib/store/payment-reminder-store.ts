/**
 * 支払い期限リマインダー管理ストア
 *
 * 機能:
 * - リマインダー設定管理（通知タイミング）
 * - 自動リマインダー検知
 * - リマインダー履歴管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useInvoiceStore } from './invoice-store';
import { useNotificationHistoryStore } from './notification-history-store';

// ============================================================================
// TYPES
// ============================================================================

export interface ReminderSettings {
  enabled: boolean;
  daysBeforeDue: number[]; // [3, 1, 0] = 3日前、1日前、当日
  overdueCheckEnabled: boolean;
  overdueCheckDays: number[]; // [1, 3, 7] = 期限超過1日後、3日後、7日後
}

export interface ReminderHistory {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  dueDate: string; // ISO 8601形式
  reminderType: 'before_due' | 'on_due' | 'overdue';
  daysFromDue: number; // 3日前なら-3、当日なら0、期限超過1日なら1
  sentAt: string; // ISO 8601形式
  notificationId?: string; // 生成された通知のID
}

interface PaymentReminderStore {
  // 設定
  settings: ReminderSettings;
  updateSettings: (settings: Partial<ReminderSettings>) => void;

  // リマインダー履歴
  history: ReminderHistory[];
  addHistory: (history: Omit<ReminderHistory, 'id' | 'sentAt'>) => void;
  getHistoryByInvoice: (invoiceId: string) => ReminderHistory[];
  getHistoryByTenant: (tenantId: string) => ReminderHistory[];

  // 自動検知
  checkAndGenerateReminders: () => Promise<void>;

  // 統計
  getStats: () => {
    totalReminders: number;
    beforeDueReminders: number;
    onDueReminders: number;
    overdueReminders: number;
  };

  // 初期化
  initializeStore: () => void;
}

// ============================================================================
// STORE
// ============================================================================

export const usePaymentReminderStore = create<PaymentReminderStore>()(
  persist(
    (set, get) => ({
      // デフォルト設定
      settings: {
        enabled: true,
        daysBeforeDue: [3, 1], // 3日前と1日前
        overdueCheckEnabled: true,
        overdueCheckDays: [1, 3, 7], // 期限超過1日、3日、7日後
      },

      history: [],

      // 設定更新
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        }));
      },

      // 履歴追加
      addHistory: (historyData) => {
        const id = `reminder-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newHistory: ReminderHistory = {
          ...historyData,
          id,
          sentAt: new Date().toISOString(),
        };

        set((state) => ({
          history: [newHistory, ...state.history],
        }));
      },

      // 請求書別履歴取得
      getHistoryByInvoice: (invoiceId) => {
        return get().history.filter((h) => h.invoiceId === invoiceId);
      },

      // テナント別履歴取得
      getHistoryByTenant: (tenantId) => {
        return get().history.filter((h) => h.tenantId === tenantId);
      },

      // 自動リマインダー検知と生成
      checkAndGenerateReminders: async () => {
        const { settings, history, addHistory } = get();

        if (!settings.enabled) {
          return;
        }

        const invoiceStore = useInvoiceStore.getState();
        const notificationStore = useNotificationHistoryStore.getState();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 未払い請求書を取得
        const unpaidInvoices = invoiceStore.getAllInvoices().filter((inv) => inv.status !== 'paid');

        for (const invoice of unpaidInvoices) {
          const dueDate = new Date(invoice.dueDate);
          dueDate.setHours(0, 0, 0, 0);

          const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          // 期限前のリマインダー
          if (diffDays >= 0 && settings.daysBeforeDue.includes(diffDays)) {
            // すでにリマインダーを送信済みかチェック
            const alreadySent = history.some(
              (h) =>
                h.invoiceId === invoice.id &&
                h.daysFromDue === -diffDays &&
                h.reminderType === (diffDays === 0 ? 'on_due' : 'before_due')
            );

            if (!alreadySent) {
              // 通知生成
              const notification = await notificationStore.addNotification({
                type: 'payment_reminder',
                title:
                  diffDays === 0
                    ? `【支払期限当日】請求書 ${invoice.invoiceNumber} のお支払いをお願いします`
                    : `【支払期限${diffDays}日前】請求書 ${invoice.invoiceNumber} のお支払いをお願いします`,
                priority: 'normal',
                tenantId: invoice.tenantId,
                tenantName: invoice.tenantName,
                invoiceId: invoice.id,
                amount: invoice.total,
              });

              // 履歴に追加
              addHistory({
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                tenantId: invoice.tenantId,
                tenantName: invoice.tenantName,
                dueDate: invoice.dueDate,
                reminderType: diffDays === 0 ? 'on_due' : 'before_due',
                daysFromDue: -diffDays,
                notificationId: notification?.id,
              });
            }
          }

          // 期限超過のリマインダー
          if (diffDays < 0 && settings.overdueCheckEnabled) {
            const overdueDays = Math.abs(diffDays);

            if (settings.overdueCheckDays.includes(overdueDays)) {
              // すでにリマインダーを送信済みかチェック
              const alreadySent = history.some(
                (h) =>
                  h.invoiceId === invoice.id &&
                  h.daysFromDue === overdueDays &&
                  h.reminderType === 'overdue'
              );

              if (!alreadySent) {
                // 通知生成
                const notification = await notificationStore.addNotification({
                  type: 'payment_overdue',
                  title: `【支払期限超過${overdueDays}日】請求書 ${invoice.invoiceNumber} の至急のお支払いをお願いします`,
                  priority: 'high',
                  tenantId: invoice.tenantId,
                  tenantName: invoice.tenantName,
                  invoiceId: invoice.id,
                  amount: invoice.total,
                });

                // 履歴に追加
                addHistory({
                  invoiceId: invoice.id,
                  invoiceNumber: invoice.invoiceNumber,
                  tenantId: invoice.tenantId,
                  tenantName: invoice.tenantName,
                  dueDate: invoice.dueDate,
                  reminderType: 'overdue',
                  daysFromDue: overdueDays,
                  notificationId: notification?.id,
                });
              }
            }
          }
        }
      },

      // 統計取得
      getStats: () => {
        const { history } = get();

        return {
          totalReminders: history.length,
          beforeDueReminders: history.filter((h) => h.reminderType === 'before_due').length,
          onDueReminders: history.filter((h) => h.reminderType === 'on_due').length,
          overdueReminders: history.filter((h) => h.reminderType === 'overdue').length,
        };
      },

      // 初期化
      initializeStore: () => {
        // デフォルト設定のみ保持、履歴はクリーンスタート
        const currentSettings = get().settings;
        set({
          settings: currentSettings,
          history: [],
        });
      },
    }),
    {
      name: 'payment-reminder-storage',
      version: 1,
    }
  )
);
