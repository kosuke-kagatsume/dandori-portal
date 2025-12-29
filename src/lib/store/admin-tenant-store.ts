/**
 * Admin Tenant Management Store
 *
 * DW社管理者用のテナント管理ストア
 * 実APIに接続してデータを取得・操作
 */

import { create } from 'zustand';

export interface TenantSettings {
  status: 'trial' | 'active' | 'suspended' | 'cancelled';
  trialEndDate: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  billingEmail: string | null;
  customPricing: boolean;
}

export interface TenantWithStats {
  id: string;
  name: string;
  subdomain: string | null;
  settings: TenantSettings | null;
  userCount: number;
  invoiceCount: number;
  totalAmount: number;
  unpaidAmount: number;
  overdueCount: number;
  createdAt: string;
  updatedAt: string;
  // 拡張プロパティ（UI互換性のため）
  contactEmail?: string | null;
  billingEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  plan?: 'basic' | 'standard' | 'premium' | 'enterprise';
  maxUsers?: number;
  currentUsers?: number;
  activeUsers?: number;
  monthlyRevenue?: number;
  unpaidInvoices?: number;
  status?: 'trial' | 'active' | 'suspended' | 'cancelled';
  contractStartDate?: string | null;
  contractEndDate?: string | null;
}

interface TenantSummary {
  total: number;
  byStatus: Record<string, number>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AdminTenantState {
  // データ
  tenants: TenantWithStats[];
  summary: TenantSummary;
  pagination: PaginationInfo;

  // 状態
  isLoading: boolean;
  error: string | null;

  // フィルター
  statusFilter: string | null;
  searchQuery: string;

  // API操作
  fetchTenants: (options?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;

  createTenant: (data: {
    name: string;
    subdomain?: string;
    plan?: string;
    status?: string;
    billingEmail?: string;
    trialEndDate?: string;
  }) => Promise<TenantWithStats | null>;

  updateTenant: (id: string, updates: Partial<TenantWithStats>) => Promise<boolean>;
  deleteTenant: (id: string) => Promise<boolean>;

  // ローカル状態操作
  setStatusFilter: (status: string | null) => void;
  setSearchQuery: (query: string) => void;

  // クエリ（ローカルキャッシュから）
  getTenantById: (id: string) => TenantWithStats | undefined;
  getTenantBySubdomain: (subdomain: string) => TenantWithStats | undefined;
  getTenantsByStatus: (status: string) => TenantWithStats[];

  // 統計（API summary から）
  getStats: () => {
    totalTenants: number;
    monthlyRevenue: number;
    totalUsers: number;
    unpaidInvoices: number;
    byStatus: Record<string, number>;
  };

  // 初期化
  initializeTenants: () => Promise<void>;
}

const initialState = {
  tenants: [],
  summary: { total: 0, byStatus: {} },
  pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
  isLoading: false,
  error: null,
  statusFilter: null,
  searchQuery: '',
};

export const useAdminTenantStore = create<AdminTenantState>((set, get) => ({
  ...initialState,

  fetchTenants: async (options = {}) => {
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      if (options.status) params.set('status', options.status);
      if (options.search) params.set('search', options.search);
      if (options.page) params.set('page', String(options.page));
      if (options.limit) params.set('limit', String(options.limit));

      const response = await fetch(`/api/dw-admin/tenants?${params.toString()}`);
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'テナント一覧の取得に失敗しました');
      }

      set({
        tenants: json.data.tenants,
        summary: json.data.summary,
        pagination: json.data.pagination,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching tenants:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '不明なエラー',
      });
    }
  },

  createTenant: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/dw-admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'テナントの作成に失敗しました');
      }

      // 一覧を再取得
      await get().fetchTenants();

      set({ isLoading: false });
      return json.data;
    } catch (error) {
      console.error('Error creating tenant:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '不明なエラー',
      });
      return null;
    }
  },

  updateTenant: async (id, updates) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/dw-admin/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'テナントの更新に失敗しました');
      }

      // ローカルキャッシュを更新
      set((state) => ({
        tenants: state.tenants.map((t) =>
          t.id === id ? { ...t, ...json.data } : t
        ),
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Error updating tenant:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '不明なエラー',
      });
      return false;
    }
  },

  deleteTenant: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/dw-admin/tenants/${id}`, {
        method: 'DELETE',
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'テナントの削除に失敗しました');
      }

      // ローカルキャッシュから削除
      set((state) => ({
        tenants: state.tenants.filter((t) => t.id !== id),
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Error deleting tenant:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '不明なエラー',
      });
      return false;
    }
  },

  setStatusFilter: (status) => {
    set({ statusFilter: status });
    get().fetchTenants({ status: status || undefined });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().fetchTenants({ search: query || undefined });
  },

  getTenantById: (id) => {
    return get().tenants.find((t) => t.id === id);
  },

  getTenantBySubdomain: (subdomain) => {
    return get().tenants.find((t) => t.subdomain === subdomain);
  },

  getTenantsByStatus: (status) => {
    return get().tenants.filter((t) => t.settings?.status === status);
  },

  getStats: () => {
    const { tenants, summary } = get();

    return {
      totalTenants: summary.total || tenants.length,
      monthlyRevenue: tenants.reduce((sum, t) => sum + (t.totalAmount || 0), 0),
      totalUsers: tenants.reduce((sum, t) => sum + (t.userCount || 0), 0),
      unpaidInvoices: tenants.reduce((sum, t) => sum + (t.overdueCount || 0), 0),
      byStatus: summary.byStatus || {
        trial: 0,
        active: 0,
        suspended: 0,
        cancelled: 0,
      },
    };
  },

  initializeTenants: async () => {
    // 初回のみフェッチ
    if (get().tenants.length === 0) {
      await get().fetchTenants();
    }
  },
}));
