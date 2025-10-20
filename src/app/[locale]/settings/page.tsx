'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  DollarSign,
  FileText,
  GitBranch,
  ShieldCheck,
  Sun,
  Moon,
  Languages,
  Clock,
} from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { useCompanySettingsStore } from '@/lib/store/company-settings-store';
import { hasPermission } from '@/lib/demo-users';
import { toast } from 'sonner';
import { useIsMounted } from '@/hooks/useIsMounted';
import { SimpleSettings, defaultSettings } from '@/features/settings/types';
import {
  AppearanceTab,
  RegionalTab,
  DataTab,
  SystemTab,
  CompanyTab,
  PayrollTab,
  YearEndTab,
  AttendanceTab,
  WorkflowTab,
} from '@/features/settings/tabs';

export default function SettingsPage() {
  const mounted = useIsMounted();
  const router = useRouter();
  const { currentUser, currentDemoUser, switchDemoRole } = useUserStore();
  const {
    companyInfo,
    payrollSettings,
    yearEndAdjustmentSettings,
    updateCompanyInfo,
    updatePayrollSettings,
    updateYearEndAdjustmentSettings
  } = useCompanySettingsStore();
  const [settings, setSettings] = useState<SimpleSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // ページロード時にlocalStorageから役職を読み込む
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('demo-role') as any;
      if (storedRole && !currentDemoUser) {
        switchDemoRole(storedRole);
      }
    }
  }, [currentDemoUser, switchDemoRole]);

  // 権限チェック
  const canManageSystem = useMemo(() => {
    return hasPermission(currentDemoUser, 'manage_system');
  }, [currentDemoUser]);

  // 設定の読み込み
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dandori_simple_settings');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSettings({ ...defaultSettings, ...parsed });
          applyTheme(parsed.theme || 'light');
        } catch (e) {
          // Ignore error
        }
      }
    }
  }, []);

  // テーマ適用
  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  // 設定更新
  const updateSettings = (updates: Partial<SimpleSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);

    if (updates.theme) {
      applyTheme(updates.theme);
    }
  };

  // 設定保存
  const saveSettings = () => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('dandori_simple_settings', JSON.stringify(settings));
      setHasChanges(false);
      toast.success('設定を保存しました');
    } catch (error) {
      toast.error('設定の保存に失敗しました');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">設定</h1>
          <p className="text-muted-foreground mt-1">
            アプリケーションの設定を管理します
          </p>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <AlertDescription>
            設定が変更されています。保存するには各タブの「保存」ボタンをクリックしてください。
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="appearance" className="space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="appearance">
            <Sun className="w-4 h-4 mr-1" />
            外観
          </TabsTrigger>
          <TabsTrigger value="regional">
            <Languages className="w-4 h-4 mr-1" />
            地域
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building2 className="w-4 h-4 mr-1" />
            会社
          </TabsTrigger>
          <TabsTrigger value="payroll">
            <DollarSign className="w-4 h-4 mr-1" />
            給与
          </TabsTrigger>
          <TabsTrigger value="year-end">
            <FileText className="w-4 h-4 mr-1" />
            年末調整
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <Clock className="w-4 h-4 mr-1" />
            勤怠
          </TabsTrigger>
          <TabsTrigger value="workflow">
            <GitBranch className="w-4 h-4 mr-1" />
            ワークフロー
          </TabsTrigger>
          <TabsTrigger value="data">データ</TabsTrigger>
          {canManageSystem && (
            <TabsTrigger value="system">
              <ShieldCheck className="w-4 h-4 mr-1" />
              システム
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="appearance">
          <AppearanceTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />
        </TabsContent>

        <TabsContent value="regional">
          <RegionalTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />
        </TabsContent>

        <TabsContent value="company">
          <CompanyTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />
        </TabsContent>

        <TabsContent value="payroll">
          <PayrollTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />
        </TabsContent>

        <TabsContent value="year-end">
          <YearEndTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />
        </TabsContent>

        <TabsContent value="workflow">
          <WorkflowTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />
        </TabsContent>

        <TabsContent value="data">
          <DataTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />
        </TabsContent>

        {canManageSystem && (
          <TabsContent value="system">
            <SystemTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
