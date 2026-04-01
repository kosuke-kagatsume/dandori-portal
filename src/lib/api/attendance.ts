/**
 * 勤怠管理 API クライアント
 *
 * attendance-settings, work-rules, holidays, shifts, punches の
 * 取得・更新を一元管理。6+コンポーネントからの重複fetchを解消。
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './fetch-helper';
import type {
  AttendanceSettings,
  WorkRuleRecord,
  WorkRulePayload,
  CompanyHoliday,
  CreateHolidayPayload,
  WorkPattern,
  PunchRecord,
  ShiftData,
  SaveShiftPayload,
  AutoGenerateShiftsPayload,
} from '@/types/attendance';

// ── 勤怠設定（attendance-settings） ──────────────────

/** 勤怠設定を取得（集計カテゴリ・打刻丸めルール等） */
export function fetchAttendanceSettings() {
  return apiGet<AttendanceSettings>('/api/attendance-settings');
}

/** 勤怠設定を更新（部分更新） */
export function saveAttendanceSettings(settings: Partial<AttendanceSettings>) {
  return apiPut<void>('/api/attendance-settings', settings);
}

// ── 就業ルール（work-rules） ──────────────────

/** 就業ルール一覧を取得 */
export function fetchWorkRules(params?: { tenantId?: string; activeOnly?: boolean }) {
  return apiGet<WorkRuleRecord[]>('/api/attendance-master/work-rules', {
    tenantId: params?.tenantId,
    activeOnly: params?.activeOnly ? 'true' : undefined,
  });
}

/** 就業ルールを作成 */
export function createWorkRule(payload: WorkRulePayload) {
  return apiPost<void>('/api/attendance-master/work-rules', payload);
}

/** 就業ルールを更新 */
export function updateWorkRule(id: string, payload: WorkRulePayload) {
  return apiPatch<void>(`/api/attendance-master/work-rules?id=${id}`, payload);
}

/** 就業ルールを削除 */
export function deleteWorkRule(id: string) {
  return apiDelete<void>(`/api/attendance-master/work-rules`, { id });
}

// ── 休日マスタ（holidays） ──────────────────

/** 休日一覧を取得（年度指定） */
export function fetchHolidays(fiscalYear: number) {
  return apiGet<{ holidays: CompanyHoliday[] }>('/api/attendance-master/holidays', {
    fiscalYear,
  });
}

/** 休日を一括更新 */
export function saveHolidays(holidays: CompanyHoliday[]) {
  return apiPut<void>('/api/attendance-master/holidays', { holidays });
}

/** 休日を作成 */
export function createHoliday(payload: CreateHolidayPayload) {
  return apiPost<void>('/api/attendance-master/holidays', payload);
}

/** 休日を削除 */
export function deleteHoliday(id: string) {
  return apiDelete<void>('/api/attendance-master/holidays', { id });
}

// ── 勤務パターン（work-patterns） ──────────────────

/** 勤務パターン一覧を取得 */
export function fetchWorkPatterns(activeOnly = true) {
  return apiGet<{ patterns: WorkPattern[] }>('/api/attendance-master/work-patterns', {
    activeOnly: activeOnly ? 'true' : undefined,
  });
}

// ── 打刻（punches） ──────────────────

/** 指定日の打刻記録を取得 */
export function fetchPunches(userId: string, date: string) {
  return apiGet<{ punches: PunchRecord[] }>('/api/attendance/punches', {
    userId,
    date,
  });
}

// ── シフト（shifts） ──────────────────

/** 指定月のシフトデータを取得 */
export function fetchShifts(year: number, month: number) {
  return apiGet<ShiftData>('/api/attendance/shifts', { year, month });
}

/** シフトを保存（1件） */
export function saveShift(payload: SaveShiftPayload) {
  return apiPost<void>('/api/attendance/shifts', payload);
}

/** シフトを削除 */
export function deleteShift(userId: string, date: string) {
  return apiDelete<void>('/api/attendance/shifts', { userId, date });
}

/** シフトを自動生成 */
export function autoGenerateShifts(payload: AutoGenerateShiftsPayload) {
  return apiPost<{ message: string }>('/api/attendance/shifts/auto-generate', payload);
}

// ── 勤怠データ（attendance） ──────────────────

/** チーム勤怠データを取得（期間指定） */
export function fetchTeamAttendance(tenantId: string, startDate: string, endDate: string) {
  return apiGet<unknown[]>('/api/attendance', { tenantId, startDate, endDate });
}
