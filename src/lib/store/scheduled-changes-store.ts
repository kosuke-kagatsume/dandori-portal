import { create } from 'zustand';

// 予約変更のタイプ
export type ScheduledChangeType = 'hire' | 'transfer' | 'retirement';
export type ScheduledChangeStatus = 'pending' | 'applied' | 'cancelled';

// 入社予約の詳細
export interface HireDetails {
  name: string;
  email: string;
  department: string;
  position: string;
  role: 'employee' | 'manager' | 'hr' | 'admin';
  employeeNumber?: string;
}

// 異動予約の詳細
export interface TransferDetails {
  currentDepartment: string;
  newDepartment: string;
  currentPosition: string;
  newPosition: string;
  reason?: string;
}

// 退職予約の詳細
export interface RetirementDetails {
  retirementReason: 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other';
  notes?: string;
}

// 承認ステータス
export type ApprovalStatus = 'not_required' | 'pending_approval' | 'approved' | 'rejected';

// 予約変更
export interface ScheduledChange {
  id: string;
  type: ScheduledChangeType;
  userId?: string; // 入社の場合はnull、異動・退職の場合は対象ユーザーID
  userName?: string; // 表示用のユーザー名
  effectiveDate: string; // YYYY-MM-DD形式
  status: ScheduledChangeStatus;
  createdBy: string; // HR担当者のID
  createdByName: string; // HR担当者の名前
  createdAt: string;
  updatedAt: string;
  details: HireDetails | TransferDetails | RetirementDetails;

  // 承認フロー関連
  requiresApproval: boolean; // 承認が必要かどうか
  approvalStatus?: ApprovalStatus; // 承認ステータス
  workflowId?: string; // ワークフローID（承認フローが開始された場合）
  approvedBy?: string; // 承認者のID
  approvedByName?: string; // 承認者の名前
  approvedAt?: string; // 承認日時
  rejectionReason?: string; // 却下理由
}

interface ScheduledChangesStats {
  total: number;
  pending: number;
  applied: number;
  cancelled: number;
  byType: Record<ScheduledChangeType, number>;
}

interface ScheduledChangesState {
  changes: ScheduledChange[];
  stats: ScheduledChangesStats | null;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;

  // API連携
  fetchChanges: (filters?: {
    type?: ScheduledChangeType;
    status?: ScheduledChangeStatus;
    approvalStatus?: ApprovalStatus;
    userId?: string;
  }) => Promise<void>;

  // CRUD操作（API経由）
  scheduleChange: (change: Omit<ScheduledChange, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'approvalStatus'>) => Promise<ScheduledChange | null>;
  updateScheduledChange: (id: string, updates: Partial<ScheduledChange>) => Promise<boolean>;
  cancelScheduledChange: (id: string) => Promise<boolean>;
  applyScheduledChange: (id: string) => Promise<boolean>;
  deleteScheduledChange: (id: string) => Promise<boolean>;

  // 承認フロー操作（API経由）
  approveScheduledChange: (id: string, approverId: string, approverName: string) => Promise<boolean>;
  rejectScheduledChange: (id: string, rejectedBy: string, rejectedByName: string, reason: string) => Promise<boolean>;
  linkWorkflow: (id: string, workflowId: string) => Promise<boolean>;

  // クエリ操作（ローカルキャッシュから取得）
  getScheduledChanges: () => ScheduledChange[];
  getPendingChanges: () => ScheduledChange[];
  getChangesByUser: (userId: string) => ScheduledChange[];
  getChangesByDate: (date: string) => ScheduledChange[];
  getChangesByType: (type: ScheduledChangeType) => ScheduledChange[];
  getUpcomingChanges: (daysAhead: number) => ScheduledChange[];
  getPendingApprovalChanges: () => ScheduledChange[];

  // 統計
  getStats: () => ScheduledChangesStats;

  // Hydration
  setHasHydrated: (state: boolean) => void;
}

// APIベースURL
const API_BASE = '/api/scheduled-changes';

export const useScheduledChangesStore = create<ScheduledChangesState>()((set, get) => ({
  changes: [],
  stats: null,
  isLoading: false,
  error: null,
  _hasHydrated: false,

  setHasHydrated: (state) => {
    set({ _hasHydrated: state });
  },

  // APIからデータを取得
  fetchChanges: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
      if (filters?.userId) params.append('userId', filters.userId);

      const url = `${API_BASE}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        set({
          changes: result.data,
          stats: result.stats,
          isLoading: false,
          _hasHydrated: true,
        });
      } else {
        set({ error: result.error, isLoading: false, _hasHydrated: true });
      }
    } catch (error) {
      console.error('Failed to fetch scheduled changes:', error);
      set({ error: 'データの取得に失敗しました', isLoading: false, _hasHydrated: true });
    }
  },

  // 予約を追加
  scheduleChange: async (change) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(change),
      });
      const result = await response.json();

      if (result.success) {
        // ローカルキャッシュを更新
        set((state) => ({
          changes: [...state.changes, result.data],
          isLoading: false,
        }));
        return result.data;
      } else {
        set({ error: result.error, isLoading: false });
        return null;
      }
    } catch (error) {
      console.error('Failed to create scheduled change:', error);
      set({ error: '予約の作成に失敗しました', isLoading: false });
      return null;
    }
  },

  // 予約を更新
  updateScheduledChange: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result = await response.json();

      if (result.success) {
        set((state) => ({
          changes: state.changes.map((change) =>
            change.id === id ? result.data : change
          ),
          isLoading: false,
        }));
        return true;
      } else {
        set({ error: result.error, isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('Failed to update scheduled change:', error);
      set({ error: '予約の更新に失敗しました', isLoading: false });
      return false;
    }
  },

  // 予約をキャンセル
  cancelScheduledChange: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();

      if (result.success) {
        set((state) => ({
          changes: state.changes.map((change) =>
            change.id === id
              ? { ...change, status: 'cancelled' as ScheduledChangeStatus, updatedAt: result.data.updatedAt }
              : change
          ),
          isLoading: false,
        }));
        return true;
      } else {
        set({ error: result.error, isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('Failed to cancel scheduled change:', error);
      set({ error: '予約のキャンセルに失敗しました', isLoading: false });
      return false;
    }
  },

  // 予約を即座に適用
  applyScheduledChange: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();

      if (result.success) {
        set((state) => ({
          changes: state.changes.map((change) =>
            change.id === id
              ? { ...change, status: 'applied' as ScheduledChangeStatus, updatedAt: result.data.updatedAt }
              : change
          ),
          isLoading: false,
        }));
        return true;
      } else {
        set({ error: result.error, isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('Failed to apply scheduled change:', error);
      set({ error: '予約の適用に失敗しました', isLoading: false });
      return false;
    }
  },

  // 予約を削除
  deleteScheduledChange: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        set((state) => ({
          changes: state.changes.filter((change) => change.id !== id),
          isLoading: false,
        }));
        return true;
      } else {
        set({ error: result.error, isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('Failed to delete scheduled change:', error);
      set({ error: '予約の削除に失敗しました', isLoading: false });
      return false;
    }
  },

  // 予約を承認
  approveScheduledChange: async (id, approverId, approverName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverId, approverName }),
      });
      const result = await response.json();

      if (result.success) {
        set((state) => ({
          changes: state.changes.map((change) =>
            change.id === id
              ? {
                  ...change,
                  approvalStatus: 'approved' as ApprovalStatus,
                  approvedBy: approverId,
                  approvedByName: approverName,
                  approvedAt: result.data.approvedAt,
                  updatedAt: result.data.updatedAt,
                }
              : change
          ),
          isLoading: false,
        }));
        return true;
      } else {
        set({ error: result.error, isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('Failed to approve scheduled change:', error);
      set({ error: '予約の承認に失敗しました', isLoading: false });
      return false;
    }
  },

  // 予約を却下
  rejectScheduledChange: async (id, rejectedBy, rejectedByName, reason) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectedBy, rejectedByName, reason }),
      });
      const result = await response.json();

      if (result.success) {
        set((state) => ({
          changes: state.changes.map((change) =>
            change.id === id
              ? {
                  ...change,
                  approvalStatus: 'rejected' as ApprovalStatus,
                  rejectionReason: reason,
                  updatedAt: result.data.updatedAt,
                }
              : change
          ),
          isLoading: false,
        }));
        return true;
      } else {
        set({ error: result.error, isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('Failed to reject scheduled change:', error);
      set({ error: '予約の却下に失敗しました', isLoading: false });
      return false;
    }
  },

  // ワークフローをリンク
  linkWorkflow: async (id, workflowId) => {
    return get().updateScheduledChange(id, { workflowId });
  },

  // 全予約を取得
  getScheduledChanges: () => {
    return get().changes;
  },

  // 未適用の予約のみ取得
  getPendingChanges: () => {
    return get().changes.filter((change) => change.status === 'pending');
  },

  // 特定ユーザーの予約を取得
  getChangesByUser: (userId) => {
    return get().changes.filter((change) => change.userId === userId);
  },

  // 特定日付の予約を取得
  getChangesByDate: (date) => {
    return get().changes.filter((change) => change.effectiveDate === date);
  },

  // タイプ別の予約を取得
  getChangesByType: (type) => {
    return get().changes.filter((change) => change.type === type);
  },

  // 近日中（指定日数以内）の予約を取得
  getUpcomingChanges: (daysAhead) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return get().changes.filter((change) => {
      if (change.status !== 'pending') return false;

      const effectiveDate = new Date(change.effectiveDate);
      effectiveDate.setHours(0, 0, 0, 0);

      return effectiveDate >= today && effectiveDate <= futureDate;
    });
  },

  // 承認待ちの予約を取得
  getPendingApprovalChanges: () => {
    return get().changes.filter(
      (change) => change.requiresApproval && change.approvalStatus === 'pending_approval'
    );
  },

  // 統計を取得
  getStats: () => {
    // APIから取得した統計があればそれを返す
    const cachedStats = get().stats;
    if (cachedStats) return cachedStats;

    // なければローカルから計算
    const changes = get().changes;
    return {
      total: changes.length,
      pending: changes.filter((c) => c.status === 'pending').length,
      applied: changes.filter((c) => c.status === 'applied').length,
      cancelled: changes.filter((c) => c.status === 'cancelled').length,
      byType: {
        hire: changes.filter((c) => c.type === 'hire').length,
        transfer: changes.filter((c) => c.type === 'transfer').length,
        retirement: changes.filter((c) => c.type === 'retirement').length,
      },
    };
  },
}));

// タイプ別のラベル
export const changeTypeLabels: Record<ScheduledChangeType, string> = {
  hire: '入社',
  transfer: '異動',
  retirement: '退職',
};

// ステータス別のラベル
export const changeStatusLabels: Record<ScheduledChangeStatus, string> = {
  pending: '予約中',
  applied: '適用済み',
  cancelled: 'キャンセル',
};

// 承認ステータス別のラベル
export const approvalStatusLabels: Record<ApprovalStatus, string> = {
  not_required: '承認不要',
  pending_approval: '承認待ち',
  approved: '承認済み',
  rejected: '却下',
};

// タイプ別のアイコンカラー
export const changeTypeColors: Record<ScheduledChangeType, string> = {
  hire: 'text-green-600 bg-green-50',
  transfer: 'text-blue-600 bg-blue-50',
  retirement: 'text-red-600 bg-red-50',
};
