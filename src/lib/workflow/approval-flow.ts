/**
 * ワークフロー承認フロー計算ロジック
 *
 * 申請タイプ・金額・日数に基づいて承認者フローを自動構築する。
 */

import { differenceInDays } from 'date-fns';
import type { WorkflowType, ApproverRole } from '@/lib/workflow-store';

// ── 型定義 ──────────────────────────────────

export interface ApprovalStep {
  role: ApproverRole;
  name: string;
  id: string;
  required: boolean;
}

export interface ApproverInfo {
  id: string;
  name: string;
}

// ── ロール名マッピング ──────────────────────────────────

const ROLE_NAMES: Record<ApproverRole, string> = {
  direct_manager: '直属上司',
  department_head: '部門長',
  hr_manager: '人事部長',
  finance_manager: '経理部長',
  general_manager: '役員',
  ceo: '社長',
};

// ── 承認者解決 ──────────────────────────────────

export interface ApproversByRole {
  direct_manager?: { id: string; name: string };
  department_head?: { id: string; name: string };
  hr_manager?: { id: string; name: string };
  finance_manager?: { id: string; name: string };
  general_manager?: { id: string; name: string };
  ceo?: { id: string; name: string };
}

export function getApproverInfo(
  role: ApproverRole,
  approversByRole: ApproversByRole,
): ApproverInfo {
  const approver = approversByRole[role];
  if (approver) {
    return { id: approver.id, name: approver.name };
  }
  return { id: 'unknown', name: ROLE_NAMES[role] || '承認者' };
}

// ── 承認フロー構築 ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildApprovalFlow(
  type: WorkflowType,
  details: Record<string, unknown>,
  approversByRole: ApproversByRole,
): ApprovalStep[] {
  const flow: ApprovalStep[] = [];

  const addStep = (role: ApproverRole, required = true) => {
    const info = getApproverInfo(role, approversByRole);
    flow.push({ role, name: info.name, id: info.id, required });
  };

  // 直属上司は必須
  addStep('direct_manager');

  switch (type) {
    case 'leave_request':
      if ((details.days as number) > 3) addStep('department_head');
      if ((details.days as number) > 5) addStep('hr_manager');
      break;

    case 'expense_claim':
      if ((details.amount as number) > 50000) addStep('department_head');
      if ((details.amount as number) > 100000) addStep('finance_manager');
      if ((details.amount as number) > 500000) addStep('general_manager');
      break;

    case 'overtime_request':
      if ((details.hours as number) > 20) {
        addStep('department_head');
        addStep('hr_manager');
      }
      break;

    case 'business_trip':
      addStep('department_head');
      if ((details.estimatedCost as number) > 200000 || details.transportation === 'airplane') {
        addStep('general_manager');
      }
      break;

    case 'remote_work':
      if (differenceInDays(details.endDate as Date, details.startDate as Date) > 30) {
        addStep('department_head');
        addStep('hr_manager');
      }
      break;

    case 'bank_account_change':
    case 'family_info_change':
    case 'commute_route_change':
      addStep('hr_manager');
      break;
  }

  return flow;
}

// ── タイトル生成 ──────────────────────────────────

import { format } from 'date-fns';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRequestTitle(type: WorkflowType, data: Record<string, any>): string {
  switch (type) {
    case 'leave_request':
      return `${data.leaveType === 'paid_leave' ? '有給' : ''}休暇申請（${format(data.startDate, 'MM/dd')}〜${format(data.endDate, 'MM/dd')}）`;
    case 'expense_claim':
      return `経費精算（${data.amount.toLocaleString()}円）`;
    case 'overtime_request':
      return `残業申請（${format(data.overtimeDate, 'MM/dd')} ${data.hours}時間）`;
    case 'business_trip':
      return `出張申請（${data.destination}）`;
    case 'remote_work':
      return `リモートワーク申請（${format(data.startDate, 'MM/dd')}〜${format(data.endDate, 'MM/dd')}）`;
    case 'bank_account_change':
      return `給与振込口座変更申請（${data.bankName || ''}）`;
    case 'family_info_change':
      return '家族情報変更申請';
    case 'commute_route_change':
      return '通勤経路変更申請';
    default:
      return '新規申請';
  }
}

// ── 優先度計算 ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPriority(type: WorkflowType, data: Record<string, any>): 'low' | 'normal' | 'high' | 'urgent' {
  switch (type) {
    case 'leave_request': {
      const daysUntilLeave = differenceInDays(data.startDate, new Date());
      if (daysUntilLeave < 3) return 'urgent';
      if (daysUntilLeave < 7) return 'high';
      return 'normal';
    }
    case 'expense_claim':
      if (data.amount > 100000) return 'high';
      return 'normal';
    case 'overtime_request':
      if (data.hours > 20) return 'high';
      return 'normal';
    default:
      return 'normal';
  }
}
