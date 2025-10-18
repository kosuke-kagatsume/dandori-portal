'use client';

import { useEffect } from 'react';
import { useUIStore, useTenantStore, useUserStore, useNotificationStore } from '@/lib/store';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { Sidebar } from '@/features/navigation/sidebar';
import { Header } from '@/features/navigation/header';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { useGlobalKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { SkipLink } from '@/components/a11y/skip-link';
import { getDemoOnboardingData } from '@/lib/demo-onboarding-data';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { theme, sidebarCollapsed, getDensityClass } = useUIStore();
  const { setTenants } = useTenantStore();
  const { setCurrentUser, setDemoMode, currentUser } = useUserStore();
  const { setNotifications } = useNotificationStore();
  const {
    initializeApplication,
    initializeBasicInfoForm,
    initializeFamilyInfoForm,
    initializeBankAccountForm,
    initializeCommuteRouteForm,
  } = useOnboardingStore();

  // キーボードショートカットを有効化
  useGlobalKeyboardShortcuts();

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
        console.log('[Demo] Initializing onboarding data for applicant (first time)');
        initializeApplication(onboardingData.application);
        initializeBasicInfoForm(onboardingData.basicInfoForm);
        initializeFamilyInfoForm(onboardingData.familyInfoForm);
        initializeBankAccountForm(onboardingData.bankAccountForm);
        initializeCommuteRouteForm(onboardingData.commuteRouteForm);
      } else {
        console.log('[Demo] Onboarding data already exists, skipping initialization');
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

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className={cn('min-h-screen bg-background', getDensityClass())}>
      {/* スキップリンク - アクセシビリティ向上 */}
      <SkipLink />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className={cn(
        'flex flex-col min-h-screen transition-all duration-300',
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      )}>
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
  );
}