/**
 * メール通知履歴管理ストア
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType =
  | 'invoice_sent'       // 請求書発行通知
  | 'payment_reminder'   // 支払期限リマインダー
  | 'payment_overdue'    // 支払期限超過通知
  | 'payment_received'   // 入金確認通知
  | 'receipt_sent';      // 領収書発行通知

export type NotificationStatus =
  | 'sent'      // 送信済み
  | 'failed'    // 送信失敗
  | 'pending';  // 送信待ち

export interface NotificationHistory {
  id: string;
  type: NotificationType;
  tenantId: string;
  tenantName: string;
  recipientEmail: string;
  subject: string;
  body?: string;
  sentAt: Date;
  status: NotificationStatus;
  invoiceNumber?: string;
  errorMessage?: string;
  error?: string;
  metadata?: Record<string, any>;
}

interface NotificationHistoryStore {
  notifications: NotificationHistory[];

  // CRUD操作
  addNotification: (notification: Omit<NotificationHistory, 'id' | 'sentAt'>) => void;
  getNotificationById: (id: string) => NotificationHistory | undefined;
  getNotificationsByTenant: (tenantId: string) => NotificationHistory[];
  getNotificationsByType: (type: NotificationType) => NotificationHistory[];
  getNotificationsByInvoice: (invoiceNumber: string) => NotificationHistory[];
  getAllNotifications: () => NotificationHistory[];
  resendNotification: (id: string) => void;

  // 統計
  getStats: () => {
    totalSent: number;
    totalFailed: number;
    totalPending: number;
    byType: Record<NotificationType, number>;
  };

  // 初期化
  initializeNotifications: () => void;
}

// 通知タイプのラベル
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  invoice_sent: '請求書発行',
  payment_reminder: '支払期限リマインダー',
  payment_overdue: '支払期限超過',
  payment_received: '入金確認',
  receipt_sent: '領収書発行',
};

// デモ通知履歴データ
const generateDemoNotifications = (): NotificationHistory[] => {
  const notifications: NotificationHistory[] = [];
  const today = new Date();

  // 過去30日間の通知履歴を生成
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // 請求書発行通知
    if (i % 5 === 0) {
      notifications.push({
        id: `notif_${String(notifications.length + 1).padStart(3, '0')}`,
        type: 'invoice_sent',
        tenantId: 'tenant_001',
        tenantName: 'デモ株式会社',
        recipientEmail: 'billing@demo.com',
        subject: `【請求書発行】INV-2025-${String(10 - Math.floor(i / 5)).padStart(2, '0')}-001`,
        sentAt: date,
        status: 'sent',
        invoiceNumber: `INV-2025-${String(10 - Math.floor(i / 5)).padStart(2, '0')}-001`,
      });
    }

    // 支払期限リマインダー
    if (i % 7 === 0 && i > 0) {
      notifications.push({
        id: `notif_${String(notifications.length + 1).padStart(3, '0')}`,
        type: 'payment_reminder',
        tenantId: 'tenant_001',
        tenantName: 'デモ株式会社',
        recipientEmail: 'billing@demo.com',
        subject: '【リマインダー】お支払い期限が近づいています',
        sentAt: date,
        status: 'sent',
        invoiceNumber: `INV-2025-${String(10 - Math.floor(i / 7)).padStart(2, '0')}-001`,
      });
    }

    // 入金確認通知
    if (i % 10 === 0 && i > 0) {
      notifications.push({
        id: `notif_${String(notifications.length + 1).padStart(3, '0')}`,
        type: 'payment_received',
        tenantId: 'tenant_001',
        tenantName: 'デモ株式会社',
        recipientEmail: 'billing@demo.com',
        subject: '【入金確認】ご入金ありがとうございました',
        sentAt: date,
        status: 'sent',
        invoiceNumber: `INV-2025-${String(9 - Math.floor(i / 10)).padStart(2, '0')}-001`,
      });
    }
  }

  return notifications;
};

export const useNotificationHistoryStore = create<NotificationHistoryStore>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) => {
        const newNotification: NotificationHistory = {
          ...notification,
          id: `notif_${String(get().notifications.length + 1).padStart(3, '0')}`,
          sentAt: new Date(),
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },

      getNotificationsByTenant: (tenantId) => {
        return get().notifications.filter((n) => n.tenantId === tenantId);
      },

      getNotificationsByType: (type) => {
        return get().notifications.filter((n) => n.type === type);
      },

      getNotificationsByInvoice: (invoiceNumber) => {
        return get().notifications.filter((n) => n.invoiceNumber === invoiceNumber);
      },

      getAllNotifications: () => {
        return get().notifications.sort((a, b) => {
          const dateA = new Date(a.sentAt);
          const dateB = new Date(b.sentAt);
          return dateB.getTime() - dateA.getTime();
        });
      },

      getNotificationById: (id) => {
        return get().notifications.find((n) => n.id === id);
      },

      resendNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id
              ? { ...n, status: 'sent' as const, sentAt: new Date(), error: undefined, errorMessage: undefined }
              : n
          ),
        }));
      },

      getStats: () => {
        const notifications = get().notifications;

        const stats = {
          totalSent: notifications.filter((n) => n.status === 'sent').length,
          totalFailed: notifications.filter((n) => n.status === 'failed').length,
          totalPending: notifications.filter((n) => n.status === 'pending').length,
          byType: {
            invoice_sent: 0,
            payment_reminder: 0,
            payment_overdue: 0,
            payment_received: 0,
            receipt_sent: 0,
          } as Record<NotificationType, number>,
        };

        notifications.forEach((n) => {
          stats.byType[n.type]++;
        });

        return stats;
      },

      initializeNotifications: () => {
        const existingNotifications = get().notifications;
        if (existingNotifications.length === 0) {
          set({ notifications: generateDemoNotifications() });
        }
      },
    }),
    {
      name: 'notification-history-storage',
      partialize: (state) => ({
        notifications: state.notifications,
      }),
    }
  )
);
