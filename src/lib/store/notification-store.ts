import { create } from 'zustand';
import type { Notification } from '@/types';

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

export const useNotificationStore = create<NotificationState>((set, get) => ({
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
  },
  
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
    get().refreshCounts();
  },
  
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
    get().refreshCounts();
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
}));