'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ApprovalFlow,
  ApprovalCondition,
  CreateApprovalFlowRequest,
  UpdateApprovalFlowRequest,
  ApprovalFlowStats,
  DocumentType,
  ResolvedApprovalRoute,
  ResolvedApprovalStep,
} from '@/types/approval-flow';
import type { OrganizationMember } from '@/types';

/**
 * 承認フローストアの状態
 */
interface ApprovalFlowStore {
  // State
  flows: ApprovalFlow[];
  initialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions - CRUD (API連携)
  createFlow: (request: CreateApprovalFlowRequest) => Promise<string>;
  updateFlow: (request: UpdateApprovalFlowRequest) => Promise<void>;
  deleteFlow: (id: string) => Promise<void>;
  duplicateFlow: (id: string) => Promise<string>;

  // Actions - Query
  getFlowById: (id: string) => ApprovalFlow | undefined;
  getFlowsByDocumentType: (documentType: DocumentType) => ApprovalFlow[];
  getActiveFlows: () => ApprovalFlow[];
  getDefaultFlow: (documentType: DocumentType) => ApprovalFlow | undefined;

  // Actions - 条件判定
  findApplicableFlow: (
    documentType: DocumentType,
    data: Record<string, unknown>
  ) => ApprovalFlow | undefined;

  // Actions - 承認ルート解決
  resolveApprovalRoute: (
    flowId: string,
    requesterId: string,
    organizationMembers?: OrganizationMember[]
  ) => ResolvedApprovalRoute | null;

  // Actions - 統計
  getStats: () => ApprovalFlowStats;

  // Actions - 初期化・同期
  fetchFlows: () => Promise<void>;
  initialize: () => void;
  resetData: () => void;
}

/**
 * 条件判定ロジック
 */
const evaluateCondition = (
  condition: ApprovalCondition,
  data: Record<string, unknown>
): boolean => {
  const value = data[condition.field];

  if (value === undefined) return false;

  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  const conditionValue = typeof condition.value === 'number' ? condition.value : parseFloat(String(condition.value));
  if (isNaN(numValue) || isNaN(conditionValue)) return false;

  switch (condition.operator) {
    case 'gte':
      return numValue >= conditionValue;
    case 'lte':
      return numValue <= conditionValue;
    case 'gt':
      return numValue > conditionValue;
    case 'lt':
      return numValue < conditionValue;
    case 'eq':
      return numValue === conditionValue;
    case 'ne':
      return numValue !== conditionValue;
    default:
      return false;
  }
};

/**
 * 承認フローストア（API連携版）
 */
export const useApprovalFlowStore = create<ApprovalFlowStore>()(
  persist(
    (set, get) => ({
      flows: [],
      initialized: false,
      isLoading: false,
      error: null,

      // APIからフローを取得
      fetchFlows: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/approval-flows?tenantId=tenant-1');
          const result = await response.json();

          if (result.success) {
            set({ flows: result.data || [], initialized: true, isLoading: false });
          } else {
            set({ flows: [], initialized: true, isLoading: false, error: result.error || 'データの取得に失敗しました' });
          }
        } catch (error) {
          console.error('Error fetching approval flows:', error);
          set({ flows: [], initialized: true, isLoading: false, error: 'APIからの取得に失敗しました' });
        }
      },

      // CRUD - Create（API連携）
      createFlow: async (request) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/approval-flows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...request,
              tenantId: 'tenant-1',
            }),
          });
          const result = await response.json();

          if (result.success) {
            // 再取得して同期
            await get().fetchFlows();
            return result.data.id;
          } else {
            throw new Error(result.error || 'フローの作成に失敗しました');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'フローの作成に失敗しました';
          set({ error: errorMessage, isLoading: false });

          // フォールバック：ローカルでも作成
          const id = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const now = new Date().toISOString();
          const newFlow: ApprovalFlow = {
            ...request,
            id,
            createdBy: 'user',
            createdAt: now,
            updatedAt: now,
            companyId: 'tenant-1',
          };
          set((state) => ({
            flows: [...state.flows, newFlow],
            isLoading: false,
          }));
          return id;
        }
      },

      // CRUD - Update（API連携）
      updateFlow: async (request) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/approval-flows/${request.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          });
          const result = await response.json();

          if (result.success) {
            await get().fetchFlows();
          } else {
            throw new Error(result.error || 'フローの更新に失敗しました');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'フローの更新に失敗しました';
          set({ error: errorMessage, isLoading: false });

          // フォールバック：ローカルでも更新
          const now = new Date().toISOString();
          set((state) => ({
            flows: state.flows.map((flow) =>
              flow.id === request.id
                ? { ...flow, ...request, updatedAt: now }
                : flow
            ),
            isLoading: false,
          }));
        }
      },

      // CRUD - Delete（API連携）
      deleteFlow: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/approval-flows/${id}`, {
            method: 'DELETE',
          });
          const result = await response.json();

          if (result.success) {
            await get().fetchFlows();
          } else {
            throw new Error(result.error || 'フローの削除に失敗しました');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'フローの削除に失敗しました';
          set({ error: errorMessage, isLoading: false });

          // フォールバック：ローカルでも削除
          set((state) => ({
            flows: state.flows.filter((flow) => flow.id !== id),
            isLoading: false,
          }));
        }
      },

      // CRUD - Duplicate（API連携）
      duplicateFlow: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/approval-flows/${id}/duplicate`, {
            method: 'POST',
          });
          const result = await response.json();

          if (result.success) {
            await get().fetchFlows();
            return result.data.id;
          } else {
            throw new Error(result.error || 'フローの複製に失敗しました');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'フローの複製に失敗しました';
          set({ error: errorMessage, isLoading: false });

          // フォールバック：ローカルでも複製
          const originalFlow = get().flows.find((f) => f.id === id);
          if (!originalFlow) return '';

          const newId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const now = new Date().toISOString();

          const duplicatedFlow: ApprovalFlow = {
            ...originalFlow,
            id: newId,
            name: `${originalFlow.name} (コピー)`,
            isDefault: false,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            flows: [...state.flows, duplicatedFlow],
            isLoading: false,
          }));

          return newId;
        }
      },

      // Query - Get by ID
      getFlowById: (id) => {
        return get().flows.find((flow) => flow.id === id);
      },

      // Query - Get by Document Type
      getFlowsByDocumentType: (documentType) => {
        return get().flows.filter((flow) => flow.documentType === documentType);
      },

      // Query - Get Active Flows
      getActiveFlows: () => {
        return get().flows.filter((flow) => flow.isActive);
      },

      // Query - Get Default Flow
      getDefaultFlow: (documentType) => {
        return get().flows.find(
          (flow) => flow.documentType === documentType && flow.isDefault && flow.isActive
        );
      },

      // 条件判定 - 適用可能なフローを検索
      findApplicableFlow: (documentType, data) => {
        const flows = get()
          .flows.filter((flow) => flow.documentType === documentType && flow.isActive)
          .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        for (const flow of flows) {
          if (!flow.conditions || flow.conditions.length === 0) {
            if (flow.isDefault) return flow;
            continue;
          }

          const allConditionsMet = flow.conditions.every((condition) =>
            evaluateCondition(condition, data)
          );

          if (allConditionsMet) {
            return flow;
          }
        }

        return get().getDefaultFlow(documentType);
      },

      // 承認ルート解決
      resolveApprovalRoute: (flowId, requesterId, organizationMembers) => {
        const flow = get().getFlowById(flowId);
        if (!flow) return null;

        const steps: ResolvedApprovalStep[] = [];

        if (flow.type === 'organization' && flow.useOrganizationHierarchy) {
          const levels = flow.organizationLevels || 1;

          if (!organizationMembers || organizationMembers.length === 0) {
            for (let i = 1; i <= levels; i++) {
              steps.push({
                stepNumber: i,
                name: `レベル${i}承認`,
                mode: 'serial',
                approvers: [],
                requiredApprovals: 1,
                timeoutHours: 48,
                allowDelegate: true,
                allowSkip: false,
              });
            }
          } else {
            const requester = organizationMembers.find((m) => m.id === requesterId);
            if (!requester) {
              for (let i = 1; i <= levels; i++) {
                steps.push({
                  stepNumber: i,
                  name: `レベル${i}承認`,
                  mode: 'serial',
                  approvers: [],
                  requiredApprovals: 1,
                  timeoutHours: 48,
                  allowDelegate: true,
                  allowSkip: false,
                });
              }
            } else {
              let currentMember: OrganizationMember & { managerId?: string } = requester as OrganizationMember & { managerId?: string };
              for (let i = 1; i <= levels; i++) {
                const manager = organizationMembers.find((m) => m.id === currentMember.managerId);

                if (manager) {
                  steps.push({
                    stepNumber: i,
                    name: i === 1 ? '直属上司承認' : `${i}階層上承認`,
                    mode: 'serial',
                    approvers: [{
                      id: manager.id,
                      name: manager.name,
                      email: manager.email,
                      role: manager.role,
                      department: '',
                      position: manager.position,
                      order: 1,
                    }],
                    requiredApprovals: 1,
                    timeoutHours: 48,
                    allowDelegate: true,
                    allowSkip: false,
                  });
                  currentMember = manager as OrganizationMember & { managerId?: string };
                } else {
                  break;
                }
              }
            }
          }
        } else if (flow.type === 'custom' && flow.steps) {
          flow.steps.forEach((step) => {
            steps.push({
              stepNumber: step.stepNumber,
              name: step.name,
              mode: step.mode,
              approvers: step.approvers,
              requiredApprovals: step.requiredApprovals || 1,
              timeoutHours: step.timeoutHours || 48,
              allowDelegate: step.allowDelegate || false,
              allowSkip: step.allowSkip || false,
            });
          });
        }

        return {
          flowId: flow.id,
          flowName: flow.name,
          steps,
        };
      },

      // 統計
      getStats: () => {
        const flows = get().flows;
        const stats: ApprovalFlowStats = {
          totalFlows: flows.length,
          organizationFlows: flows.filter((f) => f.type === 'organization').length,
          customFlows: flows.filter((f) => f.type === 'custom').length,
          activeFlows: flows.filter((f) => f.isActive).length,
          inactiveFlows: flows.filter((f) => !f.isActive).length,
          flowsByDocumentType: {
            leave_request: 0,
            overtime_request: 0,
            expense_claim: 0,
            business_trip: 0,
            purchase_request: 0,
          },
        };

        flows.forEach((flow) => {
          stats.flowsByDocumentType[flow.documentType]++;
        });

        return stats;
      },

      // 初期化（APIからフローを取得）
      initialize: () => {
        const state = get();

        if (state.initialized && state.flows.length > 0) {
          return;
        }

        // APIから取得
        get().fetchFlows();
      },

      resetData: () => {
        set({ flows: [], initialized: false });
        setTimeout(() => {
          get().fetchFlows();
        }, 100);
      },
    }),
    {
      name: 'approval-flow-storage',
      skipHydration: true,
    }
  )
);
