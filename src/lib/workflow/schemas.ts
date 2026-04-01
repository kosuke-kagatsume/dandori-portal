/**
 * ワークフロー申請 Zodスキーマ定義
 *
 * 各申請タイプのバリデーションスキーマと型定義を集約。
 */

import * as z from 'zod';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import type { WorkflowType } from '@/lib/workflow-store';

// ── スキーマ定義 ──────────────────────────────────

export const leaveRequestSchema = z.object({
  leaveType: z.enum(['paid_leave', 'sick_leave', 'special_leave', 'half_day', 'compensatory']).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  reason: z.string().min(1, '理由を入力してください').optional(),
  handover: z.string().min(1, '引き継ぎ事項を入力してください').optional(),
  emergencyContact: z.string().optional(),
});

export const expenseClaimSchema = z.object({
  expenseType: z.enum(['transportation', 'accommodation', 'entertainment', 'supplies', 'other']),
  amount: z.number().min(1, '金額を入力してください'),
  expenseDate: z.date(),
  purpose: z.string().min(10, '用途を10文字以上入力してください'),
  client: z.string().optional(),
  projectCode: z.string().optional(),
  hasReceipt: z.boolean(),
  receiptImages: z.array(z.string()).optional(),
});

export const overtimeRequestSchema = z.object({
  overtimeDate: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  hours: z.number().min(0.5, '0.5時間以上を入力してください'),
  reason: z.string().min(10, '理由を10文字以上入力してください'),
  projectCode: z.string().optional(),
});

export const businessTripSchema = z.object({
  destination: z.string().min(1, '出張先を入力してください'),
  startDate: z.date(),
  endDate: z.date(),
  purpose: z.string().min(10, '目的を10文字以上入力してください'),
  transportation: z.enum(['train', 'airplane', 'car', 'other']),
  accommodation: z.boolean(),
  estimatedCost: z.number().min(0),
  client: z.string().optional(),
});

export const remoteWorkSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  workLocation: z.enum(['home', 'satellite_office', 'other']),
  locationDetail: z.string().optional(),
  reason: z.string().min(10, '理由を10文字以上入力してください'),
  equipment: z.array(z.string()).optional(),
  securityMeasures: z.string().min(10, 'セキュリティ対策を入力してください'),
});

// ── 型定義 ──────────────────────────────────

export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;
export type ExpenseClaimFormData = z.infer<typeof expenseClaimSchema>;
export type OvertimeRequestFormData = z.infer<typeof overtimeRequestSchema>;
export type BusinessTripFormData = z.infer<typeof businessTripSchema>;
export type RemoteWorkFormData = z.infer<typeof remoteWorkSchema>;

// ── 共通Props型 ──────────────────────────────────

export interface FormComponentProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  onFlowUpdate: (type: WorkflowType, details: Record<string, unknown>) => void;
}

// ── スキーマ取得ヘルパー ──────────────────────────────────

export function getSchemaByType(requestType: WorkflowType | null) {
  switch (requestType) {
    case 'leave_request':
      return leaveRequestSchema;
    case 'expense_claim':
      return expenseClaimSchema;
    case 'overtime_request':
      return overtimeRequestSchema;
    case 'business_trip':
      return businessTripSchema;
    case 'remote_work':
      return remoteWorkSchema;
    default:
      return z.object({});
  }
}
