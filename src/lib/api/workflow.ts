/**
 * ワークフロー API クライアント
 *
 * workflow-settings, workflows の取得・更新を一元管理。
 */

import { apiGet, apiPut } from './fetch-helper';

// ── 型定義 ──────────────────────────────────

export interface WorkflowSettings {
  defaultApprovalDeadlineDays?: number;
  enableAutoEscalation?: boolean;
  escalationReminderDays?: number;
  enableAutoApproval?: boolean;
  autoApprovalThreshold?: number;
  requireCommentOnReject?: boolean;
  allowParallelApproval?: boolean;
  enableProxyApproval?: boolean;
}

// ── ワークフロー設定 ──────────────────────────────────

/** ワークフロー設定を取得 */
export function fetchWorkflowSettings() {
  return apiGet<WorkflowSettings>('/api/workflow-settings');
}

/** ワークフロー設定を更新 */
export function saveWorkflowSettings(settings: Partial<WorkflowSettings>) {
  return apiPut<void>('/api/workflow-settings', settings);
}

// ── ワークフロー一覧 ──────────────────────────────────

/** ワークフロー一覧を取得 */
export function fetchWorkflows() {
  return apiGet<unknown[]>('/api/workflows');
}
