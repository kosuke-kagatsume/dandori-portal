'use client';

import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/swr/config';

/**
 * DW管理者向けAPIフック
 * - テナント統計
 * - 請求書管理
 * - 支払い管理
 * - 通知管理
 * - アクティビティフィード
 */

// ====================
// 型定義
// ====================

export interface TenantStatsResponse {
  success: boolean;
  data: {
    overview: {
      totalTenants: number;
      totalUsers: number;
      avgUsersPerTenant: number;
      newTenantsThisMonth: number;
    };
    revenue: {
      currentMonth: number;
      previousMonth: number;
      growth: number;
    };
    tenantsByStatus: {
      trial: number;
      active: number;
      suspended: number;
      cancelled: number;
    };
    billing: {
      overdueInvoices: number;
      pendingTrials: number;
      expiringContracts: number;
    };
    alerts: Array<{
      type: string;
      message: string;
      severity: 'high' | 'medium' | 'low';
    }>;
  };
}

export interface Invoice {
  id: string;
  tenantId: string;
  tenantName: string;
  invoiceNumber: string;
  billingMonth: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  dueDate: string;
  paidDate: string | null;
  createdAt: string;
}

export interface InvoicesResponse {
  success: boolean;
  data: {
    invoices: Invoice[];
    summary: {
      totalAmount: number;
      paidAmount: number;
      unpaidAmount: number;
      overdueCount: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface Payment {
  id: string;
  tenantId: string;
  tenantName: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

export interface PaymentsResponse {
  success: boolean;
  data: {
    payments: Payment[];
    summary: {
      totalAmount: number;
      count: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface DWNotification {
  id: string;
  type: string;
  title: string;
  description: string | null;
  priority: string;
  tenantId: string | null;
  tenantName: string | null;
  invoiceId: string | null;
  amount: number | null;
  isRead: boolean;
  readAt: string | null;
  readBy: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: DWNotification[];
    summary: {
      total: number;
      unread: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface Activity {
  id: string;
  tenantId: string;
  activityType: string;
  title: string;
  description: string | null;
  icon: string | null;
  userId: string | null;
  userName: string | null;
  resourceType: string | null;
  resourceId: string | null;
  priority: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string | null;
  settings: {
    status: string;
    trialEndDate: string | null;
    contractStartDate: string | null;
    contractEndDate: string | null;
    billingEmail: string | null;
    customPricing: boolean;
  } | null;
  userCount: number;
  invoiceCount: number;
  totalAmount: number;
  unpaidAmount: number;
  overdueCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantsResponse {
  success: boolean;
  data: {
    tenants: Tenant[];
    summary: {
      total: number;
      byStatus: Record<string, number>;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ActivityResponse {
  success: boolean;
  data: {
    activities: Activity[];
    summary: {
      weeklyByType: Record<string, number>;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// ====================
// フック
// ====================

/**
 * テナント一覧を取得
 */
export function useTenants(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const queryString = searchParams.toString();
  const url = `/api/dw-admin/tenants${queryString ? `?${queryString}` : ''}`;

  return useSWR<TenantsResponse>(url, fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  });
}

/**
 * テナント統計を取得
 */
export function useTenantStats() {
  return useSWR<TenantStatsResponse>(
    '/api/dw-admin/tenants/stats',
    fetcher,
    {
      refreshInterval: 60000, // 1分ごとに更新
      revalidateOnFocus: true,
    }
  );
}

/**
 * 請求書一覧を取得
 */
export function useInvoices(params?: {
  tenantId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.tenantId) searchParams.set('tenantId', params.tenantId);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const queryString = searchParams.toString();
  const url = `/api/dw-admin/invoices${queryString ? `?${queryString}` : ''}`;

  return useSWR<InvoicesResponse>(url, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });
}

/**
 * 請求書詳細を取得
 */
export function useInvoice(id: string | null) {
  return useSWR(
    id ? `/api/dw-admin/invoices/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );
}

/**
 * 支払い記録一覧を取得
 */
export function usePayments(params?: {
  tenantId?: string;
  invoiceId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.tenantId) searchParams.set('tenantId', params.tenantId);
  if (params?.invoiceId) searchParams.set('invoiceId', params.invoiceId);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const queryString = searchParams.toString();
  const url = `/api/dw-admin/payments${queryString ? `?${queryString}` : ''}`;

  return useSWR<PaymentsResponse>(url, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });
}

/**
 * DW管理通知一覧を取得
 */
export function useDWNotifications(params?: {
  type?: string;
  read?: boolean;
  priority?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set('type', params.type);
  if (params?.read !== undefined) searchParams.set('read', params.read.toString());
  if (params?.priority) searchParams.set('priority', params.priority);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const queryString = searchParams.toString();
  const url = `/api/dw-admin/notifications${queryString ? `?${queryString}` : ''}`;

  return useSWR<NotificationsResponse>(url, fetcher, {
    refreshInterval: 15000, // 15秒ごとに更新（通知は頻繁にチェック）
    revalidateOnFocus: true,
  });
}

/**
 * アクティビティフィードを取得
 */
export function useActivityFeed(params?: {
  type?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set('type', params.type);
  if (params?.resourceType) searchParams.set('resourceType', params.resourceType);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const queryString = searchParams.toString();
  const url = `/api/dw-admin/activity${queryString ? `?${queryString}` : ''}`;

  return useSWR<ActivityResponse>(url, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });
}

// ====================
// ミューテーション関数
// ====================

/**
 * 請求書を作成
 */
export async function createInvoice(data: {
  tenantId: string;
  billingMonth: string;
  subtotal: number;
  taxRate?: number;
  dueDate?: string;
  billingEmail?: string;
  memo?: string;
}) {
  const response = await fetch('/api/dw-admin/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '請求書の作成に失敗しました');
  }

  // キャッシュを更新
  mutate((key) => typeof key === 'string' && key.startsWith('/api/dw-admin/invoices'));
  mutate('/api/dw-admin/tenants/stats');

  return response.json();
}

/**
 * 請求書を更新
 */
export async function updateInvoice(id: string, data: {
  subtotal?: number;
  tax?: number;
  billingMonth?: string;
  dueDate?: string;
  billingEmail?: string;
  memo?: string;
  status?: string;
}) {
  const response = await fetch(`/api/dw-admin/invoices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '請求書の更新に失敗しました');
  }

  // キャッシュを更新
  mutate((key) => typeof key === 'string' && key.startsWith('/api/dw-admin/invoices'));
  mutate('/api/dw-admin/tenants/stats');

  return response.json();
}

/**
 * 請求書を削除
 */
export async function deleteInvoice(id: string) {
  const response = await fetch(`/api/dw-admin/invoices/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '請求書の削除に失敗しました');
  }

  // キャッシュを更新
  mutate((key) => typeof key === 'string' && key.startsWith('/api/dw-admin/invoices'));
  mutate('/api/dw-admin/tenants/stats');

  return response.json();
}

/**
 * 支払いを登録
 */
export async function createPayment(data: {
  invoiceId: string;
  amount: number;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
}) {
  const response = await fetch('/api/dw-admin/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '支払いの登録に失敗しました');
  }

  // キャッシュを更新
  mutate((key) => typeof key === 'string' && key.startsWith('/api/dw-admin/payments'));
  mutate((key) => typeof key === 'string' && key.startsWith('/api/dw-admin/invoices'));
  mutate('/api/dw-admin/tenants/stats');

  return response.json();
}

/**
 * 通知を既読にする
 */
export async function markNotificationsAsRead(ids: string[], readBy?: string) {
  const response = await fetch('/api/dw-admin/notifications', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, readBy }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '通知の更新に失敗しました');
  }

  // キャッシュを更新
  mutate((key) => typeof key === 'string' && key.startsWith('/api/dw-admin/notifications'));

  return response.json();
}

/**
 * 全ての通知を既読にする
 */
export async function markAllNotificationsAsRead(readBy?: string) {
  const response = await fetch('/api/dw-admin/notifications', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markAllRead: true, readBy }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '通知の更新に失敗しました');
  }

  // キャッシュを更新
  mutate((key) => typeof key === 'string' && key.startsWith('/api/dw-admin/notifications'));

  return response.json();
}

/**
 * DW管理キャッシュを無効化
 */
export function invalidateDWAdminCache() {
  mutate((key) => typeof key === 'string' && key.startsWith('/api/dw-admin'), undefined, { revalidate: true });
}
