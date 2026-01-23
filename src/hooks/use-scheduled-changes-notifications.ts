'use client';

import { useEffect, useRef } from 'react';
import { useScheduledChangesStore, changeTypeLabels } from '@/lib/store/scheduled-changes-store';
import { useNotificationStore } from '@/lib/store/notification-store';

/**
 * 予約管理の通知チェックフック
 * 有効日が近づいている予約を定期的にチェックして通知を作成します
 */
export function useScheduledChangesNotifications() {
  const getUpcomingChanges = useScheduledChangesStore((state) => state.getUpcomingChanges);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // 初回チェック
    checkUpcomingChanges();

    // 1時間ごとにチェック
    const interval = setInterval(() => {
      checkUpcomingChanges();
    }, 60 * 60 * 1000); // 1時間 = 60分 × 60秒 × 1000ミリ秒

    return () => clearInterval(interval);
  }, []);

  const checkUpcomingChanges = () => {
    // 3日以内に有効日が来る予約をチェック
    const upcomingIn3Days = getUpcomingChanges(3);
    // 1日以内に有効日が来る予約をチェック
    const upcomingIn1Day = getUpcomingChanges(1);

    // 1日以内の予約（緊急）
    upcomingIn1Day.forEach((change) => {
      const notificationId = `scheduled-change-1day-${change.id}`;

      // 既に通知済みならスキップ
      if (notifiedIdsRef.current.has(notificationId)) return;

      const effectiveDate = new Date(change.effectiveDate);
      const today = new Date();
      const daysUntil = Math.ceil((effectiveDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let title = '';
      let message = '';

      if (daysUntil === 0) {
        title = `【本日】${changeTypeLabels[change.type]}予約の有効日です`;
        message = change.userName
          ? `${change.userName}さんの${changeTypeLabels[change.type]}予約が本日有効になります`
          : `${changeTypeLabels[change.type]}予約が本日有効になります`;
      } else {
        title = `【明日】${changeTypeLabels[change.type]}予約の有効日が近づいています`;
        message = change.userName
          ? `${change.userName}さんの${changeTypeLabels[change.type]}予約が明日有効になります`
          : `${changeTypeLabels[change.type]}予約が明日有効になります`;
      }

      addNotification({
        id: notificationId,
        title,
        message,
        type: 'warning',
        timestamp: new Date().toISOString(),
        read: false,
        important: true,
        actionUrl: '/scheduled-changes',
      });

      notifiedIdsRef.current.add(notificationId);
    });

    // 3日以内の予約（注意）
    upcomingIn3Days.forEach((change) => {
      // 1日以内の予約は既に処理済みなのでスキップ
      if (upcomingIn1Day.some(c => c.id === change.id)) return;

      const notificationId = `scheduled-change-3days-${change.id}`;

      // 既に通知済みならスキップ
      if (notifiedIdsRef.current.has(notificationId)) return;

      const effectiveDate = new Date(change.effectiveDate);
      const today = new Date();
      const daysUntil = Math.ceil((effectiveDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const title = `${changeTypeLabels[change.type]}予約の有効日が${daysUntil}日後です`;
      const message = change.userName
        ? `${change.userName}さんの${changeTypeLabels[change.type]}予約が${daysUntil}日後に有効になります`
        : `${changeTypeLabels[change.type]}予約が${daysUntil}日後に有効になります`;

      addNotification({
        id: notificationId,
        title,
        message,
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false,
        important: false,
        actionUrl: '/scheduled-changes',
      });

      notifiedIdsRef.current.add(notificationId);
    });
  };

  return {
    checkUpcomingChanges,
  };
}
