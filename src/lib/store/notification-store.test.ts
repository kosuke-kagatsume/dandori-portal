/**
 * Notification ストアのテスト
 */

import { useNotificationStore } from './notification-store';
import type { Notification } from '@/types';

describe('NotificationStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      importantCount: 0,
      isOpen: false,
      activeTab: 'all',
    });
  });

  describe('addNotification', () => {
    it('新しい通知を追加できる', () => {
      const { addNotification } = useNotificationStore.getState();

      const notification: Notification = {
        id: '1',
        title: 'テスト通知',
        message: 'これはテストです',
        type: 'info',
        read: false,
        important: false,
        timestamp: new Date().toISOString(),
      };

      addNotification(notification);

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('テスト通知');
    });

    it('新しい通知が配列の先頭に追加される', () => {
      const { addNotification } = useNotificationStore.getState();

      const notification1: Notification = {
        id: '1',
        title: '通知1',
        message: 'メッセージ1',
        type: 'info',
        read: false,
        important: false,
        timestamp: new Date().toISOString(),
      };

      const notification2: Notification = {
        id: '2',
        title: '通知2',
        message: 'メッセージ2',
        type: 'success',
        read: false,
        important: false,
        timestamp: new Date().toISOString(),
      };

      addNotification(notification1);
      addNotification(notification2);

      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].id).toBe('2'); // 最新が先頭
      expect(notifications[1].id).toBe('1');
    });

    it('通知追加時にカウントが更新される', () => {
      const { addNotification } = useNotificationStore.getState();

      const notification: Notification = {
        id: '1',
        title: '未読通知',
        message: 'メッセージ',
        type: 'info',
        read: false,
        important: true,
        timestamp: new Date().toISOString(),
      };

      addNotification(notification);

      const { unreadCount, importantCount } = useNotificationStore.getState();
      expect(unreadCount).toBe(1);
      expect(importantCount).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('指定した通知を既読にできる', () => {
      const { addNotification, markAsRead } = useNotificationStore.getState();

      const notification: Notification = {
        id: '1',
        title: 'テスト通知',
        message: 'メッセージ',
        type: 'info',
        read: false,
        important: false,
        timestamp: new Date().toISOString(),
      };

      addNotification(notification);
      markAsRead('1');

      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].read).toBe(true);
    });

    it('既読にするとunreadCountが減る', () => {
      const { addNotification, markAsRead } = useNotificationStore.getState();

      const notification1: Notification = {
        id: '1',
        title: '通知1',
        message: 'メッセージ1',
        type: 'info',
        read: false,
        important: false,
        timestamp: new Date().toISOString(),
      };

      const notification2: Notification = {
        id: '2',
        title: '通知2',
        message: 'メッセージ2',
        type: 'info',
        read: false,
        important: false,
        timestamp: new Date().toISOString(),
      };

      addNotification(notification1);
      addNotification(notification2);

      expect(useNotificationStore.getState().unreadCount).toBe(2);

      markAsRead('1');

      expect(useNotificationStore.getState().unreadCount).toBe(1);
    });
  });

  describe('markAllAsRead', () => {
    it('すべての通知を既読にできる', () => {
      const { addNotification, markAllAsRead } = useNotificationStore.getState();

      const notifications: Notification[] = [
        {
          id: '1',
          title: '通知1',
          message: 'メッセージ1',
          type: 'info',
          read: false,
          important: false,
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          title: '通知2',
          message: 'メッセージ2',
          type: 'info',
          read: false,
          important: false,
          timestamp: new Date().toISOString(),
        },
      ];

      notifications.forEach((n) => addNotification(n));

      expect(useNotificationStore.getState().unreadCount).toBe(2);

      markAllAsRead();

      const { notifications: updatedNotifications, unreadCount } =
        useNotificationStore.getState();

      expect(updatedNotifications.every((n) => n.read === true)).toBe(true);
      expect(unreadCount).toBe(0);
    });
  });

  describe('removeNotification', () => {
    it('指定した通知を削除できる', () => {
      const { addNotification, removeNotification } = useNotificationStore.getState();

      const notification: Notification = {
        id: '1',
        title: '削除対象',
        message: 'メッセージ',
        type: 'info',
        read: false,
        important: false,
        timestamp: new Date().toISOString(),
      };

      addNotification(notification);
      expect(useNotificationStore.getState().notifications).toHaveLength(1);

      removeNotification('1');

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it('削除時にカウントが更新される', () => {
      const { addNotification, removeNotification } = useNotificationStore.getState();

      const notification: Notification = {
        id: '1',
        title: '削除対象',
        message: 'メッセージ',
        type: 'info',
        read: false,
        important: true,
        timestamp: new Date().toISOString(),
      };

      addNotification(notification);

      expect(useNotificationStore.getState().unreadCount).toBe(1);
      expect(useNotificationStore.getState().importantCount).toBe(1);

      removeNotification('1');

      expect(useNotificationStore.getState().unreadCount).toBe(0);
      expect(useNotificationStore.getState().importantCount).toBe(0);
    });
  });

  describe('toggleImportant', () => {
    it('通知の重要度を切り替えられる', () => {
      const { addNotification, toggleImportant } = useNotificationStore.getState();

      const notification: Notification = {
        id: '1',
        title: 'テスト通知',
        message: 'メッセージ',
        type: 'info',
        read: false,
        important: false,
        timestamp: new Date().toISOString(),
      };

      addNotification(notification);

      expect(useNotificationStore.getState().notifications[0].important).toBe(false);

      toggleImportant('1');

      expect(useNotificationStore.getState().notifications[0].important).toBe(true);

      toggleImportant('1');

      expect(useNotificationStore.getState().notifications[0].important).toBe(false);
    });

    it('重要度切り替え時にカウントが更新される', () => {
      const { addNotification, toggleImportant } = useNotificationStore.getState();

      const notification: Notification = {
        id: '1',
        title: 'テスト通知',
        message: 'メッセージ',
        type: 'info',
        read: false,
        important: false,
        timestamp: new Date().toISOString(),
      };

      addNotification(notification);

      expect(useNotificationStore.getState().importantCount).toBe(0);

      toggleImportant('1');

      expect(useNotificationStore.getState().importantCount).toBe(1);

      toggleImportant('1');

      expect(useNotificationStore.getState().importantCount).toBe(0);
    });
  });

  describe('setOpen', () => {
    it('通知パネルの開閉状態を切り替えられる', () => {
      const { setOpen } = useNotificationStore.getState();

      expect(useNotificationStore.getState().isOpen).toBe(false);

      setOpen(true);

      expect(useNotificationStore.getState().isOpen).toBe(true);

      setOpen(false);

      expect(useNotificationStore.getState().isOpen).toBe(false);
    });
  });

  describe('setActiveTab', () => {
    it('アクティブタブを切り替えられる', () => {
      const { setActiveTab } = useNotificationStore.getState();

      expect(useNotificationStore.getState().activeTab).toBe('all');

      setActiveTab('unread');

      expect(useNotificationStore.getState().activeTab).toBe('unread');

      setActiveTab('important');

      expect(useNotificationStore.getState().activeTab).toBe('important');
    });
  });

  describe('getFilteredNotifications', () => {
    beforeEach(() => {
      const { addNotification } = useNotificationStore.getState();

      const notifications: Notification[] = [
        {
          id: '1',
          title: '未読・重要',
          message: 'メッセージ1',
          type: 'warning',
          read: false,
          important: true,
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          title: '既読・重要',
          message: 'メッセージ2',
          type: 'info',
          read: true,
          important: true,
          timestamp: new Date().toISOString(),
        },
        {
          id: '3',
          title: '未読・通常',
          message: 'メッセージ3',
          type: 'success',
          read: false,
          important: false,
          timestamp: new Date().toISOString(),
        },
        {
          id: '4',
          title: '既読・通常',
          message: 'メッセージ4',
          type: 'info',
          read: true,
          important: false,
          timestamp: new Date().toISOString(),
        },
      ];

      notifications.forEach((n) => addNotification(n));
    });

    it('allタブですべての通知を取得する', () => {
      const { setActiveTab, getFilteredNotifications } = useNotificationStore.getState();

      setActiveTab('all');

      const filtered = getFilteredNotifications();
      expect(filtered).toHaveLength(4);
    });

    it('unreadタブで未読通知のみ取得する', () => {
      const { setActiveTab, getFilteredNotifications } = useNotificationStore.getState();

      setActiveTab('unread');

      const filtered = getFilteredNotifications();
      expect(filtered).toHaveLength(2);
      expect(filtered.every((n) => n.read === false)).toBe(true);
    });

    it('importantタブで重要通知のみ取得する', () => {
      const { setActiveTab, getFilteredNotifications } = useNotificationStore.getState();

      setActiveTab('important');

      const filtered = getFilteredNotifications();
      expect(filtered).toHaveLength(2);
      expect(filtered.every((n) => n.important === true)).toBe(true);
    });
  });

  describe('refreshCounts', () => {
    it('カウントを正しく更新する', () => {
      const { addNotification, refreshCounts } = useNotificationStore.getState();

      const notifications: Notification[] = [
        {
          id: '1',
          title: '未読・重要',
          message: 'メッセージ1',
          type: 'warning',
          read: false,
          important: true,
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          title: '未読・通常',
          message: 'メッセージ2',
          type: 'info',
          read: false,
          important: false,
          timestamp: new Date().toISOString(),
        },
        {
          id: '3',
          title: '既読・重要',
          message: 'メッセージ3',
          type: 'success',
          read: true,
          important: true,
          timestamp: new Date().toISOString(),
        },
      ];

      notifications.forEach((n) => addNotification(n));

      // カウントを手動でリセット
      useNotificationStore.setState({
        unreadCount: 0,
        importantCount: 0,
      });

      // refreshCountsで再計算
      refreshCounts();

      const { unreadCount, importantCount } = useNotificationStore.getState();

      expect(unreadCount).toBe(2); // 未読2件
      expect(importantCount).toBe(2); // 重要2件
    });
  });
});
