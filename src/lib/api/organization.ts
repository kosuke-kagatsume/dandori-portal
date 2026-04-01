/**
 * 組織管理 API クライアント
 *
 * organization, departments, members の
 * 取得・更新を一元管理。store・コンポーネントからの重複fetchを解消。
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './fetch-helper';

// ── 型定義 ──────────────────────────────────

export interface OrganizationData {
  tree: unknown;
  departments: OrganizationDepartment[];
  orgUnits: unknown[];
  members: unknown[];
  mode: 'flat' | 'hierarchy';
}

export interface OrganizationDepartment {
  id: string;
  tenantId?: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt?: string;
}

export interface DepartmentPayload {
  name: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface DepartmentDetail extends OrganizationDepartment {
  members: {
    id: string;
    name: string;
    email: string;
    position: string | null;
    role: string | null;
    status: string;
    avatar: string | null;
    hireDate: string | null;
  }[];
}

export interface MemberStatus {
  id: string;
  email: string;
  name: string;
  nameKana: string | null;
  employeeNumber: string | null;
  department: string | null;
  position: string | null;
  role: string | null;
  avatar: string | null;
  currentStatus: string;
  workLocation: string | null;
  checkedInAt: string | null;
  workingTime: string | null;
  lastActivity: string | null;
}

export interface MemberStatusResponse {
  members: MemberStatus[];
  stats: {
    total: number;
    present: number;
    remote: number;
    business_trip: number;
    training: number;
    absent: number;
    not_checked_in: number;
  };
}

// ── 組織全体 ──────────────────────────────────

/** 組織構造を取得（ツリー・部署・メンバー含む） */
export function fetchOrganization() {
  return apiGet<OrganizationData>('/api/organization');
}

// ── 組織モード ──────────────────────────────────

/** 組織管理モードを取得 */
export function fetchOrganizationMode() {
  return apiGet<{ mode: 'flat' | 'hierarchy' }>('/api/organization/mode');
}

/** 組織管理モードを更新 */
export function updateOrganizationMode(mode: 'flat' | 'hierarchy') {
  return apiPut<{ mode: 'flat' | 'hierarchy' }>('/api/organization/mode', { mode });
}

// ── 部署 ──────────────────────────────────

/** 部署一覧を取得 */
export function fetchDepartments() {
  return apiGet<OrganizationDepartment[]>('/api/organization/departments');
}

/** 部署詳細を取得（メンバー含む） */
export function fetchDepartmentDetail(id: string) {
  return apiGet<DepartmentDetail>(`/api/organization/departments/${id}`);
}

/** 部署を作成 */
export function createDepartment(payload: DepartmentPayload) {
  return apiPost<OrganizationDepartment>('/api/organization/departments', payload);
}

/** 部署を更新 */
export function updateDepartment(id: string, payload: Partial<DepartmentPayload>) {
  return apiPatch<OrganizationDepartment>(`/api/organization/departments/${id}`, payload);
}

/** 部署を削除 */
export function deleteDepartment(id: string) {
  return apiDelete<void>(`/api/organization/departments/${id}`);
}

// ── メンバー ──────────────────────────────────

/** メンバーステータスを取得 */
export function fetchMemberStatus(tenantId: string) {
  return apiGet<MemberStatusResponse>('/api/members/status', { tenantId });
}
