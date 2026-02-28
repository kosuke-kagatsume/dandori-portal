import { create } from 'zustand';
import type { TemplateField, SubmissionRule } from './daily-report-template-store';

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
  fields: TemplateField[];
}

// === ストア ===

interface DailyReportState {
  reports: DailyReport[];
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
}

export const useDailyReportStore = create<DailyReportState>()((set, get) => ({
  reports: [],
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
    const { tenantId } = get();
    if (!tenantId) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/daily-reports?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, status: 'submitted', submittedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('日報の提出に失敗しました');
      // 現在のreportsを更新
      set((state) => ({
        reports: state.reports.map((r) =>
          r.id === id ? { ...r, status: 'submitted' as ReportStatus, submittedAt: new Date().toISOString() } : r
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
}));
