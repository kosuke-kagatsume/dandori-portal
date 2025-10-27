/**
 * 承認フロー統合ヘルパー
 *
 * workflow-storeとapproval-flow-storeを統合するためのユーティリティ関数
 */

import type { DocumentType } from '@/types/approval-flow';
import type { WorkflowType } from '@/types';

/**
 * ワークフロータイプを承認フローのドキュメントタイプに変換
 */
export function workflowTypeToDocumentType(workflowType: WorkflowType | DocumentType): DocumentType | undefined {
  // 既にDocumentType形式の場合はそのまま返す
  const documentTypes: DocumentType[] = [
    'leave_request',
    'overtime_request',
    'expense_claim',
    'business_trip',
    'purchase_request',
  ];

  if (documentTypes.includes(workflowType as DocumentType)) {
    return workflowType as DocumentType;
  }

  // WorkflowType形式の場合は変換
  const mapping: Record<string, DocumentType> = {
    leave: 'leave_request',
    overtime: 'overtime_request',
    expense: 'expense_claim',
    trip: 'business_trip',
    purchase: 'purchase_request',
  };

  return mapping[workflowType];
}

/**
 * 承認フローを使用してワークフローの承認ステップを自動生成
 *
 * 使用例（workflow-store内）:
 * ```typescript
 * import { useApprovalFlowStore } from '@/lib/store/approval-flow-store';
 * import { useOrganizationStore } from '@/lib/store/organization-store';
 * import { generateApprovalStepsFromFlow } from '@/lib/integrations/approval-flow-integration';
 *
 * // ワークフロー作成時
 * const workflowType = 'leave';
 * const requestData = { days: 5 }; // 休暇日数
 * const requesterId = 'user_001';
 *
 * // 1. 適用可能な承認フローを検索
 * const documentType = workflowTypeToDocumentType(workflowType);
 * if (documentType) {
 *   const approvalFlowStore = useApprovalFlowStore.getState();
 *   const applicableFlow = approvalFlowStore.findApplicableFlow(documentType, requestData);
 *
 *   if (applicableFlow) {
 *     // 2. 組織メンバー情報を取得
 *     const organizationStore = useOrganizationStore.getState();
 *     const organizationMembers = organizationStore.getFilteredMembers();
 *
 *     // 3. 承認ルートを解決
 *     const resolvedRoute = approvalFlowStore.resolveApprovalRoute(
 *       applicableFlow.id,
 *       requesterId,
 *       organizationMembers
 *     );
 *
 *     if (resolvedRoute) {
 *       // 4. 承認ステップを生成
 *       const approvalSteps = generateApprovalStepsFromFlow(resolvedRoute);
 *       // approvalStepsをworkflowデータに設定
 *     }
 *   }
 * }
 * ```
 */
export function generateApprovalStepsFromFlow(resolvedRoute: any): any[] {
  // ResolvedApprovalRouteからワークフロー用の承認ステップを生成
  return resolvedRoute.steps.map((step: any, index: number) => ({
    id: `step_${Date.now()}_${index}`,
    order: index + 1,
    name: step.name,
    approvers: step.approvers.map((approver: any) => ({
      userId: approver.userId || approver.id, // userId優先、なければidを使用
      name: approver.name,
      email: approver.email,
      role: approver.role,
      status: 'pending',
    })),
    status: index === 0 ? 'pending' : 'waiting',
    required: true,
    mode: step.mode, // 'serial' | 'parallel'
    timeoutHours: step.timeoutHours,
    allowDelegate: step.allowDelegate,
  }));
}

/**
 * 承認フローIDからフロー情報を取得するヘルパー
 */
export function getApprovalFlowInfo(flowId: string): {
  name: string;
  type: string;
  documentType: string;
} | null {
  // この関数は将来的にapproval-flow-storeと統合する
  // 現時点ではプレースホルダー
  return null;
}

/**
 * ワークフロー統合のためのTODOリスト:
 *
 * 1. workflow-store.tsのcreateWorkflow()関数に以下を追加:
 *    - workflowTypeToDocumentType()でドキュメントタイプを取得
 *    - findApplicableFlow()で適用可能な承認フローを検索
 *    - getFilteredMembers()で組織メンバー情報を取得
 *    - resolveApprovalRoute()で承認ルートを解決
 *    - generateApprovalStepsFromFlow()で承認ステップを生成
 *    - 生成された承認ステップをworkflow.approvalStepsに設定
 *
 * 2. 条件分岐ルールの活用:
 *    - 休暇申請: days（日数）
 *    - 残業申請: hours（時間）
 *    - 経費申請: amount（金額）
 *    - 出張申請: days（日数）
 *    - 購買申請: amount（金額）
 *
 * 3. エラーハンドリング:
 *    - 承認フローが見つからない場合のフォールバック
 *    - 組織メンバーが見つからない場合の処理
 *    - 承認ルート解決に失敗した場合の処理
 *
 * 4. UI統合:
 *    - ワークフロー作成画面に承認フロー情報を表示
 *    - 承認ルートのプレビュー機能
 *    - 手動での承認者追加・変更機能
 */
