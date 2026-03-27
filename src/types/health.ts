/**
 * 健康管理 - 型定義
 * 健診マスタ、医療機関マスタ、健診予定の型定義
 */

// ============================================================================
// 健診種別マスタ
// ============================================================================

export interface HealthCheckupType {
  id: string;
  tenantId: string;
  name: string;        // "定期健康診断", "雇入時健診"
  code: string;        // "regular", "pre_employment"
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthCheckupTypeInput {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// ============================================================================
// 医療機関マスタ
// ============================================================================

export interface HealthMedicalInstitution {
  id: string;
  tenantId: string;
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  contactPerson?: string | null;
  region?: string | null;
  area?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  examPrices?: InstitutionExamPrice[];
  options?: InstitutionOption[];
}

export interface HealthMedicalInstitutionInput {
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  region?: string;
  area?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// ============================================================================
// 医療機関別 検査項目料金
// ============================================================================

export interface InstitutionExamPrice {
  id: string;
  tenantId: string;
  institutionId: string;
  checkupTypeId: string;
  price: number;
  isActive: boolean;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  checkupTypeName?: string;
}

export interface InstitutionExamPriceInput {
  checkupTypeId: string;
  price: number;
  isActive?: boolean;
  notes?: string;
}

// ============================================================================
// 医療機関別 オプション検査
// ============================================================================

export interface InstitutionOption {
  id: string;
  tenantId: string;
  institutionId: string;
  name: string;
  code?: string | null;
  price: number;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  companyPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstitutionOptionInput {
  name: string;
  code?: string;
  price: number;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  companyPaid?: boolean;
}

// ============================================================================
// フォローアップ記録
// ============================================================================

export type FollowUpTrackingStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface HealthFollowUpRecord {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  checkupId?: string | null;
  followUpDate: Date;
  status: FollowUpTrackingStatus;
  notes?: string | null;
  nextFollowUpDate?: Date | null;
  assignedTo?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 健診予定
// ============================================================================

export type ScheduleStatus = 'scheduled' | 'completed' | 'cancelled';

export interface HealthCheckupSchedule {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  departmentName?: string | null;
  checkupTypeName: string;
  medicalInstitutionId?: string | null;
  scheduledDate: Date;
  scheduledTime?: string | null;
  status: ScheduleStatus;
  fiscalYear: number;
  notes?: string | null;
  region?: string | null;
  selectedOptionIds?: string[] | null;
  totalCost?: number | null;
  companyPaidOptionCost?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthCheckupScheduleInput {
  userId: string;
  userName: string;
  departmentName?: string;
  checkupTypeName: string;
  medicalInstitutionId?: string;
  scheduledDate: Date | string;
  scheduledTime?: string;
  status?: ScheduleStatus;
  fiscalYear: number;
  notes?: string;
  region?: string;
  selectedOptionIds?: string[];
  totalCost?: number;
  companyPaidOptionCost?: number;
}

// ============================================================================
// 予定一覧19列ビュー用 JOIN済みデータ
// ============================================================================

export interface ScheduleFullListRow {
  id: string;
  userName: string;
  departmentName: string | null;
  birthDateWareki: string;          // 和暦生年月日
  age: number;                       // 年度翌4/1時点年齢
  gender: string | null;
  insuranceNumber: string | null;    // 被保険者整理番号
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  region: string | null;             // 地域
  institutionName: string | null;    // 医療機関名
  checkupTypeName: string;           // 健診種類
  scheduledDate: Date;
  scheduledTime: string | null;
  optionNames: string[];             // オプション名一覧
  basePrice: number | null;          // 基本料金
  companyPaidOptionCost: number | null; // 会社負担オプション代
  totalCost: number | null;          // 合計
  status: ScheduleStatus;
  notes: string | null;
  // 元データ参照用
  scheduleId: string;
  userId: string;
  medicalInstitutionId: string | null;
  selectedOptionIds: string[] | null;
}

// ============================================================================
// 健康診断結果の型（既存との互換性）
// ============================================================================

export type OverallResult = 'A' | 'B' | 'C' | 'D' | 'E';
export type CheckupType = 'regular' | 'hiring' | 'specific';
export type FollowUpStatus = 'none' | 'scheduled' | 'completed';

export interface HealthCheckup {
  id: string;
  userId: string;
  userName: string;
  department?: string;
  checkupDate: Date;
  checkupType: CheckupType;
  medicalInstitution: string;
  overallResult: OverallResult;
  requiresReexam: boolean;
  requiresTreatment: boolean;
  requiresGuidance: boolean;
  height?: number;
  weight?: number;
  bmi?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  followUpStatus: FollowUpStatus;
  doctorOpinion?: string;
  findings: string[];
  bloodType?: string;
  selectedExamTypeId?: string;
  selectedOptionIds?: string[];
  totalCost?: number;
}

// ============================================================================
// ストレスチェックの型（既存との互換性）
// ============================================================================

export type StressCheckStatus = 'pending' | 'completed' | 'interview_recommended';

export interface StressCheck {
  id: string;
  userId: string;
  userName: string;
  department?: string;
  fiscalYear: number;
  checkDate: Date;
  status: StressCheckStatus;
  stressFactorsScore: number;
  stressResponseScore: number;
  socialSupportScore: number;
  isHighStress: boolean;
  interviewRequested: boolean;
  interviewDate?: Date;
}

// ============================================================================
// API レスポンス型
// ============================================================================

export interface HealthStatsResponse {
  totalEmployees: number;
  completed: number;
  completionRate: number;
  requiresReexam: number;
  requiresTreatment: number;
  highStress: number;
  stressCheckCompletionRate: number;
}

export interface ScheduleFilters {
  departmentName?: string;
  status?: ScheduleStatus | 'all';
  fiscalYear?: number;
  searchQuery?: string;
}

export interface CheckupFilters {
  departmentName?: string;
  overallResult?: OverallResult | 'all';
  searchQuery?: string;
}

export interface StressCheckFilters {
  departmentName?: string;
  judgment?: 'all' | 'high_stress' | 'normal';
  searchQuery?: string;
}

export interface FollowUpRecordFilters {
  status?: FollowUpTrackingStatus | 'all';
  searchQuery?: string;
  departmentName?: string;
}

export interface ScheduleFiltersExtended extends ScheduleFilters {
  checkupTypeName?: string;
  medicalInstitutionId?: string;
}
