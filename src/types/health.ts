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
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthMedicalInstitutionInput {
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
  sortOrder?: number;
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
