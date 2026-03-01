import { create } from 'zustand';
import type { TemplateField, SubmissionRule, ApproverType } from './daily-report-template-store';
import { useOrganizationStore } from './organization-store';
import { useDailyReportTemplateStore } from './daily-report-template-store';

// === 型定義 ===

export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface ReportFieldValue {
  fieldId: string;
  value: string | string[] | number | null;
}

export interface DailyReport {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName?: string;
  date: string; // YYYY-MM-DD
  templateId: string;
  templateName?: string;
  status: ReportStatus;
  values: ReportFieldValue[];
  submittedAt: string | null;
  targetApproverId: string | null;
  targetApproverName: string | null;
  approverId: string | null;
  approverName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReportInput {
  employeeId: string;
  date: string;
  templateId: string;
  status: ReportStatus;
  values: ReportFieldValue[];
}

// テンプレート情報（退勤連動判定用）
export interface TemplateForClockOut {
  id: string;
  name: string;
  submissionRule: SubmissionRule;
  reminderHours: number;
  approvalRequired: boolean;
  approverType: ApproverType;
  approverIds: string[];
  fields: TemplateField[];
}

// === ストア ===

interface DailyReportState {
  reports: DailyReport[];
  pendingApprovals: DailyReport[];
  tenantId: string | null;
  isLoading: boolean;
  error: string | null;

  setTenantId: (tenantId: string) => void;
  fetchReports: (params?: { employeeId?: string; startDate?: string; endDate?: string }) => Promise<void>;
  getReportByDate: (employeeId: string, date: string) => DailyReport | undefined;
  createReport: (data: DailyReportInput) => Promise<DailyReport>;
  updateReport: (id: string, data: Partial<DailyReportInput>) => Promise<void>;
  submitReport: (id: string) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  getTemplateForEmployee: (employeeId: string) => Promise<TemplateForClockOut | null>;
  fetchPendingApprovals: (approverId: string) => Promise<void>;
  approveReport: (id: string, approverId: string, approverName: string) => Promise<void>;
  rejectReport: (id: string, approverId: string, approverName: string, reason: string) => Promise<void>;
}

export const useDailyReportStore = create<DailyReportState>()((set, get) => ({
  reports: [],
  pendingApprovals: [],
  tenantId: null,
  isLoading: false,
  error: null,

  setTenantId: (tenantId: string) => {
    set({ tenantId });
  },

  fetchReports: async (params) => {
    const { tenantId } = get();
    if (!tenantId) return;
    set({ isLoading: true, error: null });
    try {
      const searchParams = new URLSearchParams({ tenantId });
      if (params?.employeeId) searchParams.set('employeeId', params.employeeId);
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);

      const res = await fetch(`/api/daily-reports?${searchParams.toString()}`);
      if (!res.ok) throw new Error('日報の取得に失敗しました');
      const json = await res.json();
      const data = json.data?.items || json.data || [];
      set({ reports: Array.isArray(data) ? data : [], isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  getReportByDate: (employeeId: string, date: string) => {
    return get().reports.find((r) => r.employeeId === employeeId && r.date === date);
  },

  createReport: async (data: DailyReportInput) => {
    const { tenantId, fetchReports } = get();
    if (!tenantId) throw new Error('テナントIDが設定されていません');
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '日報の作成に失敗しました');
      }
      const json = await res.json();
      await fetchReports({ employeeId: data.employeeId });
      return json.data.item;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateReport: async (id: string, data: Partial<DailyReportInput>) => {
    const { tenantId, fetchReports } = get();
    if (!tenantId) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/daily-reports?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '日報の更新に失敗しました');
      }
      await fetchReports({ employeeId: data.employeeId });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  submitReport: async (id: string) => {
    const { tenantId, reports } = get();
    if (!tenantId) return;
    set({ isLoading: true, error: null });
    try {
      // 承認者を解決
      const report = reports.find((r) => r.id === id);
      let targetApproverId: string | null = null;
      let targetApproverName: string | null = null;

      if (report) {
        const templates = useDailyReportTemplateStore.getState().templates;
        const template = templates.find((t) => t.id === report.templateId);

        if (template?.approvalRequired) {
          if (template.approverType === 'direct_manager') {
            const managers = useOrganizationStore.getState().getManagersForMember(report.employeeId);
            if (managers.length > 0) {
              targetApproverId = managers[0].id;
              targetApproverName = managers[0].name;
            }
          } else if (template.approverType === 'specific_person' && template.approverIds.length > 0) {
            targetApproverId = template.approverIds[0];
            const allMembers = useOrganizationStore.getState().allMembers;
            const approver = allMembers.find((m) => m.id === targetApproverId);
            targetApproverName = approver?.name || null;
          }
        }
      }

      const patchBody: Record<string, unknown> = {
        tenantId,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      };
      if (targetApproverId) {
        patchBody.targetApproverId = targetApproverId;
        patchBody.targetApproverName = targetApproverName;
      }

      const res = await fetch(`/api/daily-reports?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      });
      if (!res.ok) throw new Error('日報の提出に失敗しました');
      // 現在のreportsを更新
      set((state) => ({
        reports: state.reports.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'submitted' as ReportStatus,
                submittedAt: new Date().toISOString(),
                targetApproverId,
                targetApproverName,
              }
            : r
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteReport: async (id: string) => {
    const { tenantId } = get();
    if (!tenantId) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/daily-reports?id=${id}&tenantId=${tenantId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('日報の削除に失敗しました');
      set((state) => ({
        reports: state.reports.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  // 従業員の所属部署に紐づくテンプレートを取得
  getTemplateForEmployee: async (employeeId: string) => {
    const { tenantId } = get();
    if (!tenantId) return null;
    try {
      const res = await fetch(
        `/api/daily-reports/template-for-employee?tenantId=${tenantId}&employeeId=${employeeId}`
      );
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.template || null;
    } catch {
      return null;
    }
  },

  // 承認待ち日報を取得
  fetchPendingApprovals: async (approverId: string) => {
    const { tenantId } = get();
    if (!tenantId) return;
    try {
      const searchParams = new URLSearchParams({
        tenantId,
        status: 'submitted',
        targetApproverId: approverId,
      });
      const res = await fetch(`/api/daily-reports?${searchParams.toString()}`);
      if (!res.ok) throw new Error('承認待ち日報の取得に失敗しました');
      const json = await res.json();
      const data = json.data?.items || json.data || [];
      set({ pendingApprovals: Array.isArray(data) ? data : [] });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // 日報を承認
  approveReport: async (id: string, approverId: string, approverName: string) => {
    const { tenantId } = get();
    if (!tenantId) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/daily-reports/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, approverId, approverName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '承認に失敗しました');
      }
      // pendingApprovalsから削除
      set((state) => ({
        pendingApprovals: state.pendingApprovals.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  // 日報を差戻し
  rejectReport: async (id: string, approverId: string, approverName: string, reason: string) => {
    const { tenantId } = get();
    if (!tenantId) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/daily-reports/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, approverId, approverName, reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '差戻しに失敗しました');
      }
      // pendingApprovalsから削除
      set((state) => ({
        pendingApprovals: state.pendingApprovals.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
}));
