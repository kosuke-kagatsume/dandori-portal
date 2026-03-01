import { create } from 'zustand';

// === 型定義 ===

export type FieldType =
  | 'text' | 'textarea' | 'number'
  | 'select' | 'multiselect'
  | 'date' | 'time' | 'timerange' | 'file';

export type SubmissionRule = 'required_on_clockout' | 'prompt_after_clockout' | 'optional';

export interface TemplateField {
  id: string;
  label: string;
  fieldType: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  order: number;
}

export type ApproverType = 'direct_manager' | 'specific_person';

export interface DailyReportTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  departmentIds: string[];
  submissionRule: SubmissionRule;
  reminderHours: number;
  approvalRequired: boolean;
  approverType: ApproverType;
  approverIds: string[];
  isActive: boolean;
  fields: TemplateField[];
  createdAt: string;
  updatedAt: string;
}

export type DailyReportTemplateInput = Omit<DailyReportTemplate, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>;

// === ストア ===

interface DailyReportTemplateState {
  templates: DailyReportTemplate[];
  tenantId: string | null;
  isLoading: boolean;
  error: string | null;

  setTenantId: (tenantId: string) => void;
  fetchTemplates: () => Promise<void>;
  addTemplate: (data: DailyReportTemplateInput) => Promise<void>;
  updateTemplate: (id: string, data: DailyReportTemplateInput) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useDailyReportTemplateStore = create<DailyReportTemplateState>()((set, get) => ({
  templates: [],
  tenantId: null,
  isLoading: false,
  error: null,

  setTenantId: (tenantId: string) => {
    set({ tenantId });
  },

  fetchTemplates: async () => {
    const { tenantId } = get();
    if (!tenantId) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/daily-report-templates?tenantId=${tenantId}`);
      if (!res.ok) throw new Error('テンプレートの取得に失敗しました');
      const json = await res.json();
      const data = json.data?.items || json.data || [];
      set({ templates: Array.isArray(data) ? data : [], isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addTemplate: async (data: DailyReportTemplateInput) => {
    const { tenantId, fetchTemplates } = get();
    if (!tenantId) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/daily-report-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'テンプレートの作成に失敗しました');
      }
      await fetchTemplates();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateTemplate: async (id: string, data: DailyReportTemplateInput) => {
    const { tenantId, fetchTemplates } = get();
    if (!tenantId) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/daily-report-templates?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'テンプレートの更新に失敗しました');
      }
      await fetchTemplates();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteTemplate: async (id: string) => {
    const { tenantId, fetchTemplates } = get();
    if (!tenantId) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/daily-report-templates?id=${id}&tenantId=${tenantId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('テンプレートの削除に失敗しました');
      await fetchTemplates();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
}));
