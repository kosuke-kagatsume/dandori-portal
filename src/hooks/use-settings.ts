'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserSettings,
  defaultSettings,
  loadSettings,
  saveSettings,
  applyAllSettings,
  exportSettings,
  importSettings,
  resetSettings,
  requestNotificationPermission,
} from '@/lib/settings';
import { toast } from 'sonner';

export function useSettings() {
  const [settings, setSettingsState] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 初回ロード時に設定を読み込む
  useEffect(() => {
    const loaded = loadSettings();
    setSettingsState(loaded);
    // 初回ロード時は設定を適用しない（デフォルトのライトモードを維持）
    // ユーザーが設定ページで明示的に変更した場合のみ適用される
    setIsLoading(false);
  }, []);

  // 設定を更新する関数
  const updateSettings = useCallback(async (
    updates: Partial<UserSettings> | ((prev: UserSettings) => UserSettings)
  ) => {
    setIsSaving(true);
    
    try {
      const newSettings = typeof updates === 'function' 
        ? updates(settings)
        : { ...settings, ...updates };
      
      // 設定を保存
      saveSettings(newSettings);
      
      // 設定を適用
      applyAllSettings(newSettings);
      
      // 状態を更新
      setSettingsState(newSettings);
      
      // デスクトップ通知の権限をリクエスト（必要な場合）
      if (newSettings.notifications.desktop && !settings.notifications.desktop) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          toast.warning('デスクトップ通知の権限が拒否されました');
        }
      }
      
      toast.success('設定を保存しました');
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  // 特定のセクションを更新する関数
  const updateGeneralSettings = useCallback((updates: Partial<UserSettings['general']>) => {
    updateSettings(prev => ({
      ...prev,
      general: { ...prev.general, ...updates }
    }));
  }, [updateSettings]);

  const updateAppearanceSettings = useCallback((updates: Partial<UserSettings['appearance']>) => {
    updateSettings(prev => ({
      ...prev,
      appearance: { ...prev.appearance, ...updates }
    }));
  }, [updateSettings]);

  const updateNotificationSettings = useCallback((updates: Partial<UserSettings['notifications']>) => {
    updateSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, ...updates }
    }));
  }, [updateSettings]);

  const updateSecuritySettings = useCallback((updates: Partial<UserSettings['security']>) => {
    updateSettings(prev => ({
      ...prev,
      security: { ...prev.security, ...updates }
    }));
  }, [updateSettings]);

  const updateDataSettings = useCallback((updates: Partial<UserSettings['data']>) => {
    updateSettings(prev => ({
      ...prev,
      data: { ...prev.data, ...updates }
    }));
  }, [updateSettings]);

  // エクスポート
  const handleExportSettings = useCallback(() => {
    try {
      exportSettings(settings);
      toast.success('設定をエクスポートしました');
    } catch (error) {
      console.error('Failed to export settings:', error);
      toast.error('エクスポートに失敗しました');
    }
  }, [settings]);

  // インポート
  const handleImportSettings = useCallback(async (file: File) => {
    try {
      const imported = await importSettings(file);
      setSettingsState(imported);
      applyAllSettings(imported);
      toast.success('設定をインポートしました');
    } catch (error) {
      console.error('Failed to import settings:', error);
      toast.error('インポートに失敗しました。ファイル形式を確認してください。');
    }
  }, []);

  // リセット
  const handleResetSettings = useCallback(() => {
    resetSettings();
    setSettingsState(defaultSettings);
    applyAllSettings(defaultSettings);
    toast.info('設定をリセットしました');
  }, []);

  return {
    settings,
    isLoading,
    isSaving,
    updateSettings,
    updateGeneralSettings,
    updateAppearanceSettings,
    updateNotificationSettings,
    updateSecuritySettings,
    updateDataSettings,
    exportSettings: handleExportSettings,
    importSettings: handleImportSettings,
    resetSettings: handleResetSettings,
  };
}