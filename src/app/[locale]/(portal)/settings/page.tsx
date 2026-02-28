'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  DollarSign,
  FileText,
  GitBranch,
  ShieldCheck,
  Clock,
  Palette,
  Globe,
  Database,
  ChevronRight,
  CreditCard,
  FileUp,
  Megaphone,
} from 'lucide-react';
import { useUserStore, useTenantStore } from '@/lib/store';
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
  WorkflowTab,
  BillingTab,
  AppearanceTab,
  RegionalTab,
} from '@/features/settings/tabs';
import { MasterDataPanel } from '@/components/settings/master-data-panel';
import { AttendanceMasterPanel } from '@/features/attendance/attendance-master-panel';
import { DataManagementPanel } from '@/features/data-management/data-management-panel';
import { AnnouncementTypeMasterPanel } from '@/features/announcements/announcement-type-master-panel';
import { DailyReportTemplateMasterPanel } from '@/features/daily-report/daily-report-template-panel';
import { DashboardSettingsPanel } from '@/features/dashboard/dashboard-settings-panel';
import { PermissionManagementPanel } from '@/components/organization/permission-management-panel';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Lock } from 'lucide-react';

type SettingCategory = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  requiresRole?: UserRole[];
};

const settingCategories: SettingCategory[] = [
  {
    id: 'appearance',
    title: '外観',
    description: 'テーマ、通知の設定',
    icon: Palette,
  },
  {
    id: 'dashboard',
    title: 'ダッシュボード',
    description: 'クイックアクションの表示設定',
    icon: LayoutDashboard,
    badge: '管理者',
    requiresRole: ['admin'],
  },
  {
    id: 'regional',
    title: '地域',
    description: '言語、タイムゾーン、日付形式',
    icon: Globe,
  },
  {
    id: 'company',
    title: '会社情報',
    description: '会社名、住所、連絡先',
    icon: Building2,
  },
  {
    id: 'payroll',
    title: '給与',
    description: '給与計算、締め日、支払日',
    icon: DollarSign,
  },
  {
    id: 'year-end',
    title: '年末調整',
    description: '年末調整の設定',
    icon: FileText,
  },
  {
    id: 'attendance',
    title: '勤怠マスタ',
    description: '就業ルール、休暇・休日、打刻丸め、アラート・36協定',
    icon: Clock,
    badge: '人事',
    requiresRole: ['hr', 'admin'],
  },
  {
    id: 'daily-report',
    title: '日報マスタ',
    description: '日報テンプレート、提出ルール、フィールド定義',
    icon: FileText,
    badge: '人事',
    requiresRole: ['hr', 'admin'],
  },
  {
    id: 'workflow',
    title: 'ワークフロー',
    description: '承認フロー、エスカレーション',
    icon: GitBranch,
  },
  {
    id: 'master-data',
    title: 'マスタ管理',
    description: '部署、役職、雇用形態',
    icon: Database,
    badge: '管理者',
    requiresRole: ['admin'],
  },
  {
    id: 'data-import',
    title: 'データ管理',
    description: 'CSV取込・出力',
    icon: FileUp,
    badge: '人事',
    requiresRole: ['hr', 'admin'],
  },
  {
    id: 'announcement-types',
    title: 'アナウンス設定',
    description: 'アナウンス種別マスタ',
    icon: Megaphone,
    badge: '人事',
    requiresRole: ['hr', 'admin'],
  },
  {
    id: 'billing',
    title: '請求・契約',
    description: '請求情報、契約プラン',
    icon: CreditCard,
    badge: '管理者',
    requiresRole: ['admin', 'hr'],
  },
  {
    id: 'system',
    title: 'システム',
    description: 'データ管理、監査ログ',
    icon: ShieldCheck,
    badge: '管理者',
    requiresRole: ['admin'],
  },
  {
    id: 'permissions',
    title: '権限管理',
    description: 'ロール・メニュー権限設定',
    icon: Lock,
    badge: '管理者',
    requiresRole: ['admin'],
  },
];

export default function SettingsPage() {
  const mounted = useIsMounted();
  const { currentUser } = useUserStore();
  const { currentTenant } = useTenantStore();
  // 会社設定（将来的に設定画面で使用予定）
  // const {
  //   companyInfo,
  //   payrollSettings,
  //   yearEndAdjustmentSettings,
  //   updateCompanyInfo,
  //   updatePayrollSettings,
  //   updateYearEndAdjustmentSettings
  // } = useCompanySettingsStore();
  useCompanySettingsStore(); // ストア初期化のため
  const [settings, setSettings] = useState<SimpleSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [openSheet, setOpenSheet] = useState<string | null>(null);

  // Get user role
  const getUserRole = (): UserRole | null => {
    if (currentUser?.roles && currentUser.roles.length > 0) {
      return currentUser.roles[0] as UserRole;
    }
    return null;
  };

  const userRole = getUserRole();

  // Load settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dandori_simple_settings');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSettings({ ...defaultSettings, ...parsed });
          // テーマはnext-themesが自動的に適用するため、ここでは何もしない
        } catch {
          // Ignore error
        }
      }
    }
  }, []);

  // Update settings（テーマはnext-themesが管理するため、ここでは適用しない）
  const updateSettings = (updates: Partial<SimpleSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  // Save settings
  const saveSettings = () => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('dandori_simple_settings', JSON.stringify(settings));
      setHasChanges(false);
      toast.success('設定を保存しました');
    } catch {
      toast.error('設定の保存に失敗しました');
    }
  };

  // Filter categories based on user role
  const visibleCategories = useMemo(() => {
    return settingCategories.filter(category => {
      if (!category.requiresRole) return true;
      if (!userRole) return false;
      return category.requiresRole.includes(userRole);
    });
  }, [userRole]);

  // Render setting content based on category
  const renderSettingContent = (categoryId: string) => {
    switch (categoryId) {
      case 'appearance':
        return <AppearanceTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />;
      case 'dashboard':
        return <DashboardSettingsPanel />;
      case 'regional':
        return <RegionalTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />;
      case 'company':
        return <CompanyTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />;
      case 'payroll':
        return <PayrollTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />;
      case 'year-end':
        return <YearEndTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />;
      case 'attendance':
        return <AttendanceMasterPanel settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />;
      case 'workflow':
        return <WorkflowTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />;
      case 'master-data':
        return <MasterDataPanel />;
      case 'data-import':
        return <DataManagementPanel />;
      case 'announcement-types':
        return <AnnouncementTypeMasterPanel />;
      case 'daily-report':
        return <DailyReportTemplateMasterPanel />;
      case 'billing':
        return <BillingTab />;
      case 'system':
        return <SystemTab settings={settings} updateSettings={updateSettings} saveSettings={saveSettings} />;
      case 'permissions':
        return currentTenant?.id ? <PermissionManagementPanel tenantId={currentTenant.id} /> : null;
      default:
        return null;
    }
  };

  // Get category info by id
  const getCategoryById = (id: string) => {
    return settingCategories.find(c => c.id === id);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">設定</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          アプリケーションの設定を管理します
        </p>
      </div>

      {hasChanges && (
        <Alert>
          <AlertDescription className="text-sm">
            設定が変更されています。各設定画面の「保存」ボタンで保存してください。
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card
              key={category.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                "group relative"
              )}
              onClick={() => setOpenSheet(category.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        {category.title}
                        {category.badge && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {category.badge}
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  {category.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Settings Sheet */}
      <Sheet open={!!openSheet} onOpenChange={(open) => !open && setOpenSheet(null)}>
        <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto">
          {openSheet && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-3">
                  {(() => {
                    const category = getCategoryById(openSheet);
                    if (category) {
                      const Icon = category.icon;
                      return (
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div>
                    <SheetTitle className="text-xl">
                      {getCategoryById(openSheet)?.title}
                    </SheetTitle>
                    <SheetDescription>
                      {getCategoryById(openSheet)?.description}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="pr-2">
                {renderSettingContent(openSheet)}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
