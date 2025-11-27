'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SaaSServiceFromAPI {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  vendor: string | null;
  description: string | null;
  website: string | null;
  licenseType: string;
  contractStartDate: string | null;
  contractEndDate: string | null;
  autoRenew: boolean;
  ssoEnabled: boolean;
  mfaEnabled: boolean;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  plans?: SaaSPlanFromAPI[];
  assignments?: SaaSAssignmentFromAPI[];
  monthlyCosts?: unknown[];
}

export interface SaaSPlanFromAPI {
  id: string;
  tenantId: string;
  serviceId: string;
  planName: string;
  billingCycle: string;
  pricePerUser: number | null;
  fixedPrice: number | null;
  currency: string;
  maxUsers: number | null;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaaSAssignmentFromAPI {
  id: string;
  tenantId: string;
  serviceId: string;
  planId: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  departmentId: string | null;
  departmentName: string | null;
  status: string;
  assignedDate: string;
  revokedDate: string | null;
  lastUsedAt: string | null;
  usageCount: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  service?: SaaSServiceFromAPI;
  plan?: SaaSPlanFromAPI;
}

export function useSaaSServicesAPI() {
  const [services, setServices] = useState<SaaSServiceFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // include=details を付けてplans, assignments, monthlyCostsを取得
      const response = await fetch('/api/saas/services?include=details');
      const data = await response.json();

      if (data.success) {
        setServices(data.data);
      } else {
        setError(data.error || 'Failed to fetch SaaS services');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const getServiceById = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/saas/services/${id}`);
      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, []);

  const createService = useCallback(async (service: Partial<SaaSServiceFromAPI>) => {
    try {
      const response = await fetch('/api/saas/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      });
      const data = await response.json();

      if (data.success) {
        await fetchServices();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchServices]);

  const updateService = useCallback(async (id: string, service: Partial<SaaSServiceFromAPI>) => {
    try {
      const response = await fetch(`/api/saas/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      });
      const data = await response.json();

      if (data.success) {
        await fetchServices();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchServices]);

  const deleteService = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/saas/services/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        await fetchServices();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchServices]);

  // 統計情報 - DBの新しいデータ構造に対応
  const getTotalServices = useCallback(() => services.length, [services]);

  // 総ライセンス数 = アクティブなアサインメントの数
  const getTotalLicenses = useCallback(() =>
    services.reduce((sum, s) => sum + (s.assignments?.length || 0), 0),
    [services]
  );

  // アクティブライセンス数 = アクティブなアサインメントの数（同じ）
  const getActiveLicenses = useCallback(() =>
    services.reduce((sum, s) => sum + (s.assignments?.length || 0), 0),
    [services]
  );

  // 月額総コスト = 各サービスのプラン料金（ユーザー単価×ユーザー数 または 固定料金）
  const getTotalMonthlyCost = useCallback(() =>
    services.reduce((sum, s) => {
      const plan = s.plans?.[0];
      if (!plan) return sum;

      // ユーザー単価がある場合
      if (plan.pricePerUser) {
        const userCount = s.assignments?.length || 0;
        return sum + (plan.pricePerUser * userCount);
      }
      // 固定料金がある場合
      if (plan.fixedPrice) {
        return sum + plan.fixedPrice;
      }
      return sum;
    }, 0),
    [services]
  );

  // 未使用ライセンスコスト（プランのmaxUsersと実際のアサインメント数の差）
  const getUnusedLicensesCost = useCallback(() =>
    services.reduce((sum, s) => {
      const plan = s.plans?.[0];
      if (!plan || !plan.pricePerUser || !plan.maxUsers) return sum;

      const userCount = s.assignments?.length || 0;
      const unusedCount = Math.max(0, plan.maxUsers - userCount);
      return sum + (plan.pricePerUser * unusedCount);
    }, 0),
    [services]
  );

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return {
    services,
    loading,
    error,
    fetchServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    getTotalServices,
    getTotalLicenses,
    getActiveLicenses,
    getTotalMonthlyCost,
    getUnusedLicensesCost,
  };
}

export function useSaaSAssignmentsAPI() {
  const [assignments, setAssignments] = useState<SaaSAssignmentFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async (serviceId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = serviceId
        ? `/api/saas/assignments?serviceId=${serviceId}`
        : '/api/saas/assignments';
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setAssignments(data.data);
      } else {
        setError(data.error || 'Failed to fetch license assignments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAssignment = useCallback(async (assignment: Partial<SaaSAssignmentFromAPI>) => {
    try {
      const response = await fetch('/api/saas/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment),
      });
      const data = await response.json();

      if (data.success) {
        await fetchAssignments();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchAssignments]);

  const updateAssignment = useCallback(async (id: string, assignment: Partial<SaaSAssignmentFromAPI>) => {
    try {
      const response = await fetch(`/api/saas/assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment),
      });
      const data = await response.json();

      if (data.success) {
        await fetchAssignments();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchAssignments]);

  const deleteAssignment = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/saas/assignments/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        await fetchAssignments();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchAssignments]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
}
