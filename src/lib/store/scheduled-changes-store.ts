import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface ScheduledChangesState {
  changes: ScheduledChange[];

  // CRUD操作
  scheduleChange: (change: Omit<ScheduledChange, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'approvalStatus'>) => void;
  updateScheduledChange: (id: string, updates: Partial<ScheduledChange>) => void;
  cancelScheduledChange: (id: string) => void;
  applyScheduledChange: (id: string) => void;
  deleteScheduledChange: (id: string) => void;

  // 承認フロー操作
  approveScheduledChange: (id: string, approverId: string, approverName: string) => void;
  rejectScheduledChange: (id: string, reason: string) => void;
  linkWorkflow: (id: string, workflowId: string) => void;

  // クエリ操作
  getScheduledChanges: () => ScheduledChange[];
  getPendingChanges: () => ScheduledChange[];
  getChangesByUser: (userId: string) => ScheduledChange[];
  getChangesByDate: (date: string) => ScheduledChange[];
  getChangesByType: (type: ScheduledChangeType) => ScheduledChange[];
  getUpcomingChanges: (daysAhead: number) => ScheduledChange[];
  getPendingApprovalChanges: () => ScheduledChange[];

  // 統計
  getStats: () => {
    total: number;
    pending: number;
    applied: number;
    cancelled: number;
    byType: Record<ScheduledChangeType, number>;
  };
}

export const useScheduledChangesStore = create<ScheduledChangesState>()(
  persist(
    (set, get) => ({
      changes: [],

      // 予約を追加
      scheduleChange: (change) => {
        const newChange: ScheduledChange = {
          ...change,
          id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending',
          approvalStatus: change.requiresApproval ? 'pending_approval' : 'not_required',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          changes: [...state.changes, newChange],
        }));
      },

      // 予約を更新
      updateScheduledChange: (id, updates) => {
        set((state) => ({
          changes: state.changes.map((change) =>
            change.id === id
              ? {
                  ...change,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : change
          ),
        }));
      },

      // 予約をキャンセル
      cancelScheduledChange: (id) => {
        set((state) => ({
          changes: state.changes.map((change) =>
            change.id === id
              ? {
                  ...change,
                  status: 'cancelled' as ScheduledChangeStatus,
                  updatedAt: new Date().toISOString(),
                }
              : change
          ),
        }));
      },

      // 予約を即座に適用
      applyScheduledChange: (id) => {
        set((state) => ({
          changes: state.changes.map((change) =>
            change.id === id
              ? {
                  ...change,
                  status: 'applied' as ScheduledChangeStatus,
                  updatedAt: new Date().toISOString(),
                }
              : change
          ),
        }));
      },

      // 予約を削除
      deleteScheduledChange: (id) => {
        set((state) => ({
          changes: state.changes.filter((change) => change.id !== id),
        }));
      },

      // 予約を承認
      approveScheduledChange: (id, approverId, approverName) => {
        set((state) => ({
          changes: state.changes.map((change) =>
            change.id === id
              ? {
                  ...change,
                  approvalStatus: 'approved' as ApprovalStatus,
                  approvedBy: approverId,
                  approvedByName: approverName,
                  approvedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : change
          ),
        }));
      },

      // 予約を却下
      rejectScheduledChange: (id, reason) => {
        set((state) => ({
          changes: state.changes.map((change) =>
            change.id === id
              ? {
                  ...change,
                  approvalStatus: 'rejected' as ApprovalStatus,
                  rejectionReason: reason,
                  status: 'cancelled' as ScheduledChangeStatus,
                  updatedAt: new Date().toISOString(),
                }
              : change
          ),
        }));
      },

      // ワークフローをリンク
      linkWorkflow: (id, workflowId) => {
        set((state) => ({
          changes: state.changes.map((change) =>
            change.id === id
              ? {
                  ...change,
                  workflowId,
                  updatedAt: new Date().toISOString(),
                }
              : change
          ),
        }));
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
        const changes = get().changes;
        const stats = {
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
        return stats;
      },
    }),
    {
      name: 'scheduled-changes-storage',
    }
  )
);

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
