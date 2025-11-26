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
  initializeDemoData: () => void;
  resetData: () => void;
}

/**
 * デモデータ生成（APIからデータがない場合のフォールバック）
 */
const generateDemoFlows = (): ApprovalFlow[] => {
  const now = new Date().toISOString();
  const companyId = 'tenant-demo-001';
  const createdBy = 'system';

  return [
    // 1. 休暇申請 - 組織連動型（デフォルト）
    {
      id: 'flow_leave_default',
      name: '標準休暇承認フロー（組織連動）',
      description: '組織階層に基づく休暇承認。直属上司→部長の順で承認',
      type: 'organization',
      documentType: 'leave_request',
      useOrganizationHierarchy: true,
      organizationLevels: 2,
      conditions: [],
      isActive: true,
      isDefault: true,
      priority: 1,
      createdBy,
      createdAt: now,
      updatedAt: now,
      companyId,
    },
    // 2. 休暇申請 - 長期休暇用（5日以上）
    {
      id: 'flow_leave_long',
      name: '長期休暇承認フロー（5日以上）',
      description: '5日以上の休暇申請は人事部長の承認も必要',
      type: 'organization',
      documentType: 'leave_request',
      useOrganizationHierarchy: true,
      organizationLevels: 3,
      conditions: [
        {
          id: 'cond_leave_long',
          field: 'days',
          operator: 'gte',
          value: 5,
          description: '5日以上の休暇',
        },
      ],
      isActive: true,
      isDefault: false,
      priority: 10,
      createdBy,
      createdAt: now,
      updatedAt: now,
      companyId,
    },
    // 3. 経費申請 - 組織連動型（デフォルト）
    {
      id: 'flow_expense_default',
      name: '標準経費承認フロー（組織連動）',
      description: '組織階層に基づく経費承認。直属上司→部長の順で承認',
      type: 'organization',
      documentType: 'expense_claim',
      useOrganizationHierarchy: true,
      organizationLevels: 2,
      conditions: [],
      isActive: true,
      isDefault: true,
      priority: 1,
      createdBy,
      createdAt: now,
      updatedAt: now,
      companyId,
    },
    // 4. 経費申請 - 高額用（10万円以上）
    {
      id: 'flow_expense_high',
      name: '高額経費承認フロー（10万円以上）',
      description: '10万円以上の経費は経理部長の承認も必要',
      type: 'custom',
      documentType: 'expense_claim',
      steps: [
        {
          id: 'step_expense_1',
          stepNumber: 1,
          name: '直属上司承認',
          mode: 'serial',
          approvers: [],
          requiredApprovals: 1,
          timeoutHours: 48,
          allowDelegate: true,
          allowSkip: false,
        },
        {
          id: 'step_expense_2',
          stepNumber: 2,
          name: '部長承認',
          mode: 'serial',
          approvers: [],
          requiredApprovals: 1,
          timeoutHours: 48,
          allowDelegate: true,
          allowSkip: false,
        },
        {
          id: 'step_expense_3',
          stepNumber: 3,
          name: '経理部長承認',
          mode: 'serial',
          approvers: [],
          requiredApprovals: 1,
          timeoutHours: 72,
          allowDelegate: false,
          allowSkip: false,
        },
      ],
      conditions: [
        {
          id: 'cond_expense_high',
          field: 'amount',
          operator: 'gte',
          value: 100000,
          description: '10万円以上の経費',
        },
      ],
      isActive: true,
      isDefault: false,
      priority: 10,
      createdBy,
      createdAt: now,
      updatedAt: now,
      companyId,
    },
    // 5. 残業申請 - 組織連動型（デフォルト）
    {
      id: 'flow_overtime_default',
      name: '標準残業承認フロー（組織連動）',
      description: '組織階層に基づく残業承認。直属上司の承認が必要',
      type: 'organization',
      documentType: 'overtime_request',
      useOrganizationHierarchy: true,
      organizationLevels: 1,
      conditions: [],
      isActive: true,
      isDefault: true,
      priority: 1,
      createdBy,
      createdAt: now,
      updatedAt: now,
      companyId,
    },
    // 6. 出張申請 - 組織連動型（デフォルト）
    {
      id: 'flow_trip_default',
      name: '標準出張承認フロー（組織連動）',
      description: '組織階層に基づく出張承認。直属上司→部長の順で承認',
      type: 'organization',
      documentType: 'business_trip',
      useOrganizationHierarchy: true,
      organizationLevels: 2,
      conditions: [],
      isActive: true,
      isDefault: true,
      priority: 1,
      createdBy,
      createdAt: now,
      updatedAt: now,
      companyId,
    },
    // 7. 購買申請 - カスタム型
    {
      id: 'flow_purchase_default',
      name: '標準購買承認フロー（カスタム）',
      description: '資産責任者と経理部長の承認が必要',
      type: 'custom',
      documentType: 'purchase_request',
      steps: [
        {
          id: 'step_purchase_1',
          stepNumber: 1,
          name: '資産責任者承認',
          mode: 'serial',
          approvers: [],
          requiredApprovals: 1,
          timeoutHours: 24,
          allowDelegate: true,
          allowSkip: false,
        },
        {
          id: 'step_purchase_2',
          stepNumber: 2,
          name: '経理部長承認',
          mode: 'serial',
          approvers: [],
          requiredApprovals: 1,
          timeoutHours: 48,
          allowDelegate: false,
          allowSkip: false,
        },
      ],
      conditions: [],
      isActive: true,
      isDefault: true,
      priority: 1,
      createdBy,
      createdAt: now,
      updatedAt: now,
      companyId,
    },
  ];
};

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
  if (isNaN(numValue)) return false;

  switch (condition.operator) {
    case 'gte':
      return numValue >= condition.value;
    case 'lte':
      return numValue <= condition.value;
    case 'gt':
      return numValue > condition.value;
    case 'lt':
      return numValue < condition.value;
    case 'eq':
      return numValue === condition.value;
    case 'ne':
      return numValue !== condition.value;
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
          const response = await fetch('/api/approval-flows?tenantId=tenant-demo-001');
          const result = await response.json();

          if (result.success && result.data.length > 0) {
            set({ flows: result.data, initialized: true, isLoading: false });
          } else {
            // APIにデータがない場合はデモデータを使用
            const demoFlows = generateDemoFlows();
            set({ flows: demoFlows, initialized: true, isLoading: false });
          }
        } catch (error) {
          console.error('Error fetching approval flows:', error);
          // エラー時はローカルのデモデータを使用
          const demoFlows = generateDemoFlows();
          set({ flows: demoFlows, initialized: true, isLoading: false, error: 'APIからの取得に失敗しました' });
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
              tenantId: 'tenant-demo-001',
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
            companyId: 'tenant-demo-001',
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
              // @ts-expect-error - managerId is dynamically added
              let currentMember: OrganizationMember & { managerId?: string } = requester;
              for (let i = 1; i <= levels; i++) {
                // @ts-expect-error - managerId is dynamically added
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
                  // @ts-expect-error - managerId is dynamically added
                  currentMember = manager;
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

      // 初期化（APIから取得を試み、失敗時はデモデータ）
      initializeDemoData: () => {
        const state = get();

        if (state.initialized && state.flows.length > 0) {
          console.log('Approval flows already initialized');
          return;
        }

        // APIから取得を試みる
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
    }
  )
);
