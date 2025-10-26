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
  ApprovalFlowTab,
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
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">設定</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            アプリケーションの設定を管理します
          </p>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <AlertDescription className="text-sm">
            設定が変更されています。保存するには各タブの「保存」ボタンをクリックしてください。
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="appearance" className="space-y-4 w-full">
        <TabsList className="flex flex-wrap sm:grid sm:w-full sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-1">
          <TabsTrigger value="appearance" className="flex-1 sm:flex-none min-w-[100px]">
            <Sun className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">外観</span>
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex-1 sm:flex-none min-w-[100px]">
            <Languages className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">地域</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="flex-1 sm:flex-none min-w-[100px]">
            <Building2 className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">会社</span>
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex-1 sm:flex-none min-w-[100px]">
            <DollarSign className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">給与</span>
          </TabsTrigger>
          <TabsTrigger value="year-end" className="flex-1 sm:flex-none min-w-[100px]">
            <FileText className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">年末調整</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex-1 sm:flex-none min-w-[100px]">
            <Clock className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">勤怠</span>
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex-1 sm:flex-none min-w-[100px]">
            <GitBranch className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">ワークフロー</span>
          </TabsTrigger>
          <TabsTrigger value="approval-flow" className="flex-1 sm:flex-none min-w-[100px]">
            <GitBranch className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">承認フロー</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex-1 sm:flex-none min-w-[100px]">データ</TabsTrigger>
          {canManageSystem && (
            <TabsTrigger value="system" className="flex-1 sm:flex-none min-w-[100px]">
              <ShieldCheck className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">システム</span>
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

        <TabsContent value="approval-flow">
          <ApprovalFlowTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />
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
