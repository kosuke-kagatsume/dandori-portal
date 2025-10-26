'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ApprovalFlow,
  ApprovalStep,
  Approver,
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

  // Actions - CRUD
  createFlow: (request: CreateApprovalFlowRequest) => string;
  updateFlow: (request: UpdateApprovalFlowRequest) => void;
  deleteFlow: (id: string) => void;
  duplicateFlow: (id: string) => string;

  // Actions - Query
  getFlowById: (id: string) => ApprovalFlow | undefined;
  getFlowsByDocumentType: (documentType: DocumentType) => ApprovalFlow[];
  getActiveFlows: () => ApprovalFlow[];
  getDefaultFlow: (documentType: DocumentType) => ApprovalFlow | undefined;

  // Actions - 条件判定
  findApplicableFlow: (
    documentType: DocumentType,
    data: Record<string, any>
  ) => ApprovalFlow | undefined;

  // Actions - 承認ルート解決
  resolveApprovalRoute: (
    flowId: string,
    requesterId: string,
    organizationMembers?: OrganizationMember[]
  ) => ResolvedApprovalRoute | null;

  // Actions - 統計
  getStats: () => ApprovalFlowStats;

  // Actions - 初期化
  initializeDemoData: () => void;
  resetData: () => void;
}

/**
 * デモデータ生成
 */
const generateDemoFlows = (): ApprovalFlow[] => {
  const now = new Date().toISOString();
  const companyId = 'default';
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
      organizationLevels: 2, // 2階層上まで
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
      organizationLevels: 3, // 3階層上まで（直属上司→部長→人事部長）
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
          approvers: [], // 実際の申請時に動的に設定
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
      organizationLevels: 1, // 直属上司のみ
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
  data: Record<string, any>
): boolean => {
  const value = data[condition.field];

  if (value === undefined) return false;

  switch (condition.operator) {
    case 'gte':
      return value >= condition.value;
    case 'lte':
      return value <= condition.value;
    case 'gt':
      return value > condition.value;
    case 'lt':
      return value < condition.value;
    case 'eq':
      return value === condition.value;
    case 'ne':
      return value !== condition.value;
    default:
      return false;
  }
};

/**
 * 承認フローストア
 */
export const useApprovalFlowStore = create<ApprovalFlowStore>()(
  persist(
    (set, get) => ({
      flows: [],
      initialized: false,

      // CRUD - Create
      createFlow: (request) => {
        const id = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const newFlow: ApprovalFlow = {
          ...request,
          id,
          createdBy: 'user', // TODO: 実際のユーザーIDに置き換え
          createdAt: now,
          updatedAt: now,
          companyId: 'default',
        };

        set((state) => ({
          flows: [...state.flows, newFlow],
        }));

        return id;
      },

      // CRUD - Update
      updateFlow: (request) => {
        const now = new Date().toISOString();

        set((state) => ({
          flows: state.flows.map((flow) =>
            flow.id === request.id
              ? { ...flow, ...request, updatedAt: now }
              : flow
          ),
        }));
      },

      // CRUD - Delete
      deleteFlow: (id) => {
        set((state) => ({
          flows: state.flows.filter((flow) => flow.id !== id),
        }));
      },

      // CRUD - Duplicate
      duplicateFlow: (id) => {
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
        }));

        return newId;
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
          .sort((a, b) => (b.priority || 0) - (a.priority || 0)); // 優先度順（降順）

        for (const flow of flows) {
          // 条件がない場合はデフォルトフロー
          if (!flow.conditions || flow.conditions.length === 0) {
            if (flow.isDefault) return flow;
            continue;
          }

          // 全条件を満たすかチェック
          const allConditionsMet = flow.conditions.every((condition) =>
            evaluateCondition(condition, data)
          );

          if (allConditionsMet) {
            return flow;
          }
        }

        // 該当なしの場合はデフォルトフローを返す
        return get().getDefaultFlow(documentType);
      },

      // 承認ルート解決
      resolveApprovalRoute: (flowId, requesterId, organizationMembers) => {
        const flow = get().getFlowById(flowId);
        if (!flow) return null;

        const steps: ResolvedApprovalStep[] = [];

        if (flow.type === 'organization' && flow.useOrganizationHierarchy) {
          // 組織連動型: 階層から承認者を自動解決
          const levels = flow.organizationLevels || 1;

          if (!organizationMembers || organizationMembers.length === 0) {
            // organizationMembersが提供されていない場合はプレースホルダー
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
            // organizationMembersから承認者を解決
            const requester = organizationMembers.find((m) => m.id === requesterId);
            if (!requester) {
              // 申請者が見つからない場合はプレースホルダー
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
              // 階層ごとにマネージャーを取得
              let currentMember = requester;
              for (let i = 1; i <= levels; i++) {
                // 現在のメンバーのマネージャーを取得
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
                      department: manager.department,
                      position: manager.position,
                      order: 1,
                    }],
                    requiredApprovals: 1,
                    timeoutHours: 48,
                    allowDelegate: true,
                    allowSkip: false,
                  });
                  currentMember = manager; // 次の階層へ
                } else {
                  // マネージャーが見つからない場合は終了
                  break;
                }
              }
            }
          }
        } else if (flow.type === 'custom' && flow.steps) {
          // カスタム型: ステップをそのまま使用
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

      // 初期化
      initializeDemoData: () => {
        const state = get();

        if (state.initialized && state.flows.length > 0) {
          console.log('Approval flows already initialized');
          return;
        }

        const demoFlows = generateDemoFlows();
        set({ flows: demoFlows, initialized: true });
        console.log('Approval flows initialized with', demoFlows.length, 'flows');
      },

      resetData: () => {
        set({ flows: [], initialized: false });
        setTimeout(() => {
          get().initializeDemoData();
        }, 100);
      },
    }),
    {
      name: 'approval-flow-storage',
    }
  )
);
