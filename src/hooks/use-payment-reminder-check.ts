/**
 * 支払い期限リマインダー自動チェックフック
 *
 * 一定間隔でリマインダーをチェックし、必要に応じて通知を生成する
 */

import { useEffect, useRef } from 'react';
import { usePaymentReminderStore } from '@/lib/store/payment-reminder-store';

export function usePaymentReminderCheck() {
  const { settings, checkAndGenerateReminders } = usePaymentReminderStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!settings.enabled) {
      // リマインダーが無効の場合はタイマーをクリア
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // 初回実行
    checkAndGenerateReminders();

    // 1時間ごとにチェック（本番環境では適切な間隔に調整）
    // デモ用には5分ごとなどでも可
    const CHECK_INTERVAL = 60 * 60 * 1000; // 1時間

    timerRef.current = setInterval(() => {
      checkAndGenerateReminders();
    }, CHECK_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [settings.enabled, checkAndGenerateReminders]);
}
