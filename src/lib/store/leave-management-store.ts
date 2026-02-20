import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type LeaveType = 'paid' | 'sick' | 'special' | 'compensatory' | 'half_day_am' | 'half_day_pm';
export type LeaveStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';

// REST API helper functions
const API_BASE = '/api/leave';

// CookieからテナントIDを取得（ミドルウェアで設定される x-tenant-id を使用）
const getTenantId = (): string => {
  if (typeof document === 'undefined') return 'tenant-1'; // SSR時のフォールバック
  const match = document.cookie.match(/x-tenant-id=([^;]+)/);
  return match ? match[1] : 'tenant-1';
};

async function apiFetchLeaveRequests(userId?: string, status?: string) {
  const params = new URLSearchParams({ tenantId: getTenantId() });
  if (userId) params.set('userId', userId);
  if (status) params.set('status', status);

  const response = await fetch(`${API_BASE}/requests?${params}`);
  if (!response.ok) {
    throw new Error('休暇申請の取得に失敗しました');
  }
  const result = await response.json();
  return result.data || [];
}

async function apiCreateLeaveRequest(request: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...request, tenantId: getTenantId() }),
  });
  if (!response.ok) {
    throw new Error('休暇申請の作成に失敗しました');
  }
  const result = await response.json();
  return result.data;
}

async function apiUpdateLeaveRequest(id: string, data: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/requests/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('休暇申請の更新に失敗しました');
  }
  const result = await response.json();
  return result.data;
}

async function apiDeleteLeaveRequest(id: string) {
  const response = await fetch(`${API_BASE}/requests/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('休暇申請の削除に失敗しました');
  }
  return true;
}

async function apiApproveLeaveRequest(id: string, approver: string) {
  const response = await fetch(`${API_BASE}/requests/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approver }),
  });
  if (!response.ok) {
    throw new Error('休暇申請の承認に失敗しました');
  }
  const result = await response.json();
  return result.data;
}

async function apiRejectLeaveRequest(id: string, approver: string, reason: string) {
  const response = await fetch(`${API_BASE}/requests/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approver, reason }),
  });
  if (!response.ok) {
    throw new Error('休暇申請の却下に失敗しました');
  }
  const result = await response.json();
  return result.data;
}

async function apiFetchLeaveBalances(userId?: string, year?: number) {
  const params = new URLSearchParams({ tenantId: getTenantId() });
  if (userId) params.set('userId', userId);
  if (year) params.set('year', String(year));

  const response = await fetch(`${API_BASE}/balances?${params}`);
  if (!response.ok) {
    throw new Error('休暇残数の取得に失敗しました');
  }
  const result = await response.json();
  return result.data || [];
}

async function apiCreateLeaveBalance(data: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/balances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, tenantId: getTenantId() }),
  });
  if (!response.ok) {
    throw new Error('休暇残数の作成に失敗しました');
  }
  const result = await response.json();
  return result.data;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  approver?: string;
  approvedDate?: string;
  rejectedReason?: string;
  attachments?: UploadedFile[];
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  userId: string;
  year: number;
  paidLeave: {
    total: number;
    used: number;
    remaining: number;
    expiry: string; // 有効期限
  };
  sickLeave: {
    total: number;
    used: number;
    remaining: number;
  };
  specialLeave: {
    total: number;
    used: number;
    remaining: number;
  };
  compensatoryLeave: {
    total: number;
    used: number;
    remaining: number;
  };
}

interface LeaveManagementState {
  requests: LeaveRequest[];
  balances: Map<string, LeaveBalance>;
  isLoading: boolean;
  error: string | null;
}

interface LeaveManagementActions {
  // APIから休暇申請を取得
  fetchRequests: (userId?: string, status?: string) => Promise<void>;

  // APIから休暇残数を取得
  fetchBalances: (userId?: string, year?: number) => Promise<void>;

  // 休暇申請の作成（同期でローカル更新、バックグラウンドでAPI呼び出し）
  createLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>) => string;

  // 休暇申請の更新（同期でローカル更新、バックグラウンドでAPI呼び出し）
  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => void;

  // 休暇申請の承認（同期でローカル更新、バックグラウンドでAPI呼び出し）
  approveLeaveRequest: (id: string, approver: string) => void;

  // 休暇申請の却下（同期でローカル更新、バックグラウンドでAPI呼び出し）
  rejectLeaveRequest: (id: string, approver: string, reason: string) => void;

  // 休暇申請のキャンセル（同期でローカル更新、バックグラウンドでAPI呼び出し）
  cancelLeaveRequest: (id: string) => void;

  // ユーザーの休暇申請一覧取得
  getUserRequests: (userId: string) => LeaveRequest[];

  // 承認待ちの申請一覧取得
  getPendingRequests: () => LeaveRequest[];

  // 期間指定での申請取得
  getRequestsByPeriod: (startDate: string, endDate: string) => LeaveRequest[];

  // 休暇残数の取得
  getLeaveBalance: (userId: string, year?: number) => LeaveBalance | undefined;

  // 休暇残数の初期化
  initializeLeaveBalance: (userId: string, year: number, paidLeaveDays?: number) => void;

  // 休暇使用の更新
  updateLeaveUsage: (userId: string, type: LeaveType, days: number) => void;

  // 休暇残数のリセット（年度更新）
  resetYearlyBalance: (userId: string, year: number) => void;

  // 申請削除
  deleteRequest: (id: string) => void;

  // 全データクリア
  clearAll: () => void;
}

type LeaveManagementStore = LeaveManagementState & LeaveManagementActions;

// APIレスポンスをLeaveBalance形式に変換
function convertApiBalanceToStore(apiBalance: Record<string, unknown>): LeaveBalance {
  return {
    userId: apiBalance.userId as string,
    year: apiBalance.year as number,
    paidLeave: {
      total: apiBalance.paidLeaveTotal as number,
      used: apiBalance.paidLeaveUsed as number,
      remaining: apiBalance.paidLeaveRemaining as number,
      expiry: apiBalance.paidLeaveExpiry as string,
    },
    sickLeave: {
      total: apiBalance.sickLeaveTotal as number,
      used: apiBalance.sickLeaveUsed as number,
      remaining: apiBalance.sickLeaveRemaining as number,
    },
    specialLeave: {
      total: apiBalance.specialLeaveTotal as number,
      used: apiBalance.specialLeaveUsed as number,
      remaining: apiBalance.specialLeaveRemaining as number,
    },
    compensatoryLeave: {
      total: apiBalance.compensatoryLeaveTotal as number,
      used: apiBalance.compensatoryLeaveUsed as number,
      remaining: apiBalance.compensatoryLeaveRemaining as number,
    },
  };
}

export const useLeaveManagementStore = create<LeaveManagementStore>()(
  persist(
    (set, get) => ({
      requests: [],
      balances: new Map(),
      isLoading: false,
      error: null,

      fetchRequests: async (userId, status) => {
        set({ isLoading: true, error: null });
        try {
          const requests = await apiFetchLeaveRequests(userId, status);
          set({ requests, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '休暇申請の取得に失敗しました';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      fetchBalances: async (userId, year) => {
        set({ isLoading: true, error: null });
        try {
          const apiBalances = await apiFetchLeaveBalances(userId, year);
          const newBalances = new Map<string, LeaveBalance>();

          for (const apiBalance of apiBalances) {
            const key = `${apiBalance.userId}-${apiBalance.year}`;
            newBalances.set(key, convertApiBalanceToStore(apiBalance));
          }

          set({ balances: newBalances, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '休暇残数の取得に失敗しました';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      createLeaveRequest: (request) => {
        const now = new Date().toISOString();
        const id = `leave-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newRequest: LeaveRequest = {
          id,
          userId: request.userId,
          userName: request.userName,
          type: request.type,
          startDate: request.startDate,
          endDate: request.endDate,
          days: request.days,
          reason: request.reason,
          status: request.status || 'pending',
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          requests: [...state.requests, newRequest],
        }));

        // 承認済みの場合は残数を更新
        if (request.status === 'approved') {
          get().updateLeaveUsage(request.userId, request.type, request.days);
        }

        // バックグラウンドでAPIを呼び出し
        apiCreateLeaveRequest({
          userId: request.userId,
          userName: request.userName,
          type: request.type,
          startDate: request.startDate,
          endDate: request.endDate,
          days: request.days,
          reason: request.reason,
          status: request.status || 'pending',
        }).catch((error) => {
          console.error('Failed to sync leave request to API:', error);
        });

        return id;
      },

      updateLeaveRequest: (id, updates) => {
        const now = new Date().toISOString();

        set((state) => ({
          requests: state.requests.map(req =>
            req.id === id ? { ...req, ...updates, updatedAt: now } : req
          ),
        }));

        // バックグラウンドでAPIを呼び出し
        apiUpdateLeaveRequest(id, updates).catch((error) => {
          console.error('Failed to sync leave request update to API:', error);
        });
      },

      approveLeaveRequest: (id, approver) => {
        const now = new Date().toISOString();
        const request = get().requests.find(r => r.id === id);

        set((state) => ({
          requests: state.requests.map(req =>
            req.id === id
              ? { ...req, status: 'approved' as LeaveStatus, approver, approvedDate: now, updatedAt: now }
              : req
          ),
        }));

        // 休暇残数を更新
        if (request) {
          get().updateLeaveUsage(request.userId, request.type, request.days);
        }

        // バックグラウンドでAPIを呼び出し
        apiApproveLeaveRequest(id, approver).catch((error) => {
          console.error('Failed to sync leave approval to API:', error);
        });
      },

      rejectLeaveRequest: (id, approver, reason) => {
        const now = new Date().toISOString();

        set((state) => ({
          requests: state.requests.map(req =>
            req.id === id
              ? { ...req, status: 'rejected' as LeaveStatus, approver, rejectionReason: reason, updatedAt: now }
              : req
          ),
        }));

        // バックグラウンドでAPIを呼び出し
        apiRejectLeaveRequest(id, approver, reason).catch((error) => {
          console.error('Failed to sync leave rejection to API:', error);
        });
      },

      cancelLeaveRequest: (id) => {
        const now = new Date().toISOString();
        const request = get().requests.find(r => r.id === id);

        set((state) => ({
          requests: state.requests.map(req =>
            req.id === id
              ? { ...req, status: 'cancelled' as LeaveStatus, updatedAt: now }
              : req
          ),
        }));

        // 承認済みの場合は休暇残数を戻す
        if (request && request.status === 'approved') {
          get().updateLeaveUsage(request.userId, request.type, -request.days);
        }

        // バックグラウンドでAPIを呼び出し
        apiUpdateLeaveRequest(id, { status: 'cancelled' }).catch((error) => {
          console.error('Failed to sync leave cancellation to API:', error);
        });
      },

      getUserRequests: (userId) => {
        return get().requests
          .filter(r => r.userId === userId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },

      getPendingRequests: () => {
        return get().requests
          .filter(r => r.status === 'pending')
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      },

      getRequestsByPeriod: (startDate, endDate) => {
        return get().requests
          .filter(r =>
            r.startDate >= startDate &&
            r.startDate <= endDate
          )
          .sort((a, b) => a.startDate.localeCompare(b.startDate));
      },

      getLeaveBalance: (userId, year) => {
        const targetYear = year || new Date().getFullYear();
        const key = `${userId}-${targetYear}`;
        return get().balances.get(key);
      },

      initializeLeaveBalance: (userId, year, paidLeaveDays = 20) => {
        const expiryDate = new Date(year + 2, 2, 31).toISOString().split('T')[0]; // 2年後の3月末
        const key = `${userId}-${year}`;

        const balance: LeaveBalance = {
          userId,
          year,
          paidLeave: {
            total: paidLeaveDays,
            used: 0,
            remaining: paidLeaveDays,
            expiry: expiryDate,
          },
          sickLeave: { total: 5, used: 0, remaining: 5 },
          specialLeave: { total: 5, used: 0, remaining: 5 },
          compensatoryLeave: { total: 0, used: 0, remaining: 0 },
        };

        set((state) => {
          const newBalances = new Map(state.balances);
          newBalances.set(key, balance);
          return { balances: newBalances };
        });

        // バックグラウンドでAPIを呼び出し
        apiCreateLeaveBalance({
          userId,
          year,
          paidLeaveTotal: paidLeaveDays,
          paidLeaveExpiry: expiryDate,
          sickLeaveTotal: 5,
          specialLeaveTotal: 5,
          compensatoryLeaveTotal: 0,
        }).catch((error) => {
          console.error('Failed to sync leave balance to API:', error);
        });
      },

      updateLeaveUsage: (userId, type, days) => {
        const year = new Date().getFullYear();
        const key = `${userId}-${year}`;

        set((state) => {
          const balance = state.balances.get(key);
          if (!balance) {
            return state;
          }

          const newBalance = { ...balance };

          switch (type) {
            case 'paid':
            case 'half_day_am':
            case 'half_day_pm':
              newBalance.paidLeave.used += days;
              newBalance.paidLeave.remaining = newBalance.paidLeave.total - newBalance.paidLeave.used;
              break;
            case 'sick':
              newBalance.sickLeave.used += days;
              newBalance.sickLeave.remaining = newBalance.sickLeave.total - newBalance.sickLeave.used;
              break;
            case 'special':
              newBalance.specialLeave.used += days;
              newBalance.specialLeave.remaining = newBalance.specialLeave.total - newBalance.specialLeave.used;
              break;
            case 'compensatory':
              newBalance.compensatoryLeave.used += days;
              newBalance.compensatoryLeave.remaining = newBalance.compensatoryLeave.total - newBalance.compensatoryLeave.used;
              break;
          }

          const newBalances = new Map(state.balances);
          newBalances.set(key, newBalance);
          return { balances: newBalances };
        });
      },

      resetYearlyBalance: (userId, year) => {
        const prevYear = year - 1;
        const prevKey = `${userId}-${prevYear}`;
        const prevBalance = get().balances.get(prevKey);

        // 前年度の有給残を繰り越し（最大40日まで）
        const carryOver = prevBalance ? Math.min(prevBalance.paidLeave.remaining, 20) : 0;
        const newPaidDays = 20 + carryOver; // 新規付与分 + 繰越分

        get().initializeLeaveBalance(userId, year, newPaidDays);
      },

      deleteRequest: (id) => {
        const request = get().requests.find(r => r.id === id);

        set((state) => ({
          requests: state.requests.filter(r => r.id !== id),
        }));

        // 承認済みの場合は休暇残数を戻す
        if (request && request.status === 'approved') {
          get().updateLeaveUsage(request.userId, request.type, -request.days);
        }

        // バックグラウンドでAPIを呼び出し
        apiDeleteLeaveRequest(id).catch((error) => {
          console.error('Failed to sync leave request deletion to API:', error);
        });
      },

      clearAll: () => {
        set({ requests: [], balances: new Map() });
      },
    }),
    {
      name: 'leave-management-store',
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        requests: state.requests,
        // Mapをオブジェクトに変換して保存
        balances: Object.fromEntries(state.balances),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.balances) {
          // オブジェクトをMapに変換
          state.balances = new Map(Object.entries(state.balances as unknown as Record<string, LeaveBalance>));
        }
      },
    }
  )
);
