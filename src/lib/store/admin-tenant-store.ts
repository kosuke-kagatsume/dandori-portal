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
  plan: 'basic' | 'standard' | 'enterprise'; // 契約プラン
  activeUsers: number;
  currentUsers: number; // activeUsersのエイリアス（請求システム用）
  totalUsers: number;
  maxUsers: number; // 最大ユーザー数
  monthlyRevenue: number; // 月次収益（税込）
  unpaidInvoices: number; // 未払い請求書数
  contactEmail: string; // 連絡先メールアドレス
  billingEmail: string; // settings.billingEmailのエイリアス（請求システム用）
  phone: string | null; // 電話番号
  address: string | null; // 住所
  contractStartDate: string; // 契約開始日
  contractEndDate: string | null; // 契約終了日
  status: TenantSettings['status']; // settings.statusのエイリアス（請求システム用）
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

  // 初期化
  initializeTenants: () => void;
}

// デモデータ
const DEMO_TENANTS: TenantWithStats[] = [
  {
    id: 'tenant-001',
    name: '株式会社サンプル商事',
    logo: null,
    plan: 'standard',
    activeUsers: 49,
    currentUsers: 49,
    totalUsers: 52,
    maxUsers: 100,
    monthlyRevenue: 45320, // ¥41,200 + 税
    unpaidInvoices: 0,
    contactEmail: 'contact@sample-corp.co.jp',
    billingEmail: 'billing@sample-corp.co.jp',
    phone: '03-1234-5678',
    address: '東京都渋谷区渋谷1-1-1',
    contractStartDate: '2025-01-01',
    contractEndDate: '2025-12-31',
    status: 'active',
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
    plan: 'basic',
    activeUsers: 15,
    currentUsers: 15,
    totalUsers: 18,
    maxUsers: 30,
    monthlyRevenue: 14300, // ¥13,000 + 税
    unpaidInvoices: 1,
    contactEmail: 'contact@test-corp.co.jp',
    billingEmail: 'finance@test-corp.co.jp',
    phone: '03-2345-6789',
    address: '東京都港区六本木2-2-2',
    contractStartDate: '2025-02-01',
    contractEndDate: '2025-12-31',
    status: 'active',
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
    plan: 'basic',
    activeUsers: 5,
    currentUsers: 5,
    totalUsers: 5,
    maxUsers: 10,
    monthlyRevenue: 0, // トライアル中
    unpaidInvoices: 0,
    contactEmail: 'contact@trial-corp.co.jp',
    billingEmail: 'admin@trial-corp.co.jp',
    phone: null,
    address: null,
    contractStartDate: '2025-11-15',
    contractEndDate: null,
    status: 'trial',
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
    plan: 'enterprise',
    activeUsers: 120,
    currentUsers: 120,
    totalUsers: 135,
    maxUsers: 200,
    monthlyRevenue: 77000, // ¥70,000 + 税
    unpaidInvoices: 0,
    contactEmail: 'contact@large-corp.co.jp',
    billingEmail: 'accounting@large-corp.co.jp',
    phone: '03-3456-7890',
    address: '東京都千代田区大手町3-3-3',
    contractStartDate: '2024-06-01',
    contractEndDate: '2025-05-31',
    status: 'active',
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
    plan: 'standard',
    activeUsers: 0,
    currentUsers: 0,
    totalUsers: 25,
    maxUsers: 50,
    monthlyRevenue: 0,
    unpaidInvoices: 3,
    contactEmail: 'contact@suspended-corp.co.jp',
    billingEmail: 'admin@suspended-corp.co.jp',
    phone: '03-4567-8901',
    address: '東京都品川区品川4-4-4',
    contractStartDate: '2025-03-01',
    contractEndDate: '2025-12-31',
    status: 'suspended',
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
          currentUsers: tenant.activeUsers, // エイリアス同期
          billingEmail: tenant.settings.billingEmail || '',
          status: tenant.settings.status,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          tenants: [...state.tenants, newTenant],
        }));
      },

      updateTenant: (id, updates) => {
        set((state) => ({
          tenants: state.tenants.map((tenant) => {
            if (tenant.id !== id) return tenant;

            const updated = { ...tenant, ...updates, updatedAt: new Date() };

            // エイリアスプロパティを同期
            if (updates.activeUsers !== undefined) {
              updated.currentUsers = updates.activeUsers;
            }
            if (updates.settings?.billingEmail !== undefined) {
              updated.billingEmail = updates.settings.billingEmail || '';
            }
            if (updates.settings?.status !== undefined) {
              updated.status = updates.settings.status;
            }

            return updated;
          }),
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

      initializeTenants: () => {
        const existingTenants = get().tenants;
        if (existingTenants.length === 0) {
          set({ tenants: DEMO_TENANTS });
        }
      },
    }),
    {
      name: 'admin-tenant-storage',
    }
  )
);
