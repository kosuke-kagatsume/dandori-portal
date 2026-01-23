'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';

// 全てのpersist対応ストアをインポート
import { useUIStore } from '@/lib/store/ui-store';
import { useUserStore } from '@/lib/store/user-store';
import { useTenantStore } from '@/lib/store/tenant-store';
import { useAttendanceStore } from '@/lib/attendance-store';
import { useAttendanceAlertStore } from '@/lib/store/attendance-alert-store';
import { useAttendanceHistoryStore } from '@/lib/store/attendance-history-store';
import { useShiftStore } from '@/lib/store/shift-store';
import { useLeaveTypeStore } from '@/lib/store/leave-type-store';
import { useLeaveManagementStore } from '@/lib/store/leave-management-store';
import { useOrganizationStore } from '@/lib/store/organization-store';
import { useApprovalStore } from '@/lib/approval-store';
import { useApprovalFlowStore } from '@/lib/store/approval-flow-store';
import { useWorkflowStore } from '@/lib/workflow-store';
import { usePCStore } from '@/lib/store/pc-store';
import { useVehicleStore } from '@/lib/store/vehicle-store';
import { useSaaSStore } from '@/lib/store/saas-store';
import { usePayrollStore } from '@/lib/store/payroll-store';
import { usePerformanceEvaluationStore } from '@/lib/store/performance-evaluation-store';
import { useRetiredYearEndStore } from '@/lib/store/retired-yearend-store';
import { useAnnouncementsStore } from '@/lib/store/announcements-store';
import { useAuditStore } from '@/lib/store/audit-store';
import { useCompanySettingsStore } from '@/lib/store/company-settings-store';
import { useInvoiceAutoGenerationStore } from '@/lib/store/invoice-auto-generation-store';
import { useLegalUpdatesStore } from '@/lib/store/legal-updates-store';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { usePaymentReminderStore } from '@/lib/store/payment-reminder-store';
import { useScheduledChangesStore } from '@/lib/store/scheduled-changes-store';
import { useTodoStore } from '@/lib/store/todo-store';

// Zustand persist ストアの型定義
interface PersistStore {
  persist?: {
    rehydrate: () => Promise<void> | void;
  };
}

// ハイドレーション対象のストア一覧（全28ストア）
const STORES_TO_HYDRATE: Array<{
  name: string;
  store: PersistStore;
}> = [
  // UI & Settings
  { name: 'ui-store', store: useUIStore as unknown as PersistStore },
  { name: 'user-store', store: useUserStore as unknown as PersistStore },
  { name: 'tenant-store', store: useTenantStore as unknown as PersistStore },

  // Attendance
  { name: 'attendance-store', store: useAttendanceStore as unknown as PersistStore },
  { name: 'attendance-alert-store', store: useAttendanceAlertStore as unknown as PersistStore },
  { name: 'attendance-history-store', store: useAttendanceHistoryStore as unknown as PersistStore },
  { name: 'shift-store', store: useShiftStore as unknown as PersistStore },
  { name: 'leave-type-store', store: useLeaveTypeStore as unknown as PersistStore },
  { name: 'leave-management-store', store: useLeaveManagementStore as unknown as PersistStore },

  // Organization & Workflow
  { name: 'organization-store', store: useOrganizationStore as unknown as PersistStore },
  { name: 'approval-store', store: useApprovalStore as unknown as PersistStore },
  { name: 'approval-flow-store', store: useApprovalFlowStore as unknown as PersistStore },
  { name: 'workflow-store', store: useWorkflowStore as unknown as PersistStore },

  // Assets
  { name: 'pc-store', store: usePCStore as unknown as PersistStore },
  { name: 'vehicle-store', store: useVehicleStore as unknown as PersistStore },
  { name: 'saas-store', store: useSaaSStore as unknown as PersistStore },

  // Payroll & Evaluation
  { name: 'payroll-store', store: usePayrollStore as unknown as PersistStore },
  { name: 'performance-evaluation-store', store: usePerformanceEvaluationStore as unknown as PersistStore },
  { name: 'retired-yearend-store', store: useRetiredYearEndStore as unknown as PersistStore },

  // Other
  { name: 'announcements-store', store: useAnnouncementsStore as unknown as PersistStore },
  { name: 'audit-store', store: useAuditStore as unknown as PersistStore },
  { name: 'company-settings-store', store: useCompanySettingsStore as unknown as PersistStore },
  { name: 'invoice-auto-generation-store', store: useInvoiceAutoGenerationStore as unknown as PersistStore },
  { name: 'legal-updates-store', store: useLegalUpdatesStore as unknown as PersistStore },
  { name: 'onboarding-store', store: useOnboardingStore as unknown as PersistStore },
  { name: 'payment-reminder-store', store: usePaymentReminderStore as unknown as PersistStore },
  { name: 'scheduled-changes-store', store: useScheduledChangesStore as unknown as PersistStore },
  { name: 'todo-store', store: useTodoStore as unknown as PersistStore },
];

interface HydrationContextType {
  isHydrated: boolean;
}

const HydrationContext = createContext<HydrationContextType>({
  isHydrated: false,
});

export function useHydration() {
  return useContext(HydrationContext);
}

interface HydrationProviderProps {
  children: ReactNode;
}

/**
 * ストアのハイドレーションを管理するProvider
 *
 * SSRとCSRの状態不一致によるReact Hydration Error (#425, #422) を防ぐため、
 * クライアントサイドでのマウント後にストアをrehydrateする
 *
 * 使用方法:
 * 1. 各ストアにskipHydration: trueを追加
 * 2. STORES_TO_HYDRATEにストアを登録
 * 3. レイアウトでこのProviderをラップ
 */
export function HydrationProvider({ children }: HydrationProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // クライアントサイドでマウント後にストアをrehydrate
    STORES_TO_HYDRATE.forEach(({ name, store }) => {
      try {
        // persist APIが存在する場合のみrehydrate
        if (store.persist?.rehydrate) {
          store.persist.rehydrate();
        }
      } catch (error) {
        console.warn(`[HydrationProvider] Failed to rehydrate ${name}:`, error);
      }
    });

    setIsHydrated(true);
  }, []);

  return (
    <HydrationContext.Provider value={{ isHydrated }}>
      {children}
    </HydrationContext.Provider>
  );
}
