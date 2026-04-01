/**
 * 健康管理 API クライアント
 *
 * checkups, stress-checks, schedules, master（検診種別・医療機関）の
 * CRUD操作を一元管理。store・page・dialogからの重複fetchを解消。
 */

import { apiGet, apiPost, apiPut, apiDelete } from './fetch-helper';

// ── 健康診断 ──────────────────────────────────

/** 健康診断一覧を取得 */
export function fetchCheckups(params: { tenantId: string; userId?: string }) {
  return apiGet<unknown[]>('/api/health/checkups', params);
}

/** 健康診断を登録 */
export function createCheckup(payload: Record<string, unknown>) {
  return apiPost<unknown>('/api/health/checkups', payload);
}

// ── ストレスチェック ──────────────────────────────────

/** ストレスチェック一覧を取得 */
export function fetchStressChecks(params: { tenantId: string; userId?: string }) {
  return apiGet<unknown[]>('/api/health/stress-checks', params);
}

// ── フォローアップ ──────────────────────────────────

/** フォローアップ/面談記録を作成 */
export function createFollowUp(payload: Record<string, unknown>) {
  return apiPost<void>('/api/health/follow-up', payload);
}

// ── スケジュール ──────────────────────────────────

/** 健診スケジュール一覧を取得 */
export function fetchSchedules(params: {
  tenantId?: string;
  fiscalYear?: number;
  userId?: string;
  enrich?: boolean;
}) {
  return apiGet<unknown[]>('/api/health/schedules', {
    ...params,
    enrich: params.enrich ? 'true' : undefined,
  });
}

/** 健診スケジュールを作成 */
export function createSchedule(payload: Record<string, unknown>) {
  return apiPost<unknown>('/api/health/schedules', payload);
}

/** 健診スケジュールを更新 */
export function updateSchedule(id: string, payload: Record<string, unknown>) {
  return apiPut<unknown>(`/api/health/schedules/${id}`, payload);
}

/** 健診スケジュールを削除 */
export function deleteSchedule(id: string) {
  return apiDelete<void>(`/api/health/schedules/${id}`);
}

/** 健診スケジュールのステータスを更新 */
export function updateScheduleStatus(id: string, status: string) {
  return apiPut<unknown>(`/api/health/schedules/${id}`, { status });
}

// ── マスタ: 検診種別 ──────────────────────────────────

/** 検診種別一覧を取得 */
export function fetchCheckupTypes(tenantId: string) {
  return apiGet<unknown[]>('/api/health/master/checkup-types', { tenantId });
}

/** 検診種別を作成 */
export function createCheckupType(payload: Record<string, unknown>) {
  return apiPost<unknown>('/api/health/master/checkup-types', payload);
}

/** 検診種別を更新 */
export function updateCheckupType(payload: Record<string, unknown>) {
  return apiPut<unknown>('/api/health/master/checkup-types', payload);
}

/** 検診種別を削除 */
export function deleteCheckupType(id: string) {
  return apiDelete<void>('/api/health/master/checkup-types', { id });
}

// ── マスタ: 医療機関 ──────────────────────────────────

/** 医療機関一覧を取得 */
export function fetchInstitutions(tenantId: string) {
  return apiGet<unknown[]>('/api/health/master/institutions', { tenantId });
}

/** 医療機関を作成 */
export function createInstitution(payload: Record<string, unknown>) {
  return apiPost<unknown>('/api/health/master/institutions', payload);
}

/** 医療機関を更新 */
export function updateInstitution(payload: Record<string, unknown>) {
  return apiPut<unknown>('/api/health/master/institutions', payload);
}

/** 医療機関を削除 */
export function deleteInstitution(id: string) {
  return apiDelete<void>('/api/health/master/institutions', { id });
}

// ── マスタ: 検査料金 ──────────────────────────────────

/** 医療機関の検査料金を取得 */
export function fetchExamPrices(institutionId: string) {
  return apiGet<unknown[]>(`/api/health/master/institutions/${institutionId}/exam-prices`);
}

/** 検査料金を作成 */
export function createExamPrice(payload: Record<string, unknown>) {
  return apiPost<unknown>(`/api/health/master/institutions/${payload.institutionId}/exam-prices`, payload);
}

/** 検査料金を更新 */
export function updateExamPrice(payload: Record<string, unknown>) {
  return apiPut<unknown>('/api/health/master/institutions/_/exam-prices', payload);
}

/** 検査料金を削除 */
export function deleteExamPrice(id: string) {
  return apiDelete<void>('/api/health/master/institutions/_/exam-prices', { id });
}

// ── マスタ: オプション ──────────────────────────────────

/** 医療機関のオプションを取得 */
export function fetchInstitutionOptions(institutionId: string) {
  return apiGet<unknown[]>(`/api/health/master/institutions/${institutionId}/options`);
}

/** オプションを作成 */
export function createInstitutionOption(payload: Record<string, unknown>) {
  return apiPost<unknown>(`/api/health/master/institutions/${payload.institutionId}/options`, payload);
}

/** オプションを更新 */
export function updateInstitutionOption(payload: Record<string, unknown>) {
  return apiPut<unknown>('/api/health/master/institutions/_/options', payload);
}

/** オプションを削除 */
export function deleteInstitutionOption(id: string) {
  return apiDelete<void>('/api/health/master/institutions/_/options', { id });
}
