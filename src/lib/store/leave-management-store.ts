import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type LeaveType = 'paid' | 'sick' | 'special' | 'compensatory' | 'half_day_am' | 'half_day_pm';
export type LeaveStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';

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
}

interface LeaveManagementActions {
  // 休暇申請の作成
  createLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>) => string;

  // 休暇申請の更新
  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => void;

  // 休暇申請の承認
  approveLeaveRequest: (id: string, approver: string) => void;

  // 休暇申請の却下
  rejectLeaveRequest: (id: string, approver: string, reason: string) => void;

  // 休暇申請のキャンセル
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

// デフォルトの年次有給休暇日数を計算
const calculateDefaultPaidLeaveDays = (hireDate: string): number => {
  const now = new Date();
  const hire = new Date(hireDate);
  const yearsOfService = Math.floor((now.getTime() - hire.getTime()) / (365 * 24 * 60 * 60 * 1000));

  // 日本の労働基準法に基づく有給休暇付与日数
  const paidLeaveDays = [
    10, // 0.5年
    11, // 1.5年
    12, // 2.5年
    14, // 3.5年
    16, // 4.5年
    18, // 5.5年
    20, // 6.5年以上
  ];

  if (yearsOfService < 0.5) return 0;
  if (yearsOfService >= 6.5) return 20;

  const index = Math.floor(yearsOfService - 0.5);
  return paidLeaveDays[index] || 20;
};

export const useLeaveManagementStore = create<LeaveManagementStore>()(
  persist(
    (set, get) => ({
      requests: [],
      balances: new Map(),

      createLeaveRequest: (request) => {
        const now = new Date().toISOString();
        const id = `leave-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newRequest: LeaveRequest = {
          ...request,
          id,
          status: request.status || 'pending',
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          requests: [...state.requests, newRequest],
        }));

        // 承認済みの場合は休暇残数を更新
        if (newRequest.status === 'approved') {
          get().updateLeaveUsage(newRequest.userId, newRequest.type, newRequest.days);
        }

        return id;
      },

      updateLeaveRequest: (id, updates) => {
        const now = new Date().toISOString();

        set((state) => ({
          requests: state.requests.map(req =>
            req.id === id
              ? { ...req, ...updates, updatedAt: now }
              : req
          ),
        }));
      },

      approveLeaveRequest: (id, approver) => {
        const now = new Date().toISOString();

        set((state) => {
          const request = state.requests.find(r => r.id === id);
          if (!request) return state;

          // 休暇残数を更新
          get().updateLeaveUsage(request.userId, request.type, request.days);

          return {
            requests: state.requests.map(req =>
              req.id === id
                ? {
                    ...req,
                    status: 'approved' as LeaveStatus,
                    approver,
                    approvedDate: now,
                    updatedAt: now,
                  }
                : req
            ),
          };
        });
      },

      rejectLeaveRequest: (id, approver, reason) => {
        const now = new Date().toISOString();

        set((state) => ({
          requests: state.requests.map(req =>
            req.id === id
              ? {
                  ...req,
                  status: 'rejected' as LeaveStatus,
                  approver,
                  rejectedReason: reason,
                  updatedAt: now,
                }
              : req
          ),
        }));
      },

      cancelLeaveRequest: (id) => {
        const now = new Date().toISOString();

        set((state) => {
          const request = state.requests.find(r => r.id === id);
          if (!request) return state;

          // 承認済みの場合は休暇残数を戻す
          if (request.status === 'approved') {
            get().updateLeaveUsage(request.userId, request.type, -request.days);
          }

          return {
            requests: state.requests.map(req =>
              req.id === id
                ? {
                    ...req,
                    status: 'cancelled' as LeaveStatus,
                    updatedAt: now,
                  }
                : req
            ),
          };
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
        const key = `${userId}-${year}`;
        const expiryDate = new Date(year + 2, 2, 31).toISOString().split('T')[0]; // 2年後の3月末

        const balance: LeaveBalance = {
          userId,
          year,
          paidLeave: {
            total: paidLeaveDays,
            used: 0,
            remaining: paidLeaveDays,
            expiry: expiryDate,
          },
          sickLeave: {
            total: 5,
            used: 0,
            remaining: 5,
          },
          specialLeave: {
            total: 5,
            used: 0,
            remaining: 5,
          },
          compensatoryLeave: {
            total: 0,
            used: 0,
            remaining: 0,
          },
        };

        set((state) => {
          const newBalances = new Map(state.balances);
          newBalances.set(key, balance);
          return { balances: newBalances };
        });
      },

      updateLeaveUsage: (userId, type, days) => {
        const year = new Date().getFullYear();
        const key = `${userId}-${year}`;

        set((state) => {
          const balance = state.balances.get(key);
          if (!balance) {
            // 残数が初期化されていない場合は初期化
            get().initializeLeaveBalance(userId, year);
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
        set((state) => {
          const request = state.requests.find(r => r.id === id);
          if (request && request.status === 'approved') {
            // 承認済みの場合は休暇残数を戻す
            get().updateLeaveUsage(request.userId, request.type, -request.days);
          }

          return {
            requests: state.requests.filter(r => r.id !== id),
          };
        });
      },

      clearAll: () => {
        set({ requests: [], balances: new Map() });
      },
    }),
    {
      name: 'leave-management-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        requests: state.requests,
        // Mapをオブジェクトに変換して保存
        balances: Object.fromEntries(state.balances),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.balances) {
          // オブジェクトをMapに変換
          state.balances = new Map(Object.entries(state.balances as any));
        }
      },
    }
  )
);