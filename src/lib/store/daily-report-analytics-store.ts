import { create } from 'zustand';
import { getTenantIdFromCookie } from '@/lib/utils/tenant';

// === レスポンス型定義 ===

export interface SubmissionSummary {
  totalEmployees: number;
  submittedCount: number;
  notSubmittedCount: number;
  approvedCount: number;
  rejectedCount: number;
  submissionRate: number;
}

export interface TimeSeriesEntry {
  period: string;
  submissionRate: number;
  submittedCount: number;
  totalExpected: number;
}

export interface DepartmentEntry {
  departmentId: string;
  departmentName: string;
  submissionRate: number;
  submittedCount: number;
  totalExpected: number;
}

export interface EmployeeDetail {
  employeeId: string;
  employeeName: string;
  departmentName: string;
  submittedCount: number;
  expectedCount: number;
  submissionRate: number;
  lastSubmittedDate: string | null;
}

export interface SubmissionRateResponse {
  summary: SubmissionSummary;
  timeSeries: TimeSeriesEntry[];
  byDepartment: DepartmentEntry[];
  employeeDetails: EmployeeDetail[];
}

export interface NumberStats {
  type: 'number';
  sum: number;
  average: number;
  min: number;
  max: number;
  count: number;
}

export interface SelectStats {
  type: 'select';
  options: Array<{ label: string; count: number; percentage: number }>;
  total: number;
}

export interface TextStats {
  type: 'text';
  entryCount: number;
  emptyCount: number;
  avgLength: number;
}

export interface BasicStats {
  type: 'basic';
  entryCount: number;
}

export type FieldStats = NumberStats | SelectStats | TextStats | BasicStats;

export interface FieldAggregationEntry {
  fieldId: string;
  label: string;
  fieldType: string;
  stats: FieldStats;
}

export interface FieldAggregationResponse {
  templateName: string;
  reportCount: number;
  fields: FieldAggregationEntry[];
}

// === 日付プリセット ===

export type DateRangePreset = 'today' | 'this-week' | 'this-month' | 'last-month' | 'custom';

function getDateRangeForPreset(preset: DateRangePreset): { startDate: string; endDate: string } {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = today.getMonth();
  const dd = today.getDate();

  switch (preset) {
    case 'today':
      return {
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      };
    case 'this-week': {
      const day = today.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(yyyy, mm, dd + mondayOffset);
      const friday = new Date(yyyy, mm, dd + mondayOffset + 4);
      return {
        startDate: monday.toISOString().split('T')[0],
        endDate: friday.toISOString().split('T')[0],
      };
    }
    case 'this-month':
      return {
        startDate: `${yyyy}-${String(mm + 1).padStart(2, '0')}-01`,
        endDate: today.toISOString().split('T')[0],
      };
    case 'last-month': {
      const lastMonth = new Date(yyyy, mm - 1, 1);
      const lastDay = new Date(yyyy, mm, 0);
      return {
        startDate: lastMonth.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0],
      };
    }
    default:
      return {
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      };
  }
}

// === ストア ===

interface DailyReportAnalyticsState {
  dateRangePreset: DateRangePreset;
  startDate: string;
  endDate: string;
  granularity: 'daily' | 'weekly' | 'monthly';
  selectedTemplateId: string | null;

  submissionData: SubmissionRateResponse | null;
  fieldAggregation: FieldAggregationResponse | null;

  isLoading: boolean;
  isExporting: boolean;

  setDateRange: (preset: DateRangePreset, startDate?: string, endDate?: string) => void;
  setGranularity: (g: 'daily' | 'weekly' | 'monthly') => void;
  setSelectedTemplateId: (id: string | null) => void;
  fetchSubmissionRate: () => Promise<void>;
  fetchFieldAggregation: () => Promise<void>;
  setIsExporting: (v: boolean) => void;
}

const initialDates = getDateRangeForPreset('this-month');

export const useDailyReportAnalyticsStore = create<DailyReportAnalyticsState>()((set, get) => ({
  dateRangePreset: 'this-month',
  startDate: initialDates.startDate,
  endDate: initialDates.endDate,
  granularity: 'daily',
  selectedTemplateId: null,

  submissionData: null,
  fieldAggregation: null,

  isLoading: false,
  isExporting: false,

  setDateRange: (preset, startDate?, endDate?) => {
    if (preset === 'custom' && startDate && endDate) {
      set({ dateRangePreset: preset, startDate, endDate });
    } else {
      const dates = getDateRangeForPreset(preset);
      set({ dateRangePreset: preset, ...dates });
    }
  },

  setGranularity: (g) => {
    set({ granularity: g });
  },

  setSelectedTemplateId: (id) => {
    set({ selectedTemplateId: id, fieldAggregation: null });
  },

  fetchSubmissionRate: async () => {
    const { startDate, endDate, granularity } = get();
    set({ isLoading: true });
    try {
      const tenantId = getTenantIdFromCookie();
      const params = new URLSearchParams({
        tenantId,
        startDate,
        endDate,
        granularity,
      });
      const res = await fetch(`/api/daily-reports/analytics/submission-rate?${params}`);
      if (!res.ok) throw new Error('提出率データの取得に失敗しました');
      const json = await res.json();
      set({ submissionData: json.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch submission rate:', error);
      set({ isLoading: false });
    }
  },

  fetchFieldAggregation: async () => {
    const { selectedTemplateId, startDate, endDate } = get();
    if (!selectedTemplateId) return;
    set({ isLoading: true });
    try {
      const tenantId = getTenantIdFromCookie();
      const params = new URLSearchParams({
        tenantId,
        templateId: selectedTemplateId,
        startDate,
        endDate,
      });
      const res = await fetch(`/api/daily-reports/analytics/field-aggregation?${params}`);
      if (!res.ok) throw new Error('フィールド集計データの取得に失敗しました');
      const json = await res.json();
      set({ fieldAggregation: json.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch field aggregation:', error);
      set({ isLoading: false });
    }
  },

  setIsExporting: (v) => {
    set({ isExporting: v });
  },
}));
