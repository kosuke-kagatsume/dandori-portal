'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNotificationStore } from './store/notification-store';
import { useUserStore } from './store/user-store';
import { getBroadcast } from '@/lib/realtime/broadcast';
import { useApprovalFlowStore } from './store/approval-flow-store';
import { useOrganizationStore } from './store/organization-store';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { workflowTypeToDocumentType, generateApprovalStepsFromFlow } from './integrations/approval-flow-integration'; // workflowTypeToDocumentTypeは将来的に使用予定
import { workflowAudit } from '@/lib/audit/audit-logger';

// REST API helper functions
const API_BASE = '/api/workflows';
const getTenantId = () => 'tenant-1';

async function apiFetchWorkflows(filters?: { status?: string; type?: string; requesterId?: string; approverId?: string }) {
  const params = new URLSearchParams({ tenantId: getTenantId() });
  if (filters?.status) params.set('status', filters.status);
  if (filters?.type) params.set('type', filters.type);
  if (filters?.requesterId) params.set('requesterId', filters.requesterId);
  if (filters?.approverId) params.set('approverId', filters.approverId);

  const response = await fetch(`${API_BASE}?${params}`);
  if (!response.ok) {
    throw new Error('ワークフロー一覧の取得に失敗しました');
  }
  const result = await response.json();
  return result.data || [];
}

async function apiCreateWorkflow(data: {
  tenantId: string;
  type: string;
  title: string;
  description: string | null;
  requesterId: string;
  requesterName: string;
  department?: string;
  status: string;
  priority?: string;
  details?: Record<string, unknown>;
  approval_steps?: { approverRole: string; approverId: string; approverName: string }[];
}) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('ワークフロー申請の作成に失敗しました');
  }
  const result = await response.json();
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function apiUpdateWorkflow(id: string, data: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('ワークフローの更新に失敗しました');
  }
  const result = await response.json();
  return result.data;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function apiApproveWorkflow(id: string, approverId: string, approverName: string, comments?: string) {
  const response = await fetch(`${API_BASE}/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approverId, approverName, comments }),
  });
  if (!response.ok) {
    throw new Error('ワークフローの承認に失敗しました');
  }
  const result = await response.json();
  return result.data;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function apiRejectWorkflow(id: string, approverId: string, approverName: string, reason: string) {
  const response = await fetch(`${API_BASE}/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approverId, approverName, reason }),
  });
  if (!response.ok) {
    throw new Error('ワークフローの却下に失敗しました');
  }
  const result = await response.json();
  return result.data;
}

/**
 * 現在のロケールをURLから取得するヘルパー関数
 */
function getCurrentLocale(): string {
  if (typeof window !== 'undefined') {
    const locale = window.location.pathname.split('/')[1];
    return locale === 'ja' || locale === 'en' ? locale : 'ja';
  }
  return 'ja';
}

export type WorkflowType =
  | 'leave_request'      // 休暇申請
  | 'overtime_request'   // 残業申請
  | 'expense_claim'      // 経費申請
  | 'business_trip'      // 出張申請
  | 'purchase_request'   // 購買申請
  | 'document_approval'  // 書類承認
  | 'shift_change'       // シフト変更
  | 'remote_work'        // リモートワーク申請
  | 'bank_account_change'  // 給与振込口座変更
  | 'family_info_change'   // 家族情報変更
  | 'commute_route_change'; // 通勤経路変更

export type WorkflowStatus =
  | 'draft'              // 下書き
  | 'pending'            // 申請中（承認待ち）
  | 'in_review'          // 確認中
  | 'partially_approved' // 一部承認済み
  | 'approved'           // 承認済み
  | 'rejected'           // 却下
  | 'returned'           // 差し戻し（修正依頼）
  | 'cancelled'          // 取り消し
  | 'completed'          // 完了
  | 'escalated';         // エスカレーション中

export type ApproverRole = 
  | 'direct_manager'     // 直属上司
  | 'department_head'    // 部門長
  | 'hr_manager'         // 人事部長
  | 'finance_manager'    // 経理部長
  | 'general_manager'    // 役員
  | 'ceo';               // 社長

export interface ApprovalStep {
  id: string;
  order: number;
  approverRole: ApproverRole;
  approverId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  comments?: string;
  actionDate?: string;
  isOptional?: boolean;
  escalationDeadline?: string;
  delegatedTo?: {
    id: string;
    name: string;
    reason: string;
  };
}

export interface WorkflowRequest {
  id: string;
  type: WorkflowType;
  title: string;
  description: string;
  requesterId: string;
  requesterName: string;
  department: string;
  status: WorkflowStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // 申請詳細（タイプによって異なる）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: Record<string, unknown>;
  
  // 承認フロー
  approvalSteps: ApprovalStep[];
  currentStep: number;
  
  // 添付ファイル
  attachments: {
    id: string;
    name: string;
    url: string;
    size: number;
    uploadedAt: string;
  }[];
  
  // タイムライン
  timeline: {
    id: string;
    action: string;
    userId: string;
    userName: string;
    timestamp: string;
    comments?: string;
  }[];
  
  // メタデータ
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  completedAt?: string;
  dueDate?: string;
  
  // エスカレーション設定
  escalation?: {
    enabled: boolean;
    daysUntilEscalation: number;
    escalationPath: ApproverRole[];
    lastEscalatedAt?: string;
  };
}

interface WorkflowStore {
  requests: WorkflowRequest[];
  initialized: boolean;
  isLoading: boolean;
  error: string | null;

  // 代理承認者設定
  delegateSettings: {
    userId: string;
    delegateToId: string;
    delegateName: string;
    startDate: string;
    endDate: string;
    reason: string;
    isActive: boolean;
  }[];

  // API連携
  fetchRequests: (filters?: { status?: string; type?: string; requesterId?: string; approverId?: string }) => Promise<void>;

  // 申請の作成・更新
  createRequest: (request: Omit<WorkflowRequest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateRequest: (id: string, updates: Partial<WorkflowRequest>) => Promise<void>;
  submitRequest: (id: string) => void;
  cancelRequest: (id: string, reason: string) => void;

  // 承認アクション
  approveRequest: (requestId: string, stepId: string, comments?: string, requireComment?: boolean) => Promise<void>;
  rejectRequest: (requestId: string, stepId: string, reason: string) => Promise<void>;
  delegateApproval: (requestId: string, stepId: string, delegateToId: string, delegateName: string, reason: string) => void;
  
  // 一括承認機能
  bulkApprove: (requestIds: string[], comments?: string) => void;
  bulkReject: (requestIds: string[], reason: string) => void;
  
  // 代理承認者設定
  setDelegateApprover: (setting: Omit<WorkflowStore['delegateSettings'][0], 'isActive'>) => void;
  removeDelegateApprover: (userId: string) => void;
  getActiveDelegateFor: (userId: string) => WorkflowStore['delegateSettings'][0] | undefined;
  
  // エスカレーション
  checkAndEscalate: () => void;
  setEscalationDeadline: (requestId: string, stepId: string, deadline: string) => void;
  
  // 取得系
  getRequestById: (id: string) => WorkflowRequest | undefined;
  getMyRequests: (userId: string) => WorkflowRequest[];
  getPendingApprovals: (userId: string) => WorkflowRequest[];
  getDelegatedApprovals: (userId: string) => WorkflowRequest[];
  
  // 統計
  getStatistics: (userId: string) => {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    averageApprovalTime: number;
  };
}

// Broadcast Channelのインスタンス
const broadcast = typeof window !== 'undefined' ? getBroadcast() : null;

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => {
      // Broadcast Channelのリスナーを設定（ブラウザ環境でのみ）
      if (broadcast) {
        // 承認イベント
        broadcast.on<string>('workflow:approved', (id) => {
          set((state) => ({
            requests: state.requests.map((w) =>
              w.id === id ? { ...w, status: 'approved' as const } : w
            ),
          }));
        });

        // 却下イベント
        broadcast.on<string>('workflow:rejected', (id) => {
          set((state) => ({
            requests: state.requests.map((w) =>
              w.id === id ? { ...w, status: 'rejected' as const } : w
            ),
          }));
        });

        // 差し戻しイベント
        broadcast.on<string>('workflow:returned', (id) => {
          set((state) => ({
            requests: state.requests.map((w) =>
              w.id === id ? { ...w, status: 'returned' as const } : w
            ),
          }));
        });

        // 新規申請イベント
        broadcast.on<WorkflowRequest>('workflow:new', (workflow) => {
          set((state) => {
            // 既に存在しない場合のみ追加
            const exists = state.requests.some(w => w.id === workflow.id);
            if (exists) return state;

            return {
              requests: [...state.requests, workflow],
            };
          });
        });

        // 更新イベント
        broadcast.on<WorkflowRequest>('workflow:updated', (workflow) => {
          set((state) => ({
            requests: state.requests.map((w) =>
              w.id === workflow.id ? workflow : w
            ),
          }));
        });
      }

      return {
      requests: [],
      initialized: false,
      isLoading: false,
      error: null,
      delegateSettings: [],

      fetchRequests: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const apiWorkflows = await apiFetchWorkflows(filters);

          // API形式をWorkflowRequest形式に変換
          const requests: WorkflowRequest[] = apiWorkflows.map((wf: Record<string, unknown>) => ({
            id: wf.id as string,
            type: wf.type as WorkflowType,
            title: wf.title as string,
            description: (wf.description as string) || '',
            requesterId: wf.requesterId as string,
            requesterName: (wf.requesterName as string) || '',
            department: (wf.department as string) || '',
            status: wf.status as WorkflowStatus,
            priority: (wf.priority as 'low' | 'normal' | 'high' | 'urgent') || 'normal',
            details: (wf.details as Record<string, unknown>) || {},
            approvalSteps: ((wf.approval_steps as Record<string, unknown>[]) || []).map((step) => ({
              id: step.id as string,
              order: step.order as number,
              approverRole: (step.approverRole as ApproverRole) || 'direct_manager',
              approverId: step.approverId as string,
              approverName: step.approverName as string,
              status: step.status as 'pending' | 'approved' | 'rejected' | 'skipped',
              comments: step.comments as string | undefined,
              actionDate: step.actionDate as string | undefined,
            })),
            currentStep: (wf.currentStep as number) || 0,
            attachments: [],
            timeline: ((wf.timeline_entries as Record<string, unknown>[]) || []).map((entry) => ({
              id: entry.id as string,
              action: entry.action as string,
              userId: entry.actorId as string,
              userName: entry.actorName as string,
              timestamp: entry.createdAt as string,
              comments: entry.details as string | undefined,
            })),
            createdAt: wf.createdAt as string,
            updatedAt: wf.updatedAt as string,
            dueDate: wf.dueDate as string | undefined,
          }));

          set({ requests, initialized: true, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'ワークフロー一覧の取得に失敗しました';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      createRequest: async (request) => {
        set({ isLoading: true, error: null });
        try {
          const now = new Date().toISOString();

          // 承認フローの自動生成を試みる
          let generatedApprovalSteps: ApprovalStep[] | undefined;

          try {
            // WorkflowTypeをDocumentTypeに変換（直接対応する5種類のみ）
            const documentType = request.type as 'leave_request' | 'overtime_request' | 'expense_claim' | 'business_trip' | 'purchase_request';
            const supportedTypes: string[] = ['leave_request', 'overtime_request', 'expense_claim', 'business_trip', 'purchase_request'];

            if (supportedTypes.includes(documentType)) {
              // 承認フローストアから適用可能なフローを検索
              const approvalFlowStore = useApprovalFlowStore.getState();
              const applicableFlow = approvalFlowStore.findApplicableFlow(documentType, request.details || {});

              if (applicableFlow) {
                // 組織メンバー情報を取得
                const organizationStore = useOrganizationStore.getState();
                const organizationMembers = organizationStore.getFilteredMembers();

                // 承認ルートを解決
                const resolvedRoute = approvalFlowStore.resolveApprovalRoute(
                  applicableFlow.id,
                  request.requesterId,
                  organizationMembers
                );

                if (resolvedRoute && resolvedRoute.steps.length > 0) {
                  // 承認ステップを生成
                  const flowSteps = generateApprovalStepsFromFlow(resolvedRoute);

                  // WorkflowRequest形式のApprovalStepに変換
                  generatedApprovalSteps = flowSteps.map((step) => {
                    const approver = step.approvers[0]; // 最初の承認者を使用
                    return {
                      id: step.id,
                      order: step.order,
                      approverRole: 'direct_manager' as ApproverRole, // デフォルトロール
                      approverId: approver?.userId || '',
                      approverName: approver?.name || '',
                      status: step.status as 'pending' | 'approved' | 'rejected' | 'skipped',
                      isOptional: false,
                    };
                  });

                  console.log(`承認フローを自動生成しました: ${applicableFlow.name} (${generatedApprovalSteps.length}ステップ)`);
                }
              }
            }
          } catch (error) {
            console.warn('承認フローの自動生成に失敗しました。手動設定の承認ステップを使用します。', error);
          }

          // REST APIに保存
          const tenantId = getTenantId();
          const approvalStepsForApi = (generatedApprovalSteps || request.approvalSteps).map((step) => ({
            approverRole: step.approverRole,
            approverId: step.approverId,
            approverName: step.approverName,
          }));

          const result = await apiCreateWorkflow({
            tenantId,
            type: request.type,
            title: request.title,
            description: request.description || null,
            requesterId: request.requesterId,
            requesterName: request.requesterName,
            department: request.department,
            status: 'pending',
            priority: request.priority,
            details: request.details || {},
            approval_steps: approvalStepsForApi,
          });

          if (!result.success || !result.data) {
            throw new Error('ワークフロー申請の作成に失敗しました');
          }

          const apiData = result.data;
          const newRequest: WorkflowRequest = {
            ...request,
            id: apiData.id,
            createdAt: apiData.createdAt || now,
            updatedAt: apiData.updatedAt || now,
            currentStep: 0,
            approvalSteps: generatedApprovalSteps || request.approvalSteps,
            timeline: [{
              id: `TL-${Date.now()}`,
              action: generatedApprovalSteps
                ? '申請書を作成しました（承認フロー自動適用）'
                : '申請書を作成しました',
              userId: request.requesterId,
              userName: request.requesterName,
              timestamp: now,
            }],
          };

          // ローカルステートも更新
          set((state) => ({
            requests: [...state.requests, newRequest],
            isLoading: false,
          }));

          // 監査ログ記録
          workflowAudit.create(apiData.id, request.title);

          return apiData.id;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'ワークフロー申請の作成に失敗しました';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      updateRequest: async (id, updates) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === id
              ? { ...req, ...updates, updatedAt: new Date().toISOString() }
              : req
          ),
        }));
      },
      
      submitRequest: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          requests: state.requests.map((req) => {
            if (req.id !== id) return req;

            return {
              ...req,
              status: 'pending',
              submittedAt: now,
              updatedAt: now,
              approvalSteps: req.approvalSteps.map((step, index) => ({
                ...step,
                status: index === 0 ? 'pending' : step.status,
              })),
              timeline: [
                ...req.timeline,
                {
                  id: `TL-${Date.now()}`,
                  action: '申請を提出しました',
                  userId: req.requesterId,
                  userName: req.requesterName,
                  timestamp: now,
                },
              ],
            };
          }),
        }));

        // 他のタブに新規申請を通知
        const request = get().requests.find(r => r.id === id);
        if (request) {
          broadcast?.send('workflow:new', request);

          // 監査ログ記録（提出）
          workflowAudit.submit(id, request.title);

          // 最初の承認者に通知
          const firstStep = request.approvalSteps[0];
          if (firstStep) {
            useNotificationStore.getState().addNotification({
              id: `notif-${Date.now()}-${Math.random()}`,
              type: 'info',
              title: '新しい承認依頼',
              message: `${request.requesterName}さんから${request.title}の承認依頼があります`,
              timestamp: now,
              read: false,
              important: true,
              actionUrl: `/${getCurrentLocale()}/workflow`,
              userId: firstStep.approverId,
            });
          }
        }
      },
      
      cancelRequest: (id, reason) => {
        const now = new Date().toISOString();
        const requestBeforeCancel = get().requests.find(r => r.id === id);

        set((state) => {
          const request = state.requests.find(r => r.id === id);
          if (!request) return state;

          return {
            requests: state.requests.map((req) =>
              req.id === id
                ? {
                    ...req,
                    status: 'cancelled',
                    updatedAt: now,
                    timeline: [
                      ...req.timeline,
                      {
                        id: `TL-${Date.now()}`,
                        action: '申請を取り消しました',
                        userId: req.requesterId,
                        userName: req.requesterName,
                        timestamp: now,
                        comments: reason,
                      },
                    ],
                  }
                : req
            ),
          };
        });

        // 監査ログ記録（取り消し）
        if (requestBeforeCancel) {
          workflowAudit.cancel(id, requestBeforeCancel.title);
        }
      },
      
      approveRequest: async (requestId, stepId, comments, requireComment = false) => {
        // コメント必須チェック
        if (requireComment && !comments) {
          throw new Error('この承認にはコメントが必要です');
        }
        const now = new Date().toISOString();
        set((state) => {
          const request = state.requests.find(r => r.id === requestId);
          if (!request) return state;
          
          const stepIndex = request.approvalSteps.findIndex(s => s.id === stepId);
          const step = request.approvalSteps[stepIndex];
          if (!step) return state;
          
          const updatedSteps = [...request.approvalSteps];
          updatedSteps[stepIndex] = {
            ...step,
            status: 'approved',
            actionDate: now,
            comments,
          };
          
          // 次のステップに進むか、完了か判定
          const nextPendingIndex = updatedSteps.findIndex(
            (s, i) => i > stepIndex && s.status === 'pending' && !s.isOptional
          );
          
          const isFullyApproved = updatedSteps
            .filter(s => !s.isOptional)
            .every(s => s.status === 'approved');
          
          let newStatus: WorkflowStatus = request.status;
          if (isFullyApproved) {
            newStatus = 'approved';
          } else if (nextPendingIndex >= 0) {
            newStatus = 'partially_approved';
            updatedSteps[nextPendingIndex].status = 'pending';
          }
          
          return {
            requests: state.requests.map((req) =>
              req.id === requestId
                ? {
                    ...req,
                    status: newStatus,
                    approvalSteps: updatedSteps,
                    currentStep: nextPendingIndex >= 0 ? nextPendingIndex : request.currentStep,
                    updatedAt: now,
                    completedAt: isFullyApproved ? now : undefined,
                    timeline: [
                      ...req.timeline,
                      {
                        id: `TL-${Date.now()}`,
                        action: `${step.approverName}が承認しました`,
                        userId: step.approverId,
                        userName: step.approverName,
                        timestamp: now,
                        comments,
                      },
                    ],
                  }
                : req
            ),
          };
        });

        // 他のタブに承認を通知
        const updatedRequest = get().requests.find(r => r.id === requestId);
        if (updatedRequest && updatedRequest.status === 'approved') {
          broadcast?.send('workflow:approved', requestId);
        } else if (updatedRequest) {
          broadcast?.send('workflow:updated', updatedRequest);
        }

        // 通知を作成
        const request = get().requests.find(r => r.id === requestId);
        if (request) {
          const stepIndex = request.approvalSteps.findIndex(s => s.id === stepId);
          const step = request.approvalSteps[stepIndex];
          const isFullyApproved = request.status === 'approved';

          // 監査ログ記録（承認）
          workflowAudit.approve(requestId, request.title, step?.approverName || '承認者');

          // 申請者に通知
          useNotificationStore.getState().addNotification({
            id: `notif-${Date.now()}-${Math.random()}`,
            type: 'success',
            title: isFullyApproved ? '申請が承認されました' : '申請が承認されました（次のステップへ）',
            message: `${step?.approverName || '承認者'}が${request.title}を承認しました${comments ? `：${comments}` : ''}`,
            timestamp: now,
            read: false,
            important: isFullyApproved,
            actionUrl: `/ja/workflow`,
            userId: request.requesterId,
          });

          // 次の承認者に通知
          if (!isFullyApproved && stepIndex < request.approvalSteps.length - 1) {
            const nextStep = request.approvalSteps[stepIndex + 1];
            if (nextStep && nextStep.status === 'pending') {
              useNotificationStore.getState().addNotification({
                id: `notif-${Date.now()}-${Math.random()}-next`,
                type: 'info',
                title: '新しい承認依頼',
                message: `${request.requesterName}さんから${request.title}の承認依頼があります`,
                timestamp: now,
                read: false,
                important: true,
                actionUrl: `/${getCurrentLocale()}/workflow`,
                userId: nextStep.approverId,
              });
            }
          }
        }
      },
      
      rejectRequest: async (requestId, stepId, reason) => {
        const now = new Date().toISOString();
        set((state) => {
          const request = state.requests.find(r => r.id === requestId);
          if (!request) return state;
          
          const step = request.approvalSteps.find(s => s.id === stepId);
          if (!step) return state;
          
          return {
            requests: state.requests.map((req) =>
              req.id === requestId
                ? {
                    ...req,
                    status: 'rejected',
                    approvalSteps: req.approvalSteps.map(s =>
                      s.id === stepId
                        ? { ...s, status: 'rejected', actionDate: now, comments: reason }
                        : s
                    ),
                    updatedAt: now,
                    completedAt: now,
                    timeline: [
                      ...req.timeline,
                      {
                        id: `TL-${Date.now()}`,
                        action: `${step.approverName}が却下しました`,
                        userId: step.approverId,
                        userName: step.approverName,
                        timestamp: now,
                        comments: reason,
                      },
                    ],
                  }
                : req
            ),
          };
        });

        // 他のタブに却下を通知
        broadcast?.send('workflow:rejected', requestId);

        // 申請者に却下通知
        const request = get().requests.find(r => r.id === requestId);
        if (request) {
          const step = request.approvalSteps.find(s => s.id === stepId);

          // 監査ログ記録（却下）
          workflowAudit.reject(requestId, request.title, reason);

          useNotificationStore.getState().addNotification({
            id: `notif-${Date.now()}-${Math.random()}`,
            type: 'error',
            title: '申請が却下されました',
            message: `${step?.approverName || '承認者'}が${request.title}を却下しました：${reason}`,
            timestamp: now,
            read: false,
            important: true,
            actionUrl: `/ja/workflow`,
            userId: request.requesterId,
          });
        }
      },
      
      delegateApproval: (requestId, stepId, delegateToId, delegateName, reason) => {
        const now = new Date().toISOString();
        set((state) => ({
          requests: state.requests.map((req) => {
            if (req.id !== requestId) return req;
            
            const step = req.approvalSteps.find(s => s.id === stepId);
            if (!step) return req;
            
            return {
              ...req,
              approvalSteps: req.approvalSteps.map(s =>
                s.id === stepId
                  ? {
                      ...s,
                      delegatedTo: {
                        id: delegateToId,
                        name: delegateName,
                        reason,
                      },
                      approverId: delegateToId,
                      approverName: delegateName,
                    }
                  : s
              ),
              updatedAt: now,
              timeline: [
                ...req.timeline,
                {
                  id: `TL-${Date.now()}`,
                  action: `${step.approverName}が${delegateName}に承認を委任しました`,
                  userId: step.approverId,
                  userName: step.approverName,
                  timestamp: now,
                  comments: reason,
                },
              ],
            };
          }),
        }));
      },
      
      checkAndEscalate: () => {
        const now = new Date();
        set((state) => ({
          requests: state.requests.map((req) => {
            // エスカレーション対象のチェック
            if (
              req.status !== 'pending' && 
              req.status !== 'partially_approved' ||
              !req.escalation?.enabled
            ) {
              return req;
            }
            
            const currentStep = req.approvalSteps[req.currentStep];
            if (!currentStep || !currentStep.escalationDeadline) return req;
            
            const deadline = new Date(currentStep.escalationDeadline);
            if (now < deadline) return req;
            
            // エスカレーション実行
            const escalationPath = req.escalation.escalationPath;
            const currentRoleIndex = escalationPath.indexOf(currentStep.approverRole);
            if (currentRoleIndex >= escalationPath.length - 1) return req;
            
            const nextRole = escalationPath[currentRoleIndex + 1];
            
            return {
              ...req,
              status: 'escalated',
              updatedAt: now.toISOString(),
              escalation: {
                ...req.escalation,
                lastEscalatedAt: now.toISOString(),
              },
              timeline: [
                ...req.timeline,
                {
                  id: `TL-${Date.now()}`,
                  action: `承認期限を過ぎたため、${nextRole}にエスカレーションされました`,
                  userId: 'system',
                  userName: 'システム',
                  timestamp: now.toISOString(),
                },
              ],
            };
          }),
        }));
      },
      
      getRequestById: (id) => {
        return get().requests.find(r => r.id === id);
      },
      
      getMyRequests: (userId) => {
        return get().requests.filter(r => r.requesterId === userId);
      },
      
      getPendingApprovals: (userId) => {
        return get().requests.filter(r => {
          const currentStep = r.approvalSteps[r.currentStep];
          return (
            currentStep &&
            currentStep.approverId === userId &&
            currentStep.status === 'pending' &&
            (r.status === 'pending' || r.status === 'partially_approved')
          );
        });
      },
      
      getDelegatedApprovals: (userId) => {
        return get().requests.filter(r =>
          r.approvalSteps.some(step =>
            step.delegatedTo?.id === userId && step.status === 'pending'
          )
        );
      },
      
      // 一括承認機能
      bulkApprove: (requestIds, comments) => {
        const userId = useUserStore.getState().currentUser?.id || 'user1';
        const requests = get().requests.filter(r => requestIds.includes(r.id));

        requests.forEach(request => {
          const currentStep = request.approvalSteps.find(step =>
            step.approverId === userId && step.status === 'pending'
          );
          if (currentStep) {
            get().approveRequest(request.id, currentStep.id, comments || '一括承認');
            // 各idに対してブロードキャスト送信（一括承認でも個別に通知）
            const updatedRequest = get().requests.find(r => r.id === request.id);
            if (updatedRequest && updatedRequest.status === 'approved') {
              broadcast?.send('workflow:approved', request.id);
            }
          }
        });
      },
      
      bulkReject: (requestIds, reason) => {
        const userId = useUserStore.getState().currentUser?.id || 'user1';
        const requests = get().requests.filter(r => requestIds.includes(r.id));

        requests.forEach(request => {
          const currentStep = request.approvalSteps.find(step =>
            step.approverId === userId && step.status === 'pending'
          );
          if (currentStep) {
            get().rejectRequest(request.id, currentStep.id, reason);
            // 各idに対してブロードキャスト送信（一括却下でも個別に通知）
            broadcast?.send('workflow:rejected', request.id);
          }
        });
      },
      
      // 代理承認者設定
      setDelegateApprover: (setting) => {
        // const now = new Date().toISOString(); // 将来的にタイムスタンプ記録で使用予定
        set((state) => ({
          delegateSettings: [
            ...state.delegateSettings.filter(s => s.userId !== setting.userId),
            { ...setting, isActive: true }
          ],
        }));
      },
      
      removeDelegateApprover: (userId) => {
        set((state) => ({
          delegateSettings: state.delegateSettings.filter(s => s.userId !== userId),
        }));
      },
      
      getActiveDelegateFor: (userId) => {
        const now = new Date();
        return get().delegateSettings.find(setting => 
          setting.userId === userId &&
          setting.isActive &&
          new Date(setting.startDate) <= now &&
          new Date(setting.endDate) >= now
        );
      },
      
      // エスカレーション期限設定
      setEscalationDeadline: (requestId, stepId, deadline) => {
        set((state) => ({
          requests: state.requests.map(req => {
            if (req.id !== requestId) return req;
            
            return {
              ...req,
              approvalSteps: req.approvalSteps.map(step =>
                step.id === stepId
                  ? { ...step, escalationDeadline: deadline }
                  : step
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },
      
      getStatistics: (userId) => {
        const requests = get().getMyRequests(userId);
        const approved = requests.filter(r => r.status === 'approved');
        
        let totalApprovalTime = 0;
        approved.forEach(req => {
          if (req.submittedAt && req.completedAt) {
            const start = new Date(req.submittedAt).getTime();
            const end = new Date(req.completedAt).getTime();
            totalApprovalTime += (end - start) / (1000 * 60 * 60 * 24); // 日数
          }
        });
        
        return {
          totalRequests: requests.length,
          pendingRequests: requests.filter(r =>
            r.status === 'pending' || r.status === 'partially_approved'
          ).length,
          approvedRequests: approved.length,
          rejectedRequests: requests.filter(r => r.status === 'rejected').length,
          averageApprovalTime: approved.length > 0
            ? totalApprovalTime / approved.length
            : 0,
        };
      },
    };
  },
    {
      name: 'workflow-store',
      skipHydration: true, // SSR対応: クライアント側でのみhydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          // APIからデータを取得（初回読み込み時）
          if (!state.initialized || state.requests.length === 0) {
            console.log('Rehydrating and fetching workflow data from API...');
            state.fetchRequests().catch((error) => {
              console.error('Failed to fetch workflows on rehydration:', error);
            });
          }
        }
      },
    }
  )
);