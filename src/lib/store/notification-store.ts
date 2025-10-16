import { create } from 'zustand';
import type { Notification } from '@/types';
import { getBroadcast } from '@/lib/realtime/broadcast';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  importantCount: number;
  isOpen: boolean;
  activeTab: 'all' | 'unread' | 'important';
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  toggleImportant: (id: string) => void;
  setOpen: (open: boolean) => void;
  setActiveTab: (tab: 'all' | 'unread' | 'important') => void;
  
  // Computed
  getFilteredNotifications: () => Notification[];
  refreshCounts: () => void;
}

// Broadcast Channelのインスタンス
const broadcast = typeof window !== 'undefined' ? getBroadcast() : null;

export const useNotificationStore = create<NotificationState>((set, get) => {
  // Broadcast Channelのリスナーを設定（ブラウザ環境でのみ）
  if (broadcast) {
    // 新しい通知を受信
    broadcast.on<Notification>('notification:new', (notification) => {
      set((state) => ({
        notifications: [notification, ...state.notifications],
      }));
      get().refreshCounts();
    });

    // 既読通知を受信
    broadcast.on<string>('notification:read', (id) => {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      }));
      get().refreshCounts();
    });

    // 全既読通知を受信
    broadcast.on('notification:read-all', () => {
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }));
      get().refreshCounts();
    });
  }

  return {
    notifications: [],
    unreadCount: 0,
    importantCount: 0,
    isOpen: false,
    activeTab: 'all',

    setNotifications: (notifications) => {
      set({ notifications });
      get().refreshCounts();
    },

    addNotification: (notification) => {
      set((state) => ({
        notifications: [notification, ...state.notifications],
      }));
      get().refreshCounts();

      // 他のタブに通知
      broadcast?.send('notification:new', notification);
    },

    markAsRead: (id) => {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      }));
      get().refreshCounts();

      // 他のタブに通知
      broadcast?.send('notification:read', id);
    },

    markAllAsRead: () => {
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }));
      get().refreshCounts();

      // 他のタブに通知
      broadcast?.send('notification:read-all', null);
    },

    removeNotification: (id) => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
      get().refreshCounts();
    },

    toggleImportant: (id) => {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, important: !n.important } : n
        ),
      }));
      get().refreshCounts();
    },

    setOpen: (open) => {
      set({ isOpen: open });
    },

    setActiveTab: (tab) => {
      set({ activeTab: tab });
    },

    getFilteredNotifications: () => {
      const { notifications, activeTab } = get();

      switch (activeTab) {
        case 'unread':
          return notifications.filter((n) => !n.read);
        case 'important':
          return notifications.filter((n) => n.important);
        default:
          return notifications;
      }
    },

    refreshCounts: () => {
      const { notifications } = get();
      const unreadCount = notifications.filter((n) => !n.read).length;
      const importantCount = notifications.filter((n) => n.important).length;

      set({ unreadCount, importantCount });
    },
  };
});