import { create } from 'zustand';
import type {
  HealthCheckupSchedule,
  HealthCheckupScheduleInput,
  ScheduleStatus,
  ScheduleFilters,
} from '@/types/health';

/**
 * 健康管理ストア
 * 健診予定の管理、フィルタリング機能を提供
 */

interface HealthScheduleState {
  // 状態
  schedules: HealthCheckupSchedule[];
  tenantId: string | null;
  isLoading: boolean;
  error: string | null;

  // フィルター
  filters: ScheduleFilters;

  // 統計
  stats: {
    totalScheduled: number;
    totalCompleted: number;
    totalCancelled: number;
    completionRate: number;
  };

  // 初期化
  setTenantId: (tenantId: string) => void;

  // 予定操作
  fetchSchedules: (fiscalYear?: number) => Promise<void>;
  addSchedule: (data: HealthCheckupScheduleInput) => Promise<void>;
  updateSchedule: (id: string, data: Partial<HealthCheckupScheduleInput>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  updateScheduleStatus: (id: string, status: ScheduleStatus) => Promise<void>;

  // フィルター操作
  setFilters: (filters: Partial<ScheduleFilters>) => void;
  clearFilters: () => void;

  // ヘルパー
  getFilteredSchedules: () => HealthCheckupSchedule[];
  getSchedulesByStatus: (status: ScheduleStatus) => HealthCheckupSchedule[];
}

// API応答をフロントエンド型に変換
const mapSchedule = (item: HealthCheckupSchedule): HealthCheckupSchedule => ({
  ...item,
  scheduledDate: new Date(item.scheduledDate),
  createdAt: new Date(item.createdAt),
  updatedAt: new Date(item.updatedAt),
});

export const useHealthStore = create<HealthScheduleState>()((set, get) => ({
  schedules: [],
  tenantId: null,
  isLoading: false,
  error: null,
  filters: {
    departmentName: undefined,
    status: 'all',
    fiscalYear: new Date().getFullYear(),
    searchQuery: '',
  },
  stats: {
    totalScheduled: 0,
    totalCompleted: 0,
    totalCancelled: 0,
    completionRate: 0,
  },

  setTenantId: (tenantId) => {
    set({ tenantId });
  },

  // ==================== 予定操作 ====================

  fetchSchedules: async (fiscalYear) => {
    const { tenantId, filters } = get();
    if (!tenantId) return;

    const year = fiscalYear || filters.fiscalYear || new Date().getFullYear();

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(
        `/api/health/schedules?tenantId=${tenantId}&fiscalYear=${year}`
      );
      if (!res.ok) throw new Error('健診予定の取得に失敗しました');
      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.data || []);
      const schedules = data.map(mapSchedule);

      // 統計を計算
      const totalScheduled = schedules.filter((s: HealthCheckupSchedule) => s.status === 'scheduled').length;
      const totalCompleted = schedules.filter((s: HealthCheckupSchedule) => s.status === 'completed').length;
      const totalCancelled = schedules.filter((s: HealthCheckupSchedule) => s.status === 'cancelled').length;
      const total = schedules.length;

      set({
        schedules,
        stats: {
          totalScheduled,
          totalCompleted,
          totalCancelled,
          completionRate: total > 0 ? Math.round((totalCompleted / total) * 100) : 0,
        },
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addSchedule: async (data) => {
    const { tenantId, fetchSchedules, filters } = get();
    if (!tenantId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/health/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...data }),
      });
      if (!res.ok) throw new Error('健診予定の登録に失敗しました');
      await fetchSchedules(filters.fiscalYear);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateSchedule: async (id, data) => {
    const { fetchSchedules, filters } = get();

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/health/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('健診予定の更新に失敗しました');
      await fetchSchedules(filters.fiscalYear);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteSchedule: async (id) => {
    const { fetchSchedules, filters } = get();

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/health/schedules/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('健診予定の削除に失敗しました');
      await fetchSchedules(filters.fiscalYear);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateScheduleStatus: async (id, status) => {
    const { fetchSchedules, filters } = get();

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/health/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('ステータスの更新に失敗しました');
      await fetchSchedules(filters.fiscalYear);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // ==================== フィルター操作 ====================

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        departmentName: undefined,
        status: 'all',
        fiscalYear: new Date().getFullYear(),
        searchQuery: '',
      },
    });
  },

  // ==================== ヘルパー ====================

  getFilteredSchedules: () => {
    const { schedules, filters } = get();

    return schedules.filter((schedule) => {
      // 部署フィルタ
      if (filters.departmentName && schedule.departmentName !== filters.departmentName) {
        return false;
      }

      // ステータスフィルタ
      if (filters.status && filters.status !== 'all' && schedule.status !== filters.status) {
        return false;
      }

      // 検索クエリ
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = schedule.userName.toLowerCase().includes(query);
        const matchesDept = schedule.departmentName?.toLowerCase().includes(query);
        if (!matchesName && !matchesDept) {
          return false;
        }
      }

      return true;
    });
  },

  getSchedulesByStatus: (status) => {
    return get().schedules.filter((s) => s.status === status);
  },
}));
