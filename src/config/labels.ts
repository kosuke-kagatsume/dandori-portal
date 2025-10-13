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
