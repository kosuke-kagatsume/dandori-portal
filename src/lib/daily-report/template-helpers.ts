/**
 * 日報テンプレート — 型定義・定数・ヘルパー関数
 */

import type { FieldType, SubmissionRule, TemplateField, ApproverType } from '@/lib/store/daily-report-template-store';

// === 定数 ===

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'テキスト',
  textarea: 'テキストエリア',
  number: '数値',
  select: '単一選択',
  multiselect: '複数選択',
  date: '日付',
  time: '時刻',
  timerange: '時間帯',
  file: 'ファイル',
};

export const FIELD_TYPES: FieldType[] = [
  'text', 'textarea', 'number',
  'select', 'multiselect',
  'date', 'time', 'timerange', 'file',
];

export const SUBMISSION_RULE_LABELS: Record<SubmissionRule, string> = {
  required_on_clockout: '退勤時必須',
  prompt_after_clockout: '退勤後催促',
  optional: '任意',
};

// === フォームデータ型 ===

export interface TemplateFormData {
  name: string;
  description: string;
  departmentIds: string[];
  submissionRule: SubmissionRule;
  reminderHours: number;
  approvalRequired: boolean;
  approverType: ApproverType;
  approverIds: string[];
  isActive: boolean;
  fields: TemplateField[];
}

export interface FieldFormData {
  label: string;
  fieldType: FieldType;
  required: boolean;
  placeholder: string;
  options: string; // 改行区切り
}

export const defaultTemplateForm: TemplateFormData = {
  name: '',
  description: '',
  departmentIds: [],
  submissionRule: 'optional',
  reminderHours: 2,
  approvalRequired: false,
  approverType: 'direct_manager',
  approverIds: [],
  isActive: true,
  fields: [],
};

export const defaultFieldForm: FieldFormData = {
  label: '',
  fieldType: 'text',
  required: false,
  placeholder: '',
  options: '',
};

// === ユーティリティ ===

export function generateFieldId(): string {
  return `fld-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}
