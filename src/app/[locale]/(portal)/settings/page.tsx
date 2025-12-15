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
  Clock,
  Mail,
} from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { useCompanySettingsStore } from '@/lib/store/company-settings-store';
import type { UserRole } from '@/types';
import { toast } from 'sonner';
import { useIsMounted } from '@/hooks/useIsMounted';
import { SimpleSettings, defaultSettings } from '@/features/settings/types';
import {
  SystemTab,
  CompanyTab,
  PayrollTab,
  YearEndTab,
  AttendanceTab,
  WorkflowTab,
  BillingTab,
} from '@/features/settings/tabs';
import { TenantManagementTab } from '@/features/dw-admin/tenant-management-tab';
import { PaymentManagementTab } from '@/features/dw-admin/payment-management-tab';
import { NotificationManagementTab } from '@/features/dw-admin/notification-management-tab';
import { MasterDataPanel } from '@/components/settings/master-data-panel';

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

  // ユーザーロールを取得（本番ユーザーまたはデモユーザー）
  const getUserRole = (): UserRole | null => {
    // 本番ユーザーがいる場合はそのロールを使用
    if (currentUser?.roles && currentUser.roles.length > 0) {
      return currentUser.roles[0] as UserRole;
    }
    // デモユーザーの場合（フォールバック）
    if (currentDemoUser) {
      return currentDemoUser.role as UserRole;
    }
    return null;
  };

  const userRole = getUserRole();

  // ページロード時にlocalStorageから役職を読み込む（デモモードのみ）
  useEffect(() => {
    if (typeof window !== 'undefined' && !currentUser) {
      const storedRole = localStorage.getItem('demo-role') as any;
      if (storedRole && !currentDemoUser) {
        switchDemoRole(storedRole);
      }
    }
  }, [currentDemoUser, switchDemoRole, currentUser]);

  // 権限チェック（本番ユーザーとデモユーザー両方に対応）
  const canManageSystem = useMemo(() => {
    return userRole === 'admin';
  }, [userRole]);

  // 請求情報の閲覧権限（システム管理者と人事担当）
  const canViewBilling = useMemo(() => {
    if (!userRole) return false;
    return userRole === 'admin' || userRole === 'hr';
  }, [userRole]);

  // DW社管理者権限（全テナント管理）
  const isSuperAdmin = useMemo(() => {
    if (!userRole) return false;
    // 本番ユーザーの場合: adminロールを持っているかチェック
    // デモユーザーの場合: 従来のロジック
    if (currentUser) {
      return userRole === 'admin';
    }
    return currentDemoUser?.role === 'admin' && currentDemoUser?.id === 'demo-admin';
  }, [userRole, currentUser, currentDemoUser]);

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

      <Tabs defaultValue="company" className="space-y-4 w-full">
        <div className="relative w-full">
          <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            <TabsList className="inline-flex h-auto w-max gap-1 p-1">
            <TabsTrigger value="company" className="shrink-0 px-3 py-2">
              <Building2 className="w-4 h-4 mr-1.5" />
              <span>会社</span>
            </TabsTrigger>
            <TabsTrigger value="payroll" className="shrink-0 px-3 py-2">
              <DollarSign className="w-4 h-4 mr-1.5" />
              <span>給与</span>
            </TabsTrigger>
            <TabsTrigger value="year-end" className="shrink-0 px-3 py-2">
              <FileText className="w-4 h-4 mr-1.5" />
              <span>年末調整</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="shrink-0 px-3 py-2">
              <Clock className="w-4 h-4 mr-1.5" />
              <span>勤怠</span>
            </TabsTrigger>
            <TabsTrigger value="workflow" className="shrink-0 px-3 py-2">
              <GitBranch className="w-4 h-4 mr-1.5" />
              <span>ワークフロー</span>
            </TabsTrigger>
            {canManageSystem && (
              <TabsTrigger value="master-data" className="shrink-0 px-3 py-2">
                <Building2 className="w-4 h-4 mr-1.5" />
                <span>マスタ</span>
              </TabsTrigger>
            )}
            {canViewBilling && (
              <TabsTrigger value="billing" className="shrink-0 px-3 py-2">
                <DollarSign className="w-4 h-4 mr-1.5" />
                <span>請求</span>
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="tenant-management" className="shrink-0 px-3 py-2">
                <Building2 className="w-4 h-4 mr-1.5" />
                <span>テナント</span>
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="payment-management" className="shrink-0 px-3 py-2">
                <DollarSign className="w-4 h-4 mr-1.5" />
                <span>支払い</span>
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="notification-management" className="shrink-0 px-3 py-2">
                <Mail className="w-4 h-4 mr-1.5" />
                <span>通知履歴</span>
              </TabsTrigger>
            )}
            {canManageSystem && (
              <TabsTrigger value="system" className="shrink-0 px-3 py-2">
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                <span>システム</span>
              </TabsTrigger>
            )}
          </TabsList>
          </div>
          {/* スクロールインジケーター（右端のフェード） */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent" />
        </div>

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

        {canManageSystem && (
          <TabsContent value="master-data">
            <MasterDataPanel />
          </TabsContent>
        )}

        {canViewBilling && (
          <TabsContent value="billing">
            <BillingTab />
          </TabsContent>
        )}

        {isSuperAdmin && (
          <TabsContent value="tenant-management">
            <TenantManagementTab />
          </TabsContent>
        )}

        {isSuperAdmin && (
          <TabsContent value="payment-management">
            <PaymentManagementTab />
          </TabsContent>
        )}

        {isSuperAdmin && (
          <TabsContent value="notification-management">
            <NotificationManagementTab />
          </TabsContent>
        )}

        {canManageSystem && (
          <TabsContent value="system">
            <SystemTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
