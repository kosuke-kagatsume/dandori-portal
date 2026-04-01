/**
 * 給与設定 API クライアント
 *
 * offices, payroll-settings, municipalities, allowance-items,
 * deduction-items, pay-categories, closing-day-groups の
 * CRUD操作を一元管理。
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './fetch-helper';
import type {
  Office,
  OfficeOption,
  OfficePayload,
  PayrollGeneralSettings,
  Municipality,
  AllowanceItem,
  DeductionMasterItem,
  PayCategory,
  ClosingDayGroup,
} from '@/types/payroll';

// ── 事業所（offices） ──────────────────

export function fetchOffices() {
  return apiGet<{ offices: Office[] }>('/api/settings/payroll/offices');
}

/** セレクトボックス用（id + name のみ） */
export function fetchOfficeOptions() {
  return apiGet<{ offices: OfficeOption[] }>('/api/settings/payroll/offices');
}

export function createOffice(payload: OfficePayload) {
  return apiPost<void>('/api/settings/payroll/offices', payload);
}

export function updateOffice(id: string, payload: OfficePayload) {
  return apiPatch<void>(`/api/settings/payroll/offices?id=${id}`, payload);
}

export function deleteOffice(id: string) {
  return apiDelete<void>('/api/settings/payroll/offices', { id });
}

// ── 給与全般設定（payroll-settings） ──────────────────

export function fetchPayrollSettings() {
  return apiGet<PayrollGeneralSettings>('/api/payroll-settings');
}

export function savePayrollSettings(settings: Partial<PayrollGeneralSettings>) {
  return apiPut<void>('/api/payroll-settings', settings);
}

// ── 住民税・市区町村（municipalities） ──────────────────

export function fetchMunicipalities(tenantId: string) {
  return apiGet<Municipality[]>('/api/settings/payroll/municipalities', { tenantId });
}

export function createMunicipality(tenantId: string, payload: Omit<Municipality, 'id'>) {
  return apiPost<void>(`/api/settings/payroll/municipalities?tenantId=${tenantId}`, payload);
}

export function updateMunicipality(tenantId: string, payload: Municipality) {
  return apiPut<void>(`/api/settings/payroll/municipalities?tenantId=${tenantId}`, payload);
}

export function toggleMunicipality(tenantId: string, id: string, isActive: boolean) {
  return apiPatch<void>(`/api/settings/payroll/municipalities?tenantId=${tenantId}`, { id, isActive });
}

export function deleteMunicipality(tenantId: string, id: string) {
  return apiDelete<void>(`/api/settings/payroll/municipalities?tenantId=${tenantId}`, { id });
}

// ── 手当項目（allowance-items） ──────────────────

export function fetchAllowanceItems(tenantId: string) {
  return apiGet<AllowanceItem[]>('/api/settings/payroll/allowance-items', { tenantId });
}

export function saveAllowanceItem(tenantId: string, payload: Omit<AllowanceItem, 'id'> & { id?: string }) {
  const method = payload.id ? apiPut : apiPost;
  return method<void>(`/api/settings/payroll/allowance-items?tenantId=${tenantId}`, payload);
}

export function toggleAllowanceItem(tenantId: string, id: string, isActive: boolean) {
  return apiPatch<void>(`/api/settings/payroll/allowance-items?tenantId=${tenantId}`, { id, isActive });
}

export function deleteAllowanceItem(tenantId: string, id: string) {
  return apiDelete<void>(`/api/settings/payroll/allowance-items?tenantId=${tenantId}`, { id });
}

// ── 控除項目（deduction-items） ──────────────────

export function fetchDeductionItems(tenantId: string) {
  return apiGet<DeductionMasterItem[]>('/api/settings/payroll/deduction-items', { tenantId });
}

export function saveDeductionItem(tenantId: string, payload: Omit<DeductionMasterItem, 'id'> & { id?: string }) {
  const method = payload.id ? apiPut : apiPost;
  return method<void>(`/api/settings/payroll/deduction-items?tenantId=${tenantId}`, payload);
}

export function toggleDeductionItem(tenantId: string, id: string, isActive: boolean) {
  return apiPatch<void>(`/api/settings/payroll/deduction-items?tenantId=${tenantId}`, { id, isActive });
}

export function deleteDeductionItem(tenantId: string, id: string) {
  return apiDelete<void>(`/api/settings/payroll/deduction-items?tenantId=${tenantId}`, { id });
}

// ── 給与カテゴリ（pay-categories） ──────────────────

export function fetchPayCategories(tenantId: string) {
  return apiGet<PayCategory[]>('/api/settings/payroll/pay-categories', { tenantId });
}

export function savePayCategory(tenantId: string, payload: Omit<PayCategory, 'id'> & { id?: string }) {
  const method = payload.id ? apiPut : apiPost;
  return method<void>(`/api/settings/payroll/pay-categories?tenantId=${tenantId}`, payload);
}

export function togglePayCategory(tenantId: string, id: string, isActive: boolean) {
  return apiPatch<void>(`/api/settings/payroll/pay-categories?tenantId=${tenantId}`, { id, isActive });
}

export function deletePayCategory(tenantId: string, id: string) {
  return apiDelete<void>(`/api/settings/payroll/pay-categories?tenantId=${tenantId}`, { id });
}

// ── 締め日グループ（closing-day-groups） ──────────────────

export function fetchClosingDayGroups(tenantId: string) {
  return apiGet<ClosingDayGroup[]>('/api/settings/payroll/closing-day-groups', { tenantId });
}

export function saveClosingDayGroup(tenantId: string, payload: Omit<ClosingDayGroup, 'id'> & { id?: string }) {
  const method = payload.id ? apiPut : apiPost;
  return method<void>(`/api/settings/payroll/closing-day-groups?tenantId=${tenantId}`, payload);
}

export function toggleClosingDayGroup(tenantId: string, id: string, isActive: boolean) {
  return apiPatch<void>(`/api/settings/payroll/closing-day-groups?tenantId=${tenantId}`, { id, isActive });
}

export function deleteClosingDayGroup(tenantId: string, id: string) {
  return apiDelete<void>(`/api/settings/payroll/closing-day-groups?tenantId=${tenantId}`, { id });
}
