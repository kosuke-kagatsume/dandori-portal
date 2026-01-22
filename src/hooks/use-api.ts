'use client';

import useSWR, { SWRConfiguration, mutate } from 'swr';
import { fetcher, CACHE_TIME } from '@/lib/swr/config';

// 汎用的なAPI取得フック
interface UseApiOptions<T> extends SWRConfiguration<T> {
  enabled?: boolean;
}

export function useApi<T>(
  url: string | null,
  options?: UseApiOptions<T>
) {
  const { enabled = true, ...swrOptions } = options || {};

  return useSWR<T>(
    enabled && url ? url : null,
    fetcher,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      ...swrOptions,
    }
  );
}

// ユーザー一覧取得
export function useUsers(tenantId: string = 'tenant-1') {
  return useApi(`/api/users?tenantId=${tenantId}`, {
    refreshInterval: CACHE_TIME.USERS * 1000,
  });
}

// ユーザー詳細取得
export function useUser(userId: string | null) {
  return useApi(userId ? `/api/users/${userId}` : null, {
    refreshInterval: CACHE_TIME.USERS * 1000,
  });
}

// 勤怠データ取得
export function useAttendance(tenantId: string = 'tenant-1', params?: {
  userId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const searchParams = new URLSearchParams({ tenantId });
  if (params?.userId) searchParams.set('userId', params.userId);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);

  return useApi(`/api/attendance?${searchParams.toString()}`, {
    refreshInterval: CACHE_TIME.ATTENDANCE * 1000,
  });
}

// SaaSサービス一覧取得
export function useSaaSServices(tenantId: string = 'tenant-1', includeDetails: boolean = false) {
  const url = `/api/saas/services?tenantId=${tenantId}${includeDetails ? '&include=details' : ''}`;
  return useApi(url, {
    refreshInterval: CACHE_TIME.SAAS * 1000,
  });
}

// SaaSプラン一覧取得
export function useSaaSPlans(tenantId: string = 'tenant-1', serviceId?: string) {
  const searchParams = new URLSearchParams({ tenantId });
  if (serviceId) searchParams.set('serviceId', serviceId);

  return useApi(`/api/saas/plans?${searchParams.toString()}`, {
    refreshInterval: CACHE_TIME.SAAS * 1000,
  });
}

// SaaSライセンス割り当て取得
export function useSaaSAssignments(tenantId: string = 'tenant-1', serviceId?: string) {
  const searchParams = new URLSearchParams({ tenantId });
  if (serviceId) searchParams.set('serviceId', serviceId);

  return useApi(`/api/saas/assignments?${searchParams.toString()}`, {
    refreshInterval: CACHE_TIME.SAAS * 1000,
  });
}

// 車両一覧取得
export function useVehicles(tenantId: string = 'tenant-1') {
  return useApi(`/api/assets/vehicles?tenantId=${tenantId}`, {
    refreshInterval: CACHE_TIME.ASSETS * 1000,
  });
}

// PC資産一覧取得
export function usePCAssets(tenantId: string = 'tenant-1') {
  return useApi(`/api/assets/pc?tenantId=${tenantId}`, {
    refreshInterval: CACHE_TIME.ASSETS * 1000,
  });
}

// メンテナンス記録取得
export function useMaintenanceRecords(tenantId: string = 'tenant-1', vehicleId?: string) {
  const searchParams = new URLSearchParams({ tenantId });
  if (vehicleId) searchParams.set('vehicleId', vehicleId);

  return useApi(`/api/assets/maintenance-records?${searchParams.toString()}`, {
    refreshInterval: CACHE_TIME.ASSETS * 1000,
  });
}

// 業者一覧取得
export function useVendors(tenantId: string = 'tenant-1') {
  return useApi(`/api/assets/vendors?tenantId=${tenantId}`, {
    refreshInterval: CACHE_TIME.MASTER_DATA * 1000,
  });
}

// 法令更新一覧取得
export function useLegalUpdates(tenantId: string = 'tenant-1') {
  return useApi(`/api/legal-updates?tenantId=${tenantId}`, {
    refreshInterval: CACHE_TIME.LEGAL_UPDATES * 1000,
  });
}

// マスターデータ（部署）取得
export function useDepartments(tenantId: string = 'tenant-1') {
  return useApi(`/api/master-data/departments?tenantId=${tenantId}`, {
    refreshInterval: CACHE_TIME.MASTER_DATA * 1000,
  });
}

// マスターデータ（役職）取得
export function usePositions(tenantId: string = 'tenant-1') {
  return useApi(`/api/master-data/positions?tenantId=${tenantId}`, {
    refreshInterval: CACHE_TIME.MASTER_DATA * 1000,
  });
}

// マスターデータ（雇用形態）取得
export function useEmploymentTypes(tenantId: string = 'tenant-1') {
  return useApi(`/api/master-data/employment-types?tenantId=${tenantId}`, {
    refreshInterval: CACHE_TIME.MASTER_DATA * 1000,
  });
}

// ワークフロー一覧取得
export function useWorkflows(tenantId: string = 'tenant-1', status?: string) {
  const searchParams = new URLSearchParams({ tenantId });
  if (status) searchParams.set('status', status);

  return useApi(`/api/workflows?${searchParams.toString()}`, {
    refreshInterval: CACHE_TIME.WORKFLOWS * 1000,
  });
}

// 承認フロー一覧取得
export function useApprovalFlows(tenantId: string = 'tenant-1') {
  return useApi(`/api/approval-flows?tenantId=${tenantId}`, {
    refreshInterval: CACHE_TIME.MASTER_DATA * 1000,
  });
}

// キャッシュを無効化（データ更新後に呼び出す）
export function invalidateCache(key: string | string[]) {
  if (Array.isArray(key)) {
    key.forEach((k) => mutate(k));
  } else {
    mutate(key);
  }
}

// 特定のAPIグループのキャッシュを無効化
export function invalidateUserCache() {
  mutate((key) => typeof key === 'string' && key.startsWith('/api/users'), undefined, { revalidate: true });
}

export function invalidateSaaSCache() {
  mutate((key) => typeof key === 'string' && key.startsWith('/api/saas'), undefined, { revalidate: true });
}

export function invalidateAssetsCache() {
  mutate((key) => typeof key === 'string' && key.startsWith('/api/assets'), undefined, { revalidate: true });
}

export function invalidateAttendanceCache() {
  mutate((key) => typeof key === 'string' && key.startsWith('/api/attendance'), undefined, { revalidate: true });
}

export function invalidateWorkflowCache() {
  mutate((key) => typeof key === 'string' && key.startsWith('/api/workflows'), undefined, { revalidate: true });
}
