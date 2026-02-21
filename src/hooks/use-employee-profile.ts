'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserStore, useTenantStore } from '@/lib/store';

interface Certification {
  id: string;
  name: string;
  organization: string;
  issueDate: string;
  expiryDate: string | null;
  status: string;
  documentUrl?: string;
  documentName?: string;
  documentSize?: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  level: number;
}

interface Experience {
  id: string;
  position: string;
  company: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description?: string;
  achievements: string[];
  skills: string[];
}

interface EmployeeProfile {
  id: string;
  userId: string;
  employeeNumber?: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  commuteRoute?: string;
  completedProjectsCount: number;
  teamMembersCount: number;
  yearsOfExperience: number;
  certifications: Certification[];
  skills: Skill[];
  experiences: Experience[];
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    position?: string;
    department?: string;
    avatar?: string;
    hireDate?: string;
  };
}

interface ChangeRequest {
  id: string;
  requestType: string;
  fieldName?: string;
  currentValue?: string;
  newValue: string;
  reason?: string;
  status: string;
  createdAt: string;
}

export function useEmployeeProfile() {
  const { currentUser } = useUserStore();
  const { currentTenant } = useTenantStore();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tenantId = currentTenant?.id;
  const userId = currentUser?.id;

  // プロフィール取得
  const fetchProfile = useCallback(async () => {
    if (!userId || !tenantId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/employee-profile?userId=${userId}&tenantId=${tenantId}`
      );
      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
      } else {
        setError(data.error);
      }
    } catch {
      setError('プロフィールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [userId, tenantId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 変更申請を送信
  const submitChangeRequest = useCallback(async (
    requestType: string,
    fieldName: string | undefined,
    currentValue: string | undefined,
    newValue: string,
    reason?: string
  ) => {
    if (!userId) return { success: false, error: 'User not found' };

    try {
      const response = await fetch('/api/employee-profile/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          userId,
          requestType,
          fieldName,
          currentValue,
          newValue,
          reason,
        }),
      });

      const data = await response.json();
      return data;
    } catch {
      return { success: false, error: '変更申請の送信に失敗しました' };
    }
  }, [userId, tenantId]);

  // 資格追加申請
  const submitCertificationRequest = useCallback(async (
    certification: {
      name: string;
      organization: string;
      issueDate: string;
      expiryDate?: string;
    }
  ) => {
    return submitChangeRequest(
      'certification',
      undefined,
      undefined,
      JSON.stringify(certification),
      '資格追加申請'
    );
  }, [submitChangeRequest]);

  // スキル追加申請
  const submitSkillRequest = useCallback(async (
    skill: {
      name: string;
      category: string;
      level: number;
    }
  ) => {
    return submitChangeRequest(
      'skill',
      undefined,
      undefined,
      JSON.stringify(skill),
      'スキル追加申請'
    );
  }, [submitChangeRequest]);

  // 経歴追加申請
  const submitExperienceRequest = useCallback(async (
    experience: {
      position: string;
      company: string;
      startDate: string;
      endDate?: string;
      description?: string;
    }
  ) => {
    return submitChangeRequest(
      'experience',
      undefined,
      undefined,
      JSON.stringify(experience),
      '経歴追加申請'
    );
  }, [submitChangeRequest]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    submitChangeRequest,
    submitCertificationRequest,
    submitSkillRequest,
    submitExperienceRequest,
  };
}

// 変更申請一覧用フック
export function useChangeRequests() {
  const { currentUser } = useUserStore();
  const { currentTenant } = useTenantStore();
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const tenantId = currentTenant?.id;
  const userId = currentUser?.id;

  const fetchRequests = useCallback(async () => {
    if (!userId || !tenantId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/employee-profile/change-requests?userId=${userId}&tenantId=${tenantId}`
      );
      const data = await response.json();

      if (data.success) {
        setRequests(data.data);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [userId, tenantId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, refetch: fetchRequests };
}
