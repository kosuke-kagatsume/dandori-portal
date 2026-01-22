'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserStore, useTenantStore } from '@/lib/store';

interface AccountSettings {
  id: string;
  userId: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  workflowNotifications: boolean;
  leaveNotifications: boolean;
  systemNotifications: boolean;
  announcementNotifications: boolean;
  twoFactorEnabled: boolean;
  passwordChangedAt?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  lastLoginDevice?: string;
}

export function useAccountSettings() {
  const { currentUser } = useUserStore();
  const { currentTenant } = useTenantStore();
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const tenantId = currentTenant?.id || 'tenant-1';
  const userId = currentUser?.id;

  // 設定取得
  const fetchSettings = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/account-settings?userId=${userId}&tenantId=${tenantId}`
      );
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
      } else {
        setError(data.error);
      }
    } catch {
      setError('設定の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [userId, tenantId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // プロフィール更新
  const updateProfile = useCallback(async (data: {
    displayName?: string;
    avatar?: string;
    bio?: string;
  }) => {
    if (!userId) return { success: false, error: 'User not found' };

    try {
      setSaving(true);
      const response = await fetch('/api/account-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tenantId,
          ...data,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
      }
      return result;
    } catch {
      return { success: false, error: 'プロフィールの更新に失敗しました' };
    } finally {
      setSaving(false);
    }
  }, [userId, tenantId]);

  // 外観設定更新
  const updateAppearance = useCallback(async (data: {
    theme?: string;
    language?: string;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
  }) => {
    if (!userId) return { success: false, error: 'User not found' };

    try {
      setSaving(true);
      const response = await fetch('/api/account-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tenantId,
          action: 'update_appearance',
          ...data,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
      }
      return result;
    } catch {
      return { success: false, error: '外観設定の更新に失敗しました' };
    } finally {
      setSaving(false);
    }
  }, [userId, tenantId]);

  // 通知設定更新
  const updateNotifications = useCallback(async (data: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    workflowNotifications?: boolean;
    leaveNotifications?: boolean;
    systemNotifications?: boolean;
    announcementNotifications?: boolean;
  }) => {
    if (!userId) return { success: false, error: 'User not found' };

    try {
      setSaving(true);
      const response = await fetch('/api/account-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tenantId,
          action: 'update_notifications',
          ...data,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
      }
      return result;
    } catch {
      return { success: false, error: '通知設定の更新に失敗しました' };
    } finally {
      setSaving(false);
    }
  }, [userId, tenantId]);

  // パスワード変更
  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!userId) return { success: false, error: 'User not found' };

    try {
      setSaving(true);
      // TODO: AWS Cognitoでパスワード変更
      // 現在はAPIでpasswordChangedAtのみ更新
      const response = await fetch('/api/account-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tenantId,
          action: 'change_password',
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
      }
      return result;
    } catch {
      return { success: false, error: 'パスワードの変更に失敗しました' };
    } finally {
      setSaving(false);
    }
  }, [userId, tenantId]);

  // 2FA切り替え
  const toggle2FA = useCallback(async () => {
    if (!userId) return { success: false, error: 'User not found' };

    try {
      setSaving(true);
      const response = await fetch('/api/account-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tenantId,
          action: 'toggle_2fa',
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
      }
      return result;
    } catch {
      return { success: false, error: '2FA設定の更新に失敗しました' };
    } finally {
      setSaving(false);
    }
  }, [userId, tenantId]);

  return {
    settings,
    loading,
    error,
    saving,
    refetch: fetchSettings,
    updateProfile,
    updateAppearance,
    updateNotifications,
    changePassword,
    toggle2FA,
  };
}
