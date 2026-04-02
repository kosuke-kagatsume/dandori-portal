/**
 * ワークフロー — ラベル・カラー・アイコン・進捗計算
 */

import type { WorkflowRequest, WorkflowType, ApproverRole } from '@/lib/workflow-store';
import {
  FileText, Calendar, DollarSign, Clock, Briefcase, Package,
  Users, Home, Building2, UserCheck,
} from 'lucide-react';

export function getWorkflowTypeIcon(type: WorkflowType) {
  const icons = {
    leave_request: Calendar,
    expense_claim: DollarSign,
    overtime_request: Clock,
    business_trip: Briefcase,
    purchase_request: Package,
    document_approval: FileText,
    shift_change: Users,
    remote_work: Home,
    bank_account_change: Building2,
    family_info_change: Users,
    commute_route_change: UserCheck,
  };
  return icons[type] || FileText;
}

export function getWorkflowTypeLabel(type: WorkflowType): string {
  const labels = {
    leave_request: '休暇申請',
    expense_claim: '経費申請',
    overtime_request: '残業申請',
    business_trip: '出張申請',
    purchase_request: '購買申請',
    document_approval: '書類承認',
    shift_change: 'シフト変更',
    remote_work: 'リモートワーク申請',
    bank_account_change: '給与振込口座変更',
    family_info_change: '家族情報変更',
    commute_route_change: '通勤経路変更',
  };
  return labels[type] || '申請';
}

export function getStatusLabel(status: WorkflowRequest['status']): string {
  const labels: Record<string, string> = {
    draft: '下書き',
    pending: '申請中',
    in_review: '確認中',
    partially_approved: '一部承認',
    approved: '承認済み',
    rejected: '却下',
    cancelled: '取消',
    completed: '完了',
    escalated: 'エスカレーション',
  };
  return labels[status] || status;
}

export function getStatusColor(status: WorkflowRequest['status']): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-blue-100 text-blue-800',
    in_review: 'bg-yellow-100 text-yellow-800',
    partially_approved: 'bg-indigo-100 text-indigo-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    completed: 'bg-green-100 text-green-800',
    escalated: 'bg-orange-100 text-orange-800',
  };
  return colors[status] || '';
}

export function getPriorityLabel(priority: WorkflowRequest['priority']): string {
  const labels = { low: '低', normal: '通常', high: '高', urgent: '緊急' };
  return labels[priority] || priority;
}

export function getPriorityColor(priority: WorkflowRequest['priority']): string {
  const colors = {
    low: 'bg-gray-100 text-gray-600',
    normal: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600',
  };
  return colors[priority] || '';
}

export function getApproverRoleLabel(role: ApproverRole): string {
  const labels = {
    direct_manager: '直属上司',
    department_head: '部門長',
    hr_manager: '人事部長',
    finance_manager: '経理部長',
    general_manager: '役員',
    ceo: '社長',
  };
  return labels[role] || role;
}

export function calculateProgress(request: WorkflowRequest): number {
  if (request.status === 'completed' || request.status === 'approved') return 100;
  if (request.status === 'rejected' || request.status === 'cancelled') return 0;
  const totalSteps = request.approvalSteps.length;
  const completedSteps = request.approvalSteps.filter(
    s => s.status === 'approved' || s.status === 'skipped'
  ).length;
  return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
}
