/**
 * Admin Tenant Management Store
 *
 * DW社管理者用のテナント管理ストア
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TenantSettings {
  id: string;
  tenantId: string;
  trialEndDate: Date | null;
  contractStartDate: Date | null;
  contractEndDate: Date | null;
  billingEmail: string | null;
  customPricing: boolean;
  status: 'trial' | 'active' | 'suspended' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantWithStats {
  id: string;
  name: string;
  logo: string | null;
  activeUsers: number;
  totalUsers: number;
  monthlyRevenue: number; // 月次収益（税込）
  unpaidInvoices: number; // 未払い請求書数
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
}

interface AdminTenantState {
  tenants: TenantWithStats[];

  // CRUD操作
  addTenant: (tenant: Omit<TenantWithStats, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTenant: (id: string, updates: Partial<TenantWithStats>) => void;
  deleteTenant: (id: string) => void;

  // クエリ
  getTenantById: (id: string) => TenantWithStats | undefined;
  getTenantsByStatus: (status: TenantSettings['status']) => TenantWithStats[];

  // 統計
  getStats: () => {
    totalTenants: number;
    monthlyRevenue: number;
    totalUsers: number;
    unpaidInvoices: number;
    byStatus: Record<TenantSettings['status'], number>;
  };
}

// デモデータ
const DEMO_TENANTS: TenantWithStats[] = [
  {
    id: 'tenant-001',
    name: '株式会社サンプル商事',
    logo: null,
    activeUsers: 49,
    totalUsers: 52,
    monthlyRevenue: 45320, // ¥41,200 + 税
    unpaidInvoices: 0,
    settings: {
      id: 'settings-001',
      tenantId: 'tenant-001',
      trialEndDate: null,
      contractStartDate: new Date('2025-01-01'),
      contractEndDate: new Date('2025-12-31'),
      billingEmail: 'billing@sample-corp.co.jp',
      customPricing: false,
      status: 'active',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-11-16'),
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-11-16'),
  },
  {
    id: 'tenant-002',
    name: 'テスト株式会社',
    logo: null,
    activeUsers: 15,
    totalUsers: 18,
    monthlyRevenue: 14300, // ¥13,000 + 税
    unpaidInvoices: 1,
    settings: {
      id: 'settings-002',
      tenantId: 'tenant-002',
      trialEndDate: null,
      contractStartDate: new Date('2025-02-01'),
      contractEndDate: new Date('2025-12-31'),
      billingEmail: 'finance@test-corp.co.jp',
      customPricing: false,
      status: 'active',
      createdAt: new Date('2025-02-01'),
      updatedAt: new Date('2025-11-16'),
    },
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-11-16'),
  },
  {
    id: 'tenant-003',
    name: 'トライアル株式会社',
    logo: null,
    activeUsers: 5,
    totalUsers: 5,
    monthlyRevenue: 0, // トライアル中
    unpaidInvoices: 0,
    settings: {
      id: 'settings-003',
      tenantId: 'tenant-003',
      trialEndDate: new Date('2025-12-15'),
      contractStartDate: null,
      contractEndDate: null,
      billingEmail: 'admin@trial-corp.co.jp',
      customPricing: false,
      status: 'trial',
      createdAt: new Date('2025-11-15'),
      updatedAt: new Date('2025-11-15'),
    },
    createdAt: new Date('2025-11-15'),
    updatedAt: new Date('2025-11-15'),
  },
  {
    id: 'tenant-004',
    name: '大規模株式会社',
    logo: null,
    activeUsers: 120,
    totalUsers: 135,
    monthlyRevenue: 77000, // ¥70,000 + 税
    unpaidInvoices: 0,
    settings: {
      id: 'settings-004',
      tenantId: 'tenant-004',
      trialEndDate: null,
      contractStartDate: new Date('2024-06-01'),
      contractEndDate: new Date('2025-05-31'),
      billingEmail: 'accounting@large-corp.co.jp',
      customPricing: true, // カスタム料金設定
      status: 'active',
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2025-11-16'),
    },
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2025-11-16'),
  },
  {
    id: 'tenant-005',
    name: '停止中株式会社',
    logo: null,
    activeUsers: 0,
    totalUsers: 25,
    monthlyRevenue: 0,
    unpaidInvoices: 3,
    settings: {
      id: 'settings-005',
      tenantId: 'tenant-005',
      trialEndDate: null,
      contractStartDate: new Date('2025-03-01'),
      contractEndDate: new Date('2025-12-31'),
      billingEmail: 'admin@suspended-corp.co.jp',
      customPricing: false,
      status: 'suspended',
      createdAt: new Date('2025-03-01'),
      updatedAt: new Date('2025-10-01'),
    },
    createdAt: new Date('2025-03-01'),
    updatedAt: new Date('2025-10-01'),
  },
];

export const useAdminTenantStore = create<AdminTenantState>()(
  persist(
    (set, get) => ({
      tenants: DEMO_TENANTS,

      addTenant: (tenant) => {
        const newTenant: TenantWithStats = {
          ...tenant,
          id: `tenant-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          tenants: [...state.tenants, newTenant],
        }));
      },

      updateTenant: (id, updates) => {
        set((state) => ({
          tenants: state.tenants.map((tenant) =>
            tenant.id === id
              ? { ...tenant, ...updates, updatedAt: new Date() }
              : tenant
          ),
        }));
      },

      deleteTenant: (id) => {
        set((state) => ({
          tenants: state.tenants.filter((tenant) => tenant.id !== id),
        }));
      },

      getTenantById: (id) => {
        return get().tenants.find((tenant) => tenant.id === id);
      },

      getTenantsByStatus: (status) => {
        return get().tenants.filter((tenant) => tenant.settings.status === status);
      },

      getStats: () => {
        const tenants = get().tenants;

        return {
          totalTenants: tenants.length,
          monthlyRevenue: tenants.reduce((sum, t) => sum + t.monthlyRevenue, 0),
          totalUsers: tenants.reduce((sum, t) => sum + t.activeUsers, 0),
          unpaidInvoices: tenants.reduce((sum, t) => sum + t.unpaidInvoices, 0),
          byStatus: {
            trial: tenants.filter((t) => t.settings.status === 'trial').length,
            active: tenants.filter((t) => t.settings.status === 'active').length,
            suspended: tenants.filter((t) => t.settings.status === 'suspended').length,
            cancelled: tenants.filter((t) => t.settings.status === 'cancelled').length,
          },
        };
      },
    }),
    {
      name: 'admin-tenant-storage',
    }
  )
);
