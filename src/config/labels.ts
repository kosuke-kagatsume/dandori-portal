/**
 * 共通ラベル定数
 * CSV/PDF出力で使用するラベルを一元管理
 */

// ===== 支給項目ラベル =====
export const ALLOWANCE_LABELS: Record<string, string> = {
  positionAllowance: '役職手当',
  commuteAllowance: '通勤手当',
  familyAllowance: '家族手当',
  housingAllowance: '住宅手当',
  qualificationAllowance: '資格手当',
  overtimeAllowance: '残業手当',
  lateNightAllowance: '深夜手当',
  holidayAllowance: '休日手当',
} as const;

// ===== 控除項目ラベル =====
export const DEDUCTION_LABELS: Record<string, string> = {
  healthInsurance: '健康保険',
  pensionInsurance: '厚生年金',
  employmentInsurance: '雇用保険',
  incomeTax: '所得税',
  residentTax: '住民税',
} as const;

// ===== 賞与種別ラベル =====
export const BONUS_TYPE_LABELS: Record<string, string> = {
  summer: '夏季賞与',
  winter: '冬季賞与',
  special: '特別賞与',
} as const;

// ===== 源泉徴収票用控除項目ラベル =====
export const WITHHOLDING_DEDUCTION_LABELS: Record<string, string> = {
  socialInsurance: '社会保険料',
  basic: '基礎控除',
  dependent: '扶養控除',
  spouse: '配偶者控除',
  lifeInsurance: '生命保険料控除',
} as const;

// ===== 勤務場所ラベル =====
export const WORK_LOCATION_LABELS: Record<string, string> = {
  office: 'オフィス',
  home: '在宅',
  client: '客先',
  other: 'その他',
} as const;

// ===== ステータスラベル =====
export const STATUS_LABELS: Record<string, string> = {
  // 勤怠ステータス
  present: '出勤',
  absent: '欠勤',
  holiday: '休日',
  leave: '休暇',
  late: '遅刻',
  early: '早退',
  // 給与・賞与ステータス
  draft: '下書き',
  approved: '承認済み',
  paid: '支払済み',
} as const;

// ===== 承認ステータスラベル =====
export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending: '承認待ち',
  approved: '承認済み',
  rejected: '却下',
} as const;

// ===== 休暇種別ラベル =====
export const LEAVE_TYPE_LABELS: Record<string, string> = {
  paid: '有給休暇',
  sick: '病気休暇',
  special: '特別休暇',
  compensatory: '代休',
  half_day_am: '半日休暇(午前)',
  half_day_pm: '半日休暇(午後)',
} as const;

// ===== 休暇ステータスラベル =====
export const LEAVE_STATUS_LABELS: Record<string, string> = {
  draft: '下書き',
  pending: '承認待ち',
  approved: '承認済み',
  rejected: '却下',
  cancelled: 'キャンセル',
} as const;

// ===== ユーザーステータスラベル =====
export const USER_STATUS_LABELS: Record<string, string> = {
  active: '有効',
  inactive: '無効',
  suspended: '停止',
  retired: '退職',
} as const;

// ===== 退職理由ラベル =====
export const RETIREMENT_REASON_LABELS: Record<string, string> = {
  voluntary: '自己都合',
  company: '会社都合',
  contract_end: '契約期間満了',
  retirement_age: '定年退職',
  other: 'その他',
} as const;

// ===== 資産ステータスラベル =====
export const ASSET_STATUS_LABELS: Record<string, string> = {
  active: '稼働中',
  maintenance: 'メンテナンス中',
  retired: '廃棄済み',
} as const;

// ===== 所有形態ラベル =====
export const OWNERSHIP_TYPE_LABELS: Record<string, string> = {
  owned: '自社所有',
  leased: 'リース',
  rental: 'レンタル',
} as const;

// ===== SaaSカテゴリラベル =====
export const SAAS_CATEGORY_LABELS: Record<string, string> = {
  communication: 'コミュニケーション',
  productivity: '生産性向上',
  development: '開発ツール',
  design: 'デザイン',
  hr: '人事・労務',
  finance: '財務・会計',
  marketing: 'マーケティング',
  sales: '営業',
  security: 'セキュリティ',
  storage: 'ストレージ',
  other: 'その他',
} as const;

// ===== ライセンスタイプラベル =====
export const LICENSE_TYPE_LABELS: Record<string, string> = {
  'user-based': 'ユーザーライセンス型',
  'fixed': '固定契約型',
  'usage-based': '従量課金型',
} as const;

// ===== ライセンスステータスラベル =====
export const LICENSE_STATUS_LABELS: Record<string, string> = {
  active: 'アクティブ',
  inactive: '非アクティブ',
  pending: '付与待ち',
} as const;

// ===== セキュリティ評価ラベル =====
export const SECURITY_RATING_LABELS: Record<string, string> = {
  A: 'A (優良)',
  B: 'B (良好)',
  C: 'C (注意)',
  D: 'D (要改善)',
} as const;

// ===== ヘルパー関数 =====

/**
 * 支給項目のラベルを取得（フォールバック付き）
 */
export const getAllowanceLabel = (key: string): string => {
  return ALLOWANCE_LABELS[key] || key;
};

/**
 * 控除項目のラベルを取得（フォールバック付き）
 */
export const getDeductionLabel = (key: string): string => {
  return DEDUCTION_LABELS[key] || key;
};

/**
 * 賞与種別のラベルを取得（フォールバック付き）
 */
export const getBonusTypeLabel = (key: string): string => {
  return BONUS_TYPE_LABELS[key] || key;
};

/**
 * 源泉徴収票用控除項目のラベルを取得（フォールバック付き）
 */
export const getWithholdingDeductionLabel = (key: string): string => {
  return WITHHOLDING_DEDUCTION_LABELS[key] || key;
};

/**
 * 勤務場所のラベルを取得（フォールバック付き）
 */
export const getWorkLocationLabel = (key?: string): string => {
  if (!key) return '';
  return WORK_LOCATION_LABELS[key] || '';
};

/**
 * ステータスのラベルを取得（フォールバック付き）
 */
export const getStatusLabel = (key?: string): string => {
  if (!key) return '';
  return STATUS_LABELS[key] || '';
};

/**
 * 承認ステータスのラベルを取得（フォールバック付き）
 */
export const getApprovalStatusLabel = (key?: string): string => {
  if (!key) return '';
  return APPROVAL_STATUS_LABELS[key] || '';
};

/**
 * 休暇種別のラベルを取得（フォールバック付き）
 */
export const getLeaveTypeLabel = (key: string): string => {
  return LEAVE_TYPE_LABELS[key] || key;
};

/**
 * 休暇ステータスのラベルを取得（フォールバック付き）
 */
export const getLeaveStatusLabel = (key: string): string => {
  return LEAVE_STATUS_LABELS[key] || key;
};

/**
 * ユーザーステータスのラベルを取得（フォールバック付き）
 */
export const getUserStatusLabel = (key: string): string => {
  return USER_STATUS_LABELS[key] || key;
};

/**
 * 退職理由のラベルを取得（フォールバック付き）
 */
export const getRetirementReasonLabel = (key?: string): string => {
  if (!key) return '';
  return RETIREMENT_REASON_LABELS[key] || key;
};

/**
 * 資産ステータスのラベルを取得（フォールバック付き）
 */
export const getAssetStatusLabel = (key: string): string => {
  return ASSET_STATUS_LABELS[key] || key;
};

/**
 * 所有形態のラベルを取得（フォールバック付き）
 */
export const getOwnershipTypeLabel = (key: string): string => {
  return OWNERSHIP_TYPE_LABELS[key] || key;
};

/**
 * SaaSカテゴリのラベルを取得（フォールバック付き）
 */
export const getSaaSCategoryLabel = (key: string): string => {
  return SAAS_CATEGORY_LABELS[key] || key;
};

/**
 * ライセンスタイプのラベルを取得（フォールバック付き）
 */
export const getLicenseTypeLabel = (key: string): string => {
  return LICENSE_TYPE_LABELS[key] || key;
};

/**
 * ライセンスステータスのラベルを取得（フォールバック付き）
 */
export const getLicenseStatusLabel = (key: string): string => {
  return LICENSE_STATUS_LABELS[key] || key;
};

/**
 * セキュリティ評価のラベルを取得（フォールバック付き）
 */
export const getSecurityRatingLabel = (key?: string): string => {
  if (!key) return '';
  return SECURITY_RATING_LABELS[key] || key;
};
