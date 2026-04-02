/**
 * 健康管理 — 型定義・バッジヘルパー・データマッピング
 */

import { format } from 'date-fns';
import { getFiscalYear } from '@/lib/utils';
import type {
  HealthCheckup, StressCheck,
  OverallResult, CheckupType, FollowUpStatus, StressCheckStatus,
} from '@/types/health';
import type { HealthCheckupExport, StressCheckExport } from '@/lib/csv/csv-export';
import type { HealthCheckupForPDF, StressCheckForPDF } from '@/lib/pdf/health-report-pdf';

// ── API レスポンス型 ──────────────────────────────────

export interface APIHealthCheckup {
  id: string;
  userId: string;
  userName: string;
  department?: string;
  checkupDate: string;
  checkupType: string;
  medicalInstitution: string;
  overallResult: string;
  requiresReexam: boolean;
  requiresTreatment: boolean;
  requiresGuidance?: boolean;
  height?: number;
  weight?: number;
  bmi?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  followUpStatus?: string;
  doctorOpinion?: string;
  findings?: Array<{ finding: string }>;
}

export interface APIStressCheck {
  id: string;
  userId: string;
  userName: string;
  department?: string;
  fiscalYear: number;
  checkDate: string;
  status: string;
  stressFactorsScore?: number;
  stressResponseScore?: number;
  socialSupportScore?: number;
  isHighStress: boolean;
  interviewRequested: boolean;
  interviewDate?: string;
}

// ── ダイアログ用型 ──────────────────────────────────

export interface FollowUpRecord {
  id: string;
  userId: string;
  userName: string;
  followUpDate: Date | undefined;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
  nextFollowUpDate: Date | undefined;
}

export interface InterviewRecord {
  id: string;
  userId: string;
  userName: string;
  interviewDate: Date | undefined;
  interviewType: 'stress_interview' | 'health_guidance' | 'return_to_work';
  doctorName: string;
  notes: string;
  outcome: string;
  nextAction: string;
}

// ── バッジヘルパー ──────────────────────────────────

export const getResultBadgeColor = (result: OverallResult) => {
  switch (result) {
    case 'A': return 'bg-green-100 text-green-800';
    case 'B': return 'bg-blue-100 text-blue-800';
    case 'C': return 'bg-yellow-100 text-yellow-800';
    case 'D': return 'bg-orange-100 text-orange-800';
    case 'E': return 'bg-red-100 text-red-800';
  }
};

export const getResultLabel = (result: OverallResult) => {
  switch (result) {
    case 'A': return '異常なし';
    case 'B': return '軽度異常';
    case 'C': return '要経過観察';
    case 'D': return '要精密検査';
    case 'E': return '要治療';
  }
};

export const resultColorMap: Record<string, string> = {
  A: '#22c55e', B: '#3b82f6', C: '#eab308', D: '#f97316', E: '#ef4444',
};

export const resultLabelMap: Record<string, string> = {
  A: 'A: 異常なし', B: 'B: 軽度異常', C: 'C: 要経過観察', D: 'D: 要精密検査', E: 'E: 要治療',
};

// ── API→ドメインマッピング ──────────────────────────────────

export function mapAPICheckups(apiCheckups: APIHealthCheckup[]): HealthCheckup[] {
  return apiCheckups.map(c => ({
    id: c.id,
    userId: c.userId,
    userName: c.userName,
    department: c.department || '',
    checkupDate: new Date(c.checkupDate),
    checkupType: (c.checkupType as CheckupType) || 'regular',
    medicalInstitution: c.medicalInstitution,
    overallResult: (c.overallResult as OverallResult) || 'A',
    requiresReexam: c.requiresReexam,
    requiresTreatment: c.requiresTreatment,
    requiresGuidance: c.requiresGuidance ?? false,
    height: c.height,
    weight: c.weight,
    bmi: c.bmi,
    bloodPressureSystolic: c.bloodPressureSystolic,
    bloodPressureDiastolic: c.bloodPressureDiastolic,
    followUpStatus: (c.followUpStatus as FollowUpStatus) || 'none',
    doctorOpinion: c.doctorOpinion,
    findings: c.findings?.map(f => f.finding) || [],
  }));
}

export function mapAPIStressChecks(apiStress: APIStressCheck[]): StressCheck[] {
  return apiStress.map(s => ({
    id: s.id,
    userId: s.userId,
    userName: s.userName,
    department: s.department || '',
    fiscalYear: s.fiscalYear,
    checkDate: new Date(s.checkDate),
    status: (s.status as StressCheckStatus) || 'pending',
    stressFactorsScore: s.stressFactorsScore ?? 0,
    stressResponseScore: s.stressResponseScore ?? 0,
    socialSupportScore: s.socialSupportScore ?? 0,
    isHighStress: s.isHighStress,
    interviewRequested: s.interviewRequested,
    interviewDate: s.interviewDate ? new Date(s.interviewDate) : undefined,
  }));
}

// ── エクスポート用マッピング ──────────────────────────────────

export function checkupToExport(c: HealthCheckup): HealthCheckupExport {
  return {
    id: c.id,
    userId: c.userId,
    userName: c.userName,
    departmentName: c.department || '',
    checkupDate: format(c.checkupDate, 'yyyy-MM-dd'),
    checkupType: c.checkupType,
    medicalInstitution: c.medicalInstitution,
    fiscalYear: getFiscalYear(c.checkupDate),
    overallResult: c.overallResult,
    requiresReexam: c.requiresReexam,
    requiresTreatment: c.requiresTreatment,
    requiresGuidance: c.requiresGuidance || false,
    height: c.height,
    weight: c.weight,
    bmi: c.bmi,
    bloodPressureSystolic: c.bloodPressureSystolic,
    bloodPressureDiastolic: c.bloodPressureDiastolic,
    followUpStatus: c.followUpStatus,
    findings: c.findings,
  };
}

export function stressCheckToExport(s: StressCheck): StressCheckExport {
  return {
    id: s.id,
    userId: s.userId,
    userName: s.userName,
    departmentName: s.department || '',
    fiscalYear: s.fiscalYear,
    checkDate: format(s.checkDate, 'yyyy-MM-dd'),
    status: s.status,
    stressFactorsScore: s.stressFactorsScore,
    stressResponseScore: s.stressResponseScore,
    socialSupportScore: s.socialSupportScore,
    totalScore: s.stressFactorsScore + s.stressResponseScore + s.socialSupportScore,
    isHighStress: s.isHighStress,
    highStressReason: s.isHighStress ? 'ストレス度合いが高い' : undefined,
    interviewRequested: s.interviewRequested,
    interviewScheduled: false,
    interviewCompleted: false,
  };
}

export function checkupToPDF(c: HealthCheckup): HealthCheckupForPDF {
  return {
    id: c.id,
    userId: c.userId,
    userName: c.userName,
    departmentName: c.department || '',
    checkupDate: c.checkupDate,
    checkupType: c.checkupType,
    medicalInstitution: c.medicalInstitution,
    fiscalYear: getFiscalYear(c.checkupDate),
    overallResult: c.overallResult,
    requiresReexam: c.requiresReexam,
    requiresTreatment: c.requiresTreatment,
    requiresGuidance: c.requiresGuidance || false,
    height: c.height,
    weight: c.weight,
    bmi: c.bmi,
    bloodPressureSystolic: c.bloodPressureSystolic,
    bloodPressureDiastolic: c.bloodPressureDiastolic,
    followUpStatus: c.followUpStatus,
    findings: c.findings?.map(f => ({ category: f, finding: f, severity: 'warning' })),
  };
}

export function stressCheckToPDF(s: StressCheck): StressCheckForPDF {
  return {
    id: s.id,
    userId: s.userId,
    userName: s.userName,
    departmentName: s.department || '',
    fiscalYear: s.fiscalYear,
    checkDate: s.checkDate,
    status: s.status,
    stressFactorsScore: s.stressFactorsScore,
    stressResponseScore: s.stressResponseScore,
    socialSupportScore: s.socialSupportScore,
    totalScore: s.stressFactorsScore + s.stressResponseScore + s.socialSupportScore,
    isHighStress: s.isHighStress,
    highStressReason: s.isHighStress ? 'ストレス度合いが高い' : undefined,
    interviewRequested: s.interviewRequested,
    interviewScheduled: false,
    interviewCompleted: false,
  };
}
