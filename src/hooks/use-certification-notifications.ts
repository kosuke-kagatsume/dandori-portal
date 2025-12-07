'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserStore, useTenantStore } from '@/lib/store';

interface CertificationNotification {
  id: string;
  certificationId: string;
  userId: string;
  notificationType: string;
  daysUntilExpiry: number;
  sentAt?: string;
  readAt?: string;
  acknowledgedAt?: string;
  certification: {
    id: string;
    name: string;
    organization: string;
    expiryDate: string;
    status: string;
  };
}

interface ExpiringCertification {
  id: string;
  name: string;
  organization: string;
  expiryDate: string;
  status: string;
  daysUntilExpiry: number;
  isExpired: boolean;
  hasOpenRenewal: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    department?: string;
  };
}

export function useCertificationNotifications() {
  const { currentUser } = useUserStore();
  const { currentTenant } = useTenantStore();
  const [notifications, setNotifications] = useState<CertificationNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const tenantId = currentTenant?.id || 'tenant-demo-001';
  const userId = currentUser?.id;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/certifications/notifications?userId=${userId}&tenantId=${tenantId}`
      );
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch {
      // エラー時はデモデータを使用
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [userId, tenantId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/certifications/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: notificationId,
          action: 'read',
        }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchNotifications();
      }
      return data;
    } catch {
      return { success: false, error: '通知の更新に失敗しました' };
    }
  }, [fetchNotifications]);

  const acknowledge = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/certifications/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: notificationId,
          action: 'acknowledge',
        }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchNotifications();
      }
      return data;
    } catch {
      return { success: false, error: '通知の更新に失敗しました' };
    }
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    refetch: fetchNotifications,
    markAsRead,
    acknowledge,
  };
}

export function useExpiringCertifications(days = 90) {
  const { currentTenant } = useTenantStore();
  const [certifications, setCertifications] = useState<ExpiringCertification[]>([]);
  const [counts, setCounts] = useState({
    expired: 0,
    within7Days: 0,
    within14Days: 0,
    within30Days: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  const tenantId = currentTenant?.id || 'tenant-demo-001';

  const fetchCertifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/certifications/expiring?tenantId=${tenantId}&days=${days}`
      );
      const data = await response.json();

      if (data.success) {
        setCertifications(data.data.certifications);
        setCounts(data.data.counts);
      }
    } catch {
      setCertifications([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId, days]);

  useEffect(() => {
    fetchCertifications();
  }, [fetchCertifications]);

  return {
    certifications,
    counts,
    loading,
    refetch: fetchCertifications,
  };
}

export function useCertificationRenewals() {
  const { currentUser } = useUserStore();
  const { currentTenant } = useTenantStore();
  const [renewals, setRenewals] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const tenantId = currentTenant?.id || 'tenant-demo-001';
  const userId = currentUser?.id;

  const fetchRenewals = useCallback(async (filterUserId?: string) => {
    try {
      setLoading(true);
      const url = filterUserId
        ? `/api/certifications/renewals?tenantId=${tenantId}&userId=${filterUserId}`
        : `/api/certifications/renewals?tenantId=${tenantId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setRenewals(data.data.renewals);
        setCounts(data.data.counts);
      }
    } catch {
      setRenewals([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchRenewals(userId);
  }, [fetchRenewals, userId]);

  const submitRenewal = useCallback(async (data: {
    certificationId: string;
    newIssueDate: string;
    newExpiryDate?: string;
    newCredentialId?: string;
    newDocumentUrl?: string;
    newDocumentName?: string;
    notes?: string;
  }) => {
    if (!userId) return { success: false, error: 'User not found' };

    try {
      setSubmitting(true);
      const response = await fetch('/api/certifications/renewals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          userId,
          ...data,
        }),
      });
      const result = await response.json();
      if (result.success) {
        await fetchRenewals(userId);
      }
      return result;
    } catch {
      return { success: false, error: '更新申請の送信に失敗しました' };
    } finally {
      setSubmitting(false);
    }
  }, [userId, tenantId, fetchRenewals]);

  const reviewRenewal = useCallback(async (
    id: string,
    action: 'start_review' | 'approve' | 'reject' | 'update_checklist',
    reviewData?: {
      reviewedBy?: string;
      reviewedByName?: string;
      reviewComment?: string;
      documentVerified?: boolean;
      dateVerified?: boolean;
      organizationVerified?: boolean;
    }
  ) => {
    try {
      setSubmitting(true);
      const response = await fetch('/api/certifications/renewals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action,
          ...reviewData,
        }),
      });
      const result = await response.json();
      if (result.success) {
        await fetchRenewals();
      }
      return result;
    } catch {
      return { success: false, error: '審査処理に失敗しました' };
    } finally {
      setSubmitting(false);
    }
  }, [fetchRenewals]);

  return {
    renewals,
    counts,
    loading,
    submitting,
    refetch: fetchRenewals,
    submitRenewal,
    reviewRenewal,
  };
}

export function useCertificationDashboard() {
  const { currentTenant } = useTenantStore();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const tenantId = currentTenant?.id || 'tenant-demo-001';

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/certifications?tenantId=${tenantId}`
      );
      const data = await response.json();

      if (data.success) {
        setDashboard(data.data);
      }
    } catch {
      // エラー時はデモデータ
      setDashboard({
        counts: {
          expired: 2,
          within7Days: 1,
          within14Days: 3,
          within30Days: 5,
          pendingRenewals: 2,
          underReview: 1,
        },
        expiringCertifications: [],
        expiredCertifications: [],
        pendingRenewals: [],
        recentNotifications: [],
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboard,
    loading,
    refetch: fetchDashboard,
  };
}
