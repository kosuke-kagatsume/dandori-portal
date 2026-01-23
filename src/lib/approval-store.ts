import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApprovalFlow, ApprovalStep, createApprovalFlow, processApproval, returnToSender, getPendingApprovalsForUser, RequestMetadata, checkForOverdueApprovals, escalateApproval } from './approval-system';

interface ApprovalStore {
  // 承認フローの管理
  approvalFlows: ApprovalFlow[];
  
  // 承認フローを作成
  createFlow: (
    requestId: string,
    requestType: ApprovalFlow['requestType'],
    applicantId: string,
    applicantName: string,
    urgency?: ApprovalFlow['urgency'],
    metadata?: RequestMetadata
  ) => ApprovalFlow;
  
  // 申請を提出（下書きから申請中に変更）
  submitRequest: (flowId: string) => void;
  
  // 承認・却下処理
  processApproval: (
    flowId: string,
    approverUserId: string,
    action: 'approve' | 'reject',
    comment?: string
  ) => void;

  // 差し戻し処理
  returnToSender: (
    flowId: string,
    approverUserId: string,
    reason: string
  ) => void;

  // 特定ユーザーの承認待ちを取得
  getPendingApprovals: (userId: string) => ApprovalFlow[];
  
  // 特定ユーザーの申請履歴を取得
  getUserRequests: (userId: string) => ApprovalFlow[];
  
  // 承認フローを取得
  getFlow: (flowId: string) => ApprovalFlow | undefined;
  
  // 承認フローを削除（キャンセル）
  cancelFlow: (flowId: string, userId: string) => void;
  
  // 通知カウントの管理
  getNotificationCount: (userId: string) => number;

  // エスカレーション機能
  checkOverdueApprovals: () => Array<{
    flow: ApprovalFlow;
    step: ApprovalStep;
    hoursOverdue: number;
  }>;
  escalateApproval: (flowId: string) => void;

  // 承認フロー更新時のコールバック
  onFlowUpdate: ((flow: ApprovalFlow) => void) | null;
  setOnFlowUpdate: (callback: (flow: ApprovalFlow) => void) => void;
}

export const useApprovalStore = create<ApprovalStore>()(
  persist(
    (set, get) => ({
      approvalFlows: [],
      onFlowUpdate: null,
      
      setOnFlowUpdate: (callback) => {
        set({ onFlowUpdate: callback });
      },
      
      createFlow: (requestId, requestType, applicantId, applicantName, urgency = 'normal', metadata) => {
        const flow = createApprovalFlow(requestId, requestType, applicantId, applicantName, urgency, metadata);

        set((state) => ({
          approvalFlows: [...state.approvalFlows, flow]
        }));

        return flow;
      },
      
      submitRequest: (flowId) => {
        set((state) => ({
          approvalFlows: state.approvalFlows.map(flow => 
            flow.id === flowId 
              ? { ...flow, overallStatus: 'pending' as const }
              : flow
          )
        }));
        
        const updatedFlow = get().approvalFlows.find(f => f.id === flowId);
        if (updatedFlow && get().onFlowUpdate) {
          get().onFlowUpdate!(updatedFlow);
        }
      },
      
      processApproval: (flowId, approverUserId, action, comment) => {
        const flow = get().approvalFlows.find(f => f.id === flowId);
        if (!flow) return;
        
        try {
          const updatedFlow = processApproval(flow, approverUserId, action, comment);
          
          set((state) => ({
            approvalFlows: state.approvalFlows.map(f => 
              f.id === flowId ? updatedFlow : f
            )
          }));
          
          // 承認フロー更新の通知
          const callback = get().onFlowUpdate;
          if (callback) {
            callback(updatedFlow);
          }
          
        } catch (error) {
          console.error('Approval processing failed:', error);
        }
      },

      returnToSender: (flowId, approverUserId, reason) => {
        const flow = get().approvalFlows.find(f => f.id === flowId);
        if (!flow) return;

        try {
          const updatedFlow = returnToSender(flow, approverUserId, reason);

          set((state) => ({
            approvalFlows: state.approvalFlows.map(f =>
              f.id === flowId ? updatedFlow : f
            )
          }));

          // 承認フロー更新の通知
          const callback = get().onFlowUpdate;
          if (callback) {
            callback(updatedFlow);
          }

        } catch (error) {
          console.error('Return to sender failed:', error);
        }
      },

      getPendingApprovals: (userId) => {
        return getPendingApprovalsForUser(userId, get().approvalFlows);
      },
      
      getUserRequests: (userId) => {
        return get().approvalFlows.filter(flow => flow.applicantId === userId);
      },
      
      getFlow: (flowId) => {
        return get().approvalFlows.find(flow => flow.id === flowId);
      },
      
      cancelFlow: (flowId, userId) => {
        set((state) => ({
          approvalFlows: state.approvalFlows.map(flow => {
            if (flow.id === flowId && flow.applicantId === userId && 
                (flow.overallStatus === 'draft' || flow.overallStatus === 'pending')) {
              return { ...flow, overallStatus: 'cancelled' as const };
            }
            return flow;
          })
        }));
        
        const cancelledFlow = get().approvalFlows.find(f => f.id === flowId);
        if (cancelledFlow && get().onFlowUpdate) {
          get().onFlowUpdate!(cancelledFlow);
        }
      },
      
      getNotificationCount: (userId) => {
        return getPendingApprovalsForUser(userId, get().approvalFlows).length;
      },

      checkOverdueApprovals: () => {
        return checkForOverdueApprovals(get().approvalFlows);
      },

      escalateApproval: (flowId) => {
        const flow = get().approvalFlows.find(f => f.id === flowId);
        if (!flow) return;

        const overdueApprovals = checkForOverdueApprovals([flow]);
        if (overdueApprovals.length === 0) {
          console.warn('No overdue approvals found for flow:', flowId);
          return;
        }

        try {
          const { step } = overdueApprovals[0];
          const updatedFlow = escalateApproval(flow, step);

          set((state) => ({
            approvalFlows: state.approvalFlows.map(f =>
              f.id === flowId ? updatedFlow : f
            )
          }));

          // 承認フロー更新の通知
          const callback = get().onFlowUpdate;
          if (callback) {
            callback(updatedFlow);
          }
        } catch (error) {
          console.error('Escalation failed:', error);
        }
      },
    }),
    {
      name: 'approval-store',
      skipHydration: true,
    }
  )
);