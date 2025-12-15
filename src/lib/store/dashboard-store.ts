import { create } from 'zustand';

export interface KpiData {
  totalEmployees: number;
  todayAttendance: number;
  attendanceRate: number;
  pendingApprovals: number;
  urgentApprovals: number;
}

export interface SaasCostCategory {
  category: string;
  cost: number;
  percentage: number;
}

export interface SaasMonthlyData {
  month: string;
  [category: string]: string | number;
}

export interface AssetUtilization {
  category: string;
  total: number;
  inUse: number;
  available: number;
  utilizationRate: number;
}

interface DashboardState {
  // データ
  kpiData: KpiData;
  saasCostByCategory: SaasCostCategory[];
  saasMonthlyTrend: SaasMonthlyData[];
  saasCategories: string[];
  assetUtilization: AssetUtilization[];

  // 状態
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;

  // アクション
  fetchDashboardStats: (tenantId?: string) => Promise<void>;
  reset: () => void;
}

const initialState = {
  kpiData: {
    totalEmployees: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    pendingApprovals: 0,
    urgentApprovals: 0,
  },
  saasCostByCategory: [],
  saasMonthlyTrend: [],
  saasCategories: [],
  assetUtilization: [],
  isLoading: false,
  error: null,
  lastFetched: null,
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  ...initialState,

  fetchDashboardStats: async (tenantId = 'tenant-demo-001') => {
    // 5分以内に取得済みならキャッシュを使用
    const lastFetched = get().lastFetched;
    if (lastFetched && Date.now() - lastFetched.getTime() < 5 * 60 * 1000) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/dashboard/stats?tenantId=${tenantId}`);
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Failed to fetch dashboard stats');
      }

      const { data } = json;

      set({
        kpiData: data.kpiCards,
        saasCostByCategory: data.saasCostByCategory,
        saasMonthlyTrend: data.saasMonthlyTrend,
        saasCategories: data.saasCategories,
        assetUtilization: data.assetUtilization,
        isLoading: false,
        lastFetched: new Date(),
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  reset: () => set(initialState),
}));
