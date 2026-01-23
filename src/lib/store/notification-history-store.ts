/**
 * DW管理通知ストア
 *
 * DW管理者向けの通知（支払い、テナント状態変更等）を管理
 * 実APIに接続してデータを取得・操作
 */

import { create } from 'zustand';

export type NotificationType =
  | 'payment_received'    // 入金確認
  | 'payment_overdue'     // 支払期限超過
  | 'tenant_created'      // テナント作成
  | 'tenant_suspended'    // テナント停止
  | 'system_alert'        // システムアラート
  | 'invoice_sent'        // 請求書発行（後方互換性）
  | 'payment_reminder'    // 支払期限リマインダー（後方互換性）
  | 'receipt_sent';       // 領収書発行（後方互換性）

export type NotificationStatus =
  | 'sent'      // 送信済み
  | 'failed'    // 送信失敗
  | 'pending';  // 送信待ち

export type NotificationPriority = 'high' | 'normal' | 'low';

export interface DWNotification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string | null;
  priority: NotificationPriority;
  tenantId?: string | null;
  tenantName?: string | null;
  invoiceId?: string | null;
  amount?: number | null;
  isRead: boolean;
  readAt?: string | null;
  readBy?: string | null;
  createdAt: string;
  // 拡張プロパティ（UI互換性のため）
  status?: NotificationStatus;
  metadata?: Record<string, unknown>;
  recipientEmail?: string | null;
  sentAt?: string | null;
  invoiceNumber?: string | null;
  subject?: string | null;
  body?: string | null;
  error?: string | null;
}

interface NotificationSummary {
  total: number;
  unread: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface NotificationHistoryStore {
  // データ
  notifications: DWNotification[];
  summary: NotificationSummary;
  pagination: PaginationInfo;

  // 状態
  isLoading: boolean;
  error: string | null;

  // フィルター
  typeFilter: NotificationType | null;
  readFilter: boolean | null;

  // API操作
  fetchNotifications: (options?: {
    type?: NotificationType;
    read?: boolean;
    priority?: NotificationPriority;
    page?: number;
    limit?: number;
  }) => Promise<void>;

  createNotification: (data: {
    type: NotificationType;
    title: string;
    description?: string;
    priority?: NotificationPriority;
    tenantId?: string;
    tenantName?: string;
    invoiceId?: string;
    amount?: number;
  }) => Promise<DWNotification | null>;

  markAsRead: (ids: string[]) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;

  // ローカル状態操作
  setTypeFilter: (type: NotificationType | null) => void;
  setReadFilter: (read: boolean | null) => void;

  // クエリ（ローカルキャッシュから）
  getNotificationById: (id: string) => DWNotification | undefined;
  getNotificationsByType: (type: NotificationType) => DWNotification[];
  getAllNotifications: () => DWNotification[];

  // 統計
  getStats: () => {
    totalSent: number;
    totalFailed: number;
    totalPending: number;
    byType: Record<NotificationType, number>;
  };

  // 初期化
  initializeNotifications: () => Promise<void>;

  // 後方互換性のためのエイリアス
  addNotification: (notification: Omit<DWNotification, 'id' | 'createdAt' | 'isRead'>) => Promise<DWNotification | null>;
  getNotificationsByTenant: (tenantId: string) => DWNotification[];
  getNotificationsByInvoice: (invoiceId: string) => DWNotification[];
  resendNotification: (id: string) => Promise<void>;
}

// 通知タイプのラベル
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  payment_received: '入金確認',
  payment_overdue: '支払期限超過',
  tenant_created: 'テナント作成',
  tenant_suspended: 'テナント停止',
  system_alert: 'システムアラート',
  invoice_sent: '請求書発行',
  payment_reminder: '支払期限リマインダー',
  receipt_sent: '領収書発行',
};

const initialState = {
  notifications: [],
  summary: { total: 0, unread: 0 },
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  isLoading: false,
  error: null,
  typeFilter: null,
  readFilter: null,
};

export const useNotificationHistoryStore = create<NotificationHistoryStore>((set, get) => ({
  ...initialState,

  fetchNotifications: async (options = {}) => {
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      if (options.type) params.set('type', options.type);
      if (options.read !== undefined) params.set('read', String(options.read));
      if (options.priority) params.set('priority', options.priority);
      if (options.page) params.set('page', String(options.page));
      if (options.limit) params.set('limit', String(options.limit));

      const response = await fetch(`/api/dw-admin/notifications?${params.toString()}`);
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || '通知の取得に失敗しました');
      }

      set({
        notifications: json.data.notifications,
        summary: json.data.summary,
        pagination: json.data.pagination,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '不明なエラー',
      });
    }
  },

  createNotification: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/dw-admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || '通知の作成に失敗しました');
      }

      // 一覧を再取得
      await get().fetchNotifications();

      set({ isLoading: false });
      return json.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '不明なエラー',
      });
      return null;
    }
  },

  markAsRead: async (ids) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/dw-admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || '通知の更新に失敗しました');
      }

      // ローカルキャッシュを更新
      set((state) => ({
        notifications: state.notifications.map((n) =>
          ids.includes(n.id) ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ),
        summary: {
          ...state.summary,
          unread: Math.max(0, state.summary.unread - ids.length),
        },
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '不明なエラー',
      });
      return false;
    }
  },

  markAllAsRead: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/dw-admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || '通知の更新に失敗しました');
      }

      // ローカルキャッシュを更新
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt || new Date().toISOString(),
        })),
        summary: { ...state.summary, unread: 0 },
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '不明なエラー',
      });
      return false;
    }
  },

  setTypeFilter: (type) => {
    set({ typeFilter: type });
    get().fetchNotifications({ type: type || undefined });
  },

  setReadFilter: (read) => {
    set({ readFilter: read });
    get().fetchNotifications({ read: read ?? undefined });
  },

  getNotificationById: (id) => {
    return get().notifications.find((n) => n.id === id);
  },

  getNotificationsByType: (type) => {
    return get().notifications.filter((n) => n.type === type);
  },

  getAllNotifications: () => {
    return get().notifications;
  },

  getStats: () => {
    const notifications = get().notifications;

    const stats = {
      totalSent: notifications.length,
      totalFailed: 0,
      totalPending: 0,
      byType: {
        payment_received: 0,
        payment_overdue: 0,
        tenant_created: 0,
        tenant_suspended: 0,
        system_alert: 0,
        invoice_sent: 0,
        payment_reminder: 0,
        receipt_sent: 0,
      } as Record<NotificationType, number>,
    };

    notifications.forEach((n) => {
      if (n.type in stats.byType) {
        stats.byType[n.type]++;
      }
    });

    return stats;
  },

  initializeNotifications: async () => {
    // 初回のみフェッチ
    if (get().notifications.length === 0) {
      await get().fetchNotifications();
    }
  },

  // 後方互換性のためのエイリアス
  addNotification: async (notification) => {
    return get().createNotification({
      type: notification.type,
      title: notification.title,
      description: notification.description || undefined,
      priority: notification.priority,
      tenantId: notification.tenantId || undefined,
      tenantName: notification.tenantName || undefined,
      invoiceId: notification.invoiceId || undefined,
      amount: notification.amount || undefined,
    });
  },

  getNotificationsByTenant: (tenantId) => {
    return get().notifications.filter((n) => n.tenantId === tenantId);
  },

  getNotificationsByInvoice: (invoiceId) => {
    return get().notifications.filter((n) => n.invoiceId === invoiceId);
  },

  resendNotification: async () => {
    // 通知の再送信は現時点では実装しない
    console.warn('resendNotification is not implemented for API-based notifications');
  },
}));
