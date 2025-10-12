'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  SaaSService,
  LicensePlan,
  LicenseAssignment,
  MonthlyCost,
  SaaSCategory,
  LicenseType,
} from '@/types/saas';

const DATA_VERSION = 1;

interface SaaSState {
  // データ
  services: SaaSService[];
  plans: LicensePlan[];
  assignments: LicenseAssignment[];
  monthlyCosts: MonthlyCost[];

  // ローディング状態
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // SaaSサービス管理
  addService: (service: Omit<SaaSService, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateService: (id: string, updates: Partial<SaaSService>) => void;
  deleteService: (id: string) => void;
  getServiceById: (id: string) => SaaSService | undefined;
  getServicesByCategory: (category: SaaSCategory) => SaaSService[];
  getServicesByLicenseType: (licenseType: LicenseType) => SaaSService[];

  // ライセンスプラン管理
  addPlan: (plan: Omit<LicensePlan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePlan: (id: string, updates: Partial<LicensePlan>) => void;
  deletePlan: (id: string) => void;
  getPlanById: (id: string) => LicensePlan | undefined;
  getPlansByServiceId: (serviceId: string) => LicensePlan[];
  getActivePlanByServiceId: (serviceId: string) => LicensePlan | undefined;

  // ライセンス割り当て管理
  addAssignment: (assignment: Omit<LicenseAssignment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAssignment: (id: string, updates: Partial<LicenseAssignment>) => void;
  deleteAssignment: (id: string) => void;
  getAssignmentById: (id: string) => LicenseAssignment | undefined;
  getAssignmentsByServiceId: (serviceId: string) => LicenseAssignment[];
  getAssignmentsByUserId: (userId: string) => LicenseAssignment[];
  getActiveAssignmentsByServiceId: (serviceId: string) => LicenseAssignment[];

  // 統計情報
  getTotalServices: () => number;
  getTotalLicenses: () => number;
  getActiveLicenses: () => number;
  getInactiveLicenses: () => number;
  getTotalMonthlyCost: () => number;
  getUnusedLicensesCost: () => number;
}

// SSR対応: サーバーではpersistを無効化
const createSaaSStore = () => {
  const storeCreator = (
    set: (partial: Partial<SaaSState> | ((state: SaaSState) => Partial<SaaSState>)) => void,
    get: () => SaaSState
  ): SaaSState => ({
    // 初期データ
    services: [],
    plans: [],
    assignments: [],
    monthlyCosts: [],
    isLoading: false,

    // ローディング状態管理
    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    // SaaSサービス管理
    addService: (serviceData) => {
      const newService: SaaSService = {
        ...serviceData,
        id: `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set((state: SaaSState) => ({
        services: [...state.services, newService],
      }));
    },

    updateService: (id: string, updates: Partial<SaaSService>) => {
      set((state: SaaSState) => ({
        services: state.services.map((service) =>
          service.id === id
            ? { ...service, ...updates, updatedAt: new Date().toISOString() }
            : service
        ),
      }));
    },

    deleteService: (id: string) => {
      set((state: SaaSState) => ({
        services: state.services.filter((service) => service.id !== id),
        // 関連するプランと割り当ても削除
        plans: state.plans.filter((plan) => plan.serviceId !== id),
        assignments: state.assignments.filter((assignment) => assignment.serviceId !== id),
      }));
    },

    getServiceById: (id: string) => {
      return get().services.find((service) => service.id === id);
    },

    getServicesByCategory: (category: SaaSCategory) => {
      return get().services.filter((service) => service.category === category);
    },

    getServicesByLicenseType: (licenseType: LicenseType) => {
      return get().services.filter((service) => service.licenseType === licenseType);
    },

    // ライセンスプラン管理
    addPlan: (planData) => {
      const newPlan: LicensePlan = {
        ...planData,
        id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set((state: SaaSState) => ({
        plans: [...state.plans, newPlan],
      }));
    },

    updatePlan: (id: string, updates: Partial<LicensePlan>) => {
      set((state: SaaSState) => ({
        plans: state.plans.map((plan) =>
          plan.id === id
            ? { ...plan, ...updates, updatedAt: new Date().toISOString() }
            : plan
        ),
      }));
    },

    deletePlan: (id: string) => {
      set((state: SaaSState) => ({
        plans: state.plans.filter((plan) => plan.id !== id),
        // 関連する割り当ても削除
        assignments: state.assignments.filter((assignment) => assignment.planId !== id),
      }));
    },

    getPlanById: (id: string) => {
      return get().plans.find((plan) => plan.id === id);
    },

    getPlansByServiceId: (serviceId: string) => {
      return get().plans.filter((plan) => plan.serviceId === serviceId);
    },

    getActivePlanByServiceId: (serviceId: string) => {
      return get().plans.find((plan) => plan.serviceId === serviceId && plan.isActive);
    },

    // ライセンス割り当て管理
    addAssignment: (assignmentData) => {
      const newAssignment: LicenseAssignment = {
        ...assignmentData,
        id: `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set((state: SaaSState) => ({
        assignments: [...state.assignments, newAssignment],
      }));
    },

    updateAssignment: (id: string, updates: Partial<LicenseAssignment>) => {
      set((state: SaaSState) => ({
        assignments: state.assignments.map((assignment) =>
          assignment.id === id
            ? { ...assignment, ...updates, updatedAt: new Date().toISOString() }
            : assignment
        ),
      }));
    },

    deleteAssignment: (id: string) => {
      set((state: SaaSState) => ({
        assignments: state.assignments.filter((assignment) => assignment.id !== id),
      }));
    },

    getAssignmentById: (id: string) => {
      return get().assignments.find((assignment) => assignment.id === id);
    },

    getAssignmentsByServiceId: (serviceId: string) => {
      return get().assignments.filter((assignment) => assignment.serviceId === serviceId);
    },

    getAssignmentsByUserId: (userId: string) => {
      return get().assignments.filter((assignment) => assignment.userId === userId);
    },

    getActiveAssignmentsByServiceId: (serviceId: string) => {
      return get().assignments.filter(
        (assignment) => assignment.serviceId === serviceId && assignment.status === 'active'
      );
    },

    // 統計情報
    getTotalServices: () => {
      return get().services.length;
    },

    getTotalLicenses: () => {
      return get().assignments.length;
    },

    getActiveLicenses: () => {
      return get().assignments.filter((assignment) => assignment.status === 'active').length;
    },

    getInactiveLicenses: () => {
      return get().assignments.filter((assignment) => assignment.status === 'inactive').length;
    },

    getTotalMonthlyCost: () => {
      const state = get();
      let totalCost = 0;

      // 各サービスのコストを計算
      state.services.forEach((service) => {
        const activePlan = state.getActivePlanByServiceId(service.id);
        if (!activePlan) return;

        if (service.licenseType === 'user-based' && activePlan.pricePerUser) {
          const activeAssignments = state.getActiveAssignmentsByServiceId(service.id);
          totalCost += activePlan.pricePerUser * activeAssignments.length;
        } else if (service.licenseType === 'fixed' && activePlan.fixedPrice) {
          totalCost += activePlan.fixedPrice;
        }
      });

      return totalCost;
    },

    getUnusedLicensesCost: () => {
      const state = get();
      let unusedCost = 0;

      // 30日以上使用されていないライセンスのコストを計算
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      state.assignments.forEach((assignment) => {
        if (assignment.status !== 'active') return;

        const lastUsed = assignment.lastUsedAt ? new Date(assignment.lastUsedAt) : null;
        if (lastUsed && lastUsed > thirtyDaysAgo) return;

        const plan = state.getPlanById(assignment.planId);
        if (plan && plan.pricePerUser) {
          unusedCost += plan.pricePerUser;
        }
      });

      return unusedCost;
    },
  });

  // SSR時はpersistを使わない
  if (typeof window === 'undefined') {
    return create<SaaSState>()(storeCreator);
  }

  // クライアントサイドではpersistを使用
  return create<SaaSState>()(
    persist(storeCreator, {
      name: 'saas-storage',
      version: DATA_VERSION,
      storage: createJSONStorage(() => localStorage),
    })
  );
};

export const useSaaSStore = createSaaSStore();
