/**
 * 承認フロー管理の型定義
 * DRM Suiteの仕様をベースに、Dandori Portal向けにカスタマイズ
 */

// ========================================
// 基本型
// ========================================

/**
 * 承認フローの種類
 */
export type ApprovalFlowType =
  | 'organization'  // 組織連動型（階層レベルで自動決定）
  | 'custom';       // カスタム型（手動ステップ設定）

/**
 * 承認ステップの実行モード
 */
export type ApprovalStepMode =
  | 'serial'    // 順次承認（1人ずつ順番に）
  | 'parallel'; // 並列承認（複数人が同時承認可能）

/**
 * 承認ステータス
 */
export type ApprovalStatus =
  | 'pending'    // 承認待ち
  | 'approved'   // 承認済み
  | 'rejected'   // 却下
  | 'cancelled'  // キャンセル
  | 'expired';   // 期限切れ

/**
 * 対象ドキュメントタイプ（Dandori Portal用）
 */
export type DocumentType =
  | 'leave_request'      // 休暇申請
  | 'overtime_request'   // 残業申請
  | 'expense_claim'      // 経費申請
  | 'business_trip'      // 出張申請
  | 'purchase_request';  // 購買申請

/**
 * 条件演算子
 */
export type ConditionOperator =
  | 'gte'  // >=
  | 'lte'  // <=
  | 'eq'   // ==
  | 'ne'   // !=
  | 'gt'   // >
  | 'lt';  // <

// ========================================
// メインインターフェース
// ========================================

/**
 * 承認フロー
 */
export interface ApprovalFlow {
  // 基本情報
  id: string;
  name: string;
  description?: string;
  type: ApprovalFlowType;
  documentType: DocumentType;

  // 組織連動型の設定
  useOrganizationHierarchy?: boolean;
  organizationLevels?: number; // 何階層上まで承認が必要か（1-5）

  // カスタム型の設定
  steps?: ApprovalStep[];

  // 条件分岐
  conditions?: ApprovalCondition[];
  conditionalFlows?: ConditionalFlowMapping[];

  // メタ情報
  isActive: boolean;
  isDefault?: boolean;
  priority?: number; // 優先順位（小さいほど優先、複数該当時に使用）
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  companyId: string;
}

/**
 * 承認ステップ
 */
export interface ApprovalStep {
  id: string;
  stepNumber: number; // ステップ番号（1, 2, 3...）
  name: string;
  description?: string;
  mode: ApprovalStepMode;
  approvers: Approver[];
  requiredApprovals?: number; // 並列承認時の必要承認数（例: 2名中1名必要なら1）
  timeoutHours?: number; // タイムアウト時間（時間単位: 24, 48, 72）
  allowDelegate?: boolean; // 代理承認を許可
  allowSkip?: boolean; // スキップ可能
}

/**
 * 承認者
 */
export interface Approver {
  id: string;
  name: string;
  email: string;
  role: string; // UserRole（'employee' | 'manager' | 'hr' | 'admin'）
  department?: string;
  position?: string;
  order?: number; // ステップ内での順序
}

/**
 * 承認条件
 */
export interface ApprovalCondition {
  id: string;
  field: string; // 判定対象フィールド（例: 'amount', 'days', 'hours'）
  operator: ConditionOperator;
  value: string | number;
  description?: string; // 説明文（例: "10万円以上"）
}

/**
 * 条件別フローマッピング
 */
export interface ConditionalFlowMapping {
  conditionId: string;
  flowId: string;
}

// ========================================
// 統計・集計用の型
// ========================================

/**
 * 承認フロー統計
 */
export interface ApprovalFlowStats {
  totalFlows: number;
  organizationFlows: number;
  customFlows: number;
  activeFlows: number;
  inactiveFlows: number;
  flowsByDocumentType: Record<DocumentType, number>;
}

// ========================================
// リクエスト・レスポンス用の型
// ========================================

/**
 * 承認フロー作成リクエスト
 */
export type CreateApprovalFlowRequest = Omit<
  ApprovalFlow,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'companyId'
>;

/**
 * 承認フロー更新リクエスト
 */
export type UpdateApprovalFlowRequest = Partial<
  Omit<ApprovalFlow, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'companyId'>
> & {
  id: string;
};

// ========================================
// ヘルパー型
// ========================================

/**
 * 承認ルート解決結果
 */
export interface ResolvedApprovalRoute {
  flowId: string;
  flowName: string;
  steps: ResolvedApprovalStep[];
}

/**
 * 解決済み承認ステップ
 */
export interface ResolvedApprovalStep {
  stepNumber: number;
  name: string;
  mode: ApprovalStepMode;
  approvers: Approver[];
  requiredApprovals: number;
  timeoutHours: number;
  allowDelegate: boolean;
  allowSkip: boolean;
}
