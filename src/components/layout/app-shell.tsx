'use client';

import { useEffect } from 'react';
import { useUIStore, useUserStore, useTenantStore } from '@/lib/store';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useLegalUpdatesStore } from '@/lib/store/legal-updates-store';
import { useAnnouncementsStore } from '@/lib/store/announcements-store';
import { useNotificationHistoryStore } from '@/lib/store/notification-history-store';
import { useInvoiceStore } from '@/lib/store/invoice-store';
import { useAdminTenantStore as useBillingTenantStore } from '@/lib/store/admin-tenant-store';
import { useTenantContextInit } from '@/lib/store/tenant-context-store';
import { Sidebar } from '@/features/navigation/sidebar';
import { Header } from '@/features/navigation/header';
import { Toaster } from '@/components/ui/sonner';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobalShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { SkipLink } from '@/components/a11y/skip-link';
import { getDemoOnboardingData } from '@/lib/demo-onboarding-data';
import { initializeLegalUpdatesDemo } from '@/lib/demo-legal-updates';
import { initializeAnnouncementsDemo } from '@/lib/demo-announcements';
import { useScheduledChangesNotifications } from '@/hooks/use-scheduled-changes-notifications';
import { usePaymentReminderCheck } from '@/hooks/use-payment-reminder-check';
import { initBackgroundSync } from '@/lib/offline/sync-manager';
import { initOfflineDB } from '@/lib/offline/offline-storage';
import { SWRProvider } from '@/components/providers/swr-provider';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { theme, sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, getDensityClass } = useUIStore();
  const { currentUser } = useUserStore();
  const {
    initializeApplication,
    initializeBasicInfoForm,
    initializeFamilyInfoForm,
    initializeBankAccountForm,
    initializeCommuteRouteForm,
  } = useOnboardingStore();
  const { addUpdate, getLegalUpdates } = useLegalUpdatesStore();
  const { createAnnouncement, getAnnouncements } = useAnnouncementsStore();
  const { initializeNotifications } = useNotificationHistoryStore();
  const { initializeInvoices } = useInvoiceStore();
  const { initializeTenants: initializeBillingTenants } = useBillingTenantStore();
  const { initializeTenants } = useTenantStore();

  // マルチテナントコンテキストを初期化
  useTenantContextInit();

  // キーボードショートカットを有効化
  useGlobalShortcuts();

  // 予約管理の通知チェックを有効化
  useScheduledChangesNotifications();

  // 支払い期限リマインダーの自動チェックを有効化
  usePaymentReminderCheck();

  // Initialize onboarding data for applicant role (only once if no data exists)
  useEffect(() => {
    // 新入社員の場合のみ、onboardingデモデータを初期化
    // ただし、既にデータが存在する場合はスキップ（承認後のデータを保護）
    if (currentUser?.roles?.includes('applicant')) {
      // localStorageをチェック（zustand-persistが保存している）
      const existingData = localStorage.getItem('onboarding-storage');

      if (!existingData) {
        // データが存在しない場合のみ初期化
        const onboardingData = getDemoOnboardingData();
        initializeApplication(onboardingData.application);
        initializeBasicInfoForm(onboardingData.basicInfoForm);
        initializeFamilyInfoForm(onboardingData.familyInfoForm);
        initializeBankAccountForm(onboardingData.bankAccountForm);
        initializeCommuteRouteForm(onboardingData.commuteRouteForm);
      }
    }
  }, [
    currentUser,
    initializeApplication,
    initializeBasicInfoForm,
    initializeFamilyInfoForm,
    initializeBankAccountForm,
    initializeCommuteRouteForm,
  ]);

  // Initialize legal updates demo data (only once if no data exists)
  useEffect(() => {
    const existingUpdates = getLegalUpdates();
    if (existingUpdates.length === 0) {
      initializeLegalUpdatesDemo(addUpdate);
    }
  }, [addUpdate, getLegalUpdates]);

  // Initialize announcements demo data (only once if no data exists)
  // デモ環境のみで実行（Amplifyなど本番環境では Supabase 401 エラーを防ぐ）
  useEffect(() => {
    // デモ環境以外では何もしない
    if (process.env.NEXT_PUBLIC_ENV !== 'demo') {
      return;
    }

    try {
      const existingAnnouncements = getAnnouncements();
      if (existingAnnouncements.length === 0) {
        initializeAnnouncementsDemo(createAnnouncement);
      }
    } catch (error) {
      console.warn('Failed to initialize announcements demo data:', error);
    }
  }, [createAnnouncement, getAnnouncements]);

  // Initialize tenants (UI表示用)
  useEffect(() => {
    initializeTenants();
  }, [initializeTenants]);

  // Initialize billing data (invoices, tenants, notification history)
  useEffect(() => {
    initializeBillingTenants();
    initializeInvoices();
    initializeNotifications();
  }, [initializeBillingTenants, initializeInvoices, initializeNotifications]);

  // Initialize offline storage and background sync (PWA)
  useEffect(() => {
    // オフラインDBの初期化
    initOfflineDB().catch((error) => {
      console.error('Failed to initialize offline DB:', error);
    });

    // バックグラウンド同期のセットアップ
    initBackgroundSync();
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <SWRProvider>
      <div className={cn('min-h-screen bg-background flex', getDensityClass())}>
        {/* スキップリンク - アクセシビリティ向上 */}
        <SkipLink />

        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar - Sheet */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className={cn(
          'flex-1 flex flex-col min-h-screen transition-all duration-300',
          // モバイル: マージンなし、デスクトップ: サイドバーの幅に応じたマージン
          'ml-0',
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        )}>
          {/* Mobile Menu Button - Only visible on mobile */}
          <div className="md:hidden fixed top-4 left-4 z-40">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileSidebarOpen(true)}
              className="bg-background shadow-md"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Header */}
          <Header />

          {/* Page Content - メインコンテンツ */}
          <main id="main-content" className="flex-1 overflow-auto p-6" role="main">
            {children}
          </main>
        </div>

        {/* Global Toaster */}
        <Toaster position="top-right" />
      </div>
    </SWRProvider>
  );
}