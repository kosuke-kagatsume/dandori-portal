/**
 * 会社設定ストア
 * API連携版 - PostgreSQL永続化
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DATA_VERSION = 2;

export interface CompanyInfo {
  // 基本情報
  name: string;
  nameKana: string;
  postalCode: string;
  address: string;
  phone: string;
  fax?: string;
  email?: string;

  // 法人情報
  corporateNumber?: string; // 法人番号
  representativeName: string; // 代表者名
  representativeTitle: string; // 代表者役職

  // 税務情報
  taxOffice: string; // 所轄税務署
  taxOfficeCode?: string; // 税務署コード

  // その他
  fiscalYearEnd: string; // 決算月（MM形式）
  foundedDate?: string; // 設立日
}

export interface PayrollSettings {
  // 支給日設定
  paymentDay: number; // 支給日（1-31）
  paymentDayType: 'current' | 'next'; // 当月払い or 翌月払い

  // 締め日設定
  closingDay: number; // 締め日（1-31、末日は31）

  // 給与体系
  defaultPayType: 'monthly' | 'hourly' | 'daily';

  // 時間設定
  standardWorkHours: number; // 所定労働時間/日
  standardWorkDays: number; // 所定労働日数/月

  // 控除設定
  enableHealthInsurance: boolean;
  enablePensionInsurance: boolean;
  enableEmploymentInsurance: boolean;
  enableIncomeTax: boolean;
  enableResidentTax: boolean;
}

export interface YearEndAdjustmentSettings {
  // 年末調整期間
  adjustmentStartMonth: number; // 開始月（通常11月）
  adjustmentEndMonth: number; // 終了月（通常12月）

  // 控除項目
  enableBasicDeduction: boolean; // 基礎控除
  enableSpouseDeduction: boolean; // 配偶者控除
  enableDependentDeduction: boolean; // 扶養控除
  enableInsuranceDeduction: boolean; // 生命保険料控除
  enableSocialInsuranceDeduction: boolean; // 社会保険料控除

  // 源泉徴収票設定
  withholdingSlipFormat: 'standard' | 'detailed'; // 書式
  includeQRCode: boolean; // QRコード付与
}

export interface AttendanceSettings {
  // 勤務時間設定
  workStartTime: string; // 始業時刻
  workEndTime: string; // 終業時刻
  breakStartTime: string; // 休憩開始時刻
  breakEndTime: string; // 休憩終了時刻
  breakDurationMinutes: number; // 休憩時間（分）

  // フレックス設定
  enableFlexTime: boolean; // フレックス制度
  coreTimeStart?: string; // コアタイム開始
  coreTimeEnd?: string; // コアタイム終了

  // 残業設定
  overtimeThresholdMinutes: number; // 残業計算開始（分）
  maxOvertimeHoursPerMonth: number; // 月間残業上限（時間）

  // 打刻設定
  allowRemoteCheckIn: boolean; // リモート打刻許可
  requireLocationOnCheckIn: boolean; // 位置情報必須
  allowEarlyCheckIn: boolean; // 早出打刻許可
  earlyCheckInMinutes: number; // 早出許容時間（分）

  // 休日設定
  weeklyHolidays: string[]; // 週休日
}

export interface WorkflowSettings {
  // 承認期限設定
  defaultApprovalDeadlineDays: number; // デフォルト承認期限（日数）

  // エスカレーション設定
  enableAutoEscalation: boolean; // 自動エスカレーション
  escalationReminderDays: number; // リマインダー送信日数

  // 自動承認設定
  enableAutoApproval: boolean; // 自動承認
  autoApprovalThreshold: number; // 自動承認金額上限（円）

  // 承認ルール設定
  requireCommentOnReject: boolean; // 却下時コメント必須
  allowParallelApproval: boolean; // 並行承認許可
  enableProxyApproval: boolean; // 代理承認許可
}

interface CompanySettingsState {
  // データ
  companyInfo: CompanyInfo;
  payrollSettings: PayrollSettings;
  yearEndAdjustmentSettings: YearEndAdjustmentSettings;
  attendanceSettings: AttendanceSettings;
  workflowSettings: WorkflowSettings;

  // 状態
  initialized: boolean;
  isLoading: boolean;
  error: string | null;

  // アクション（同期版 - UIからの即時更新用）
  updateCompanyInfo: (info: Partial<CompanyInfo>) => void;
  updatePayrollSettings: (settings: Partial<PayrollSettings>) => void;
  updateYearEndAdjustmentSettings: (settings: Partial<YearEndAdjustmentSettings>) => void;
  updateAttendanceSettings: (settings: Partial<AttendanceSettings>) => void;
  updateWorkflowSettings: (settings: Partial<WorkflowSettings>) => void;
  resetSettings: () => void;

  // アクション（非同期版 - API連携用）
  fetchCompanySettings: () => Promise<void>;
  saveCompanySettings: () => Promise<void>;
  fetchPayrollSettings: () => Promise<void>;
  savePayrollSettings: () => Promise<void>;
  fetchAttendanceSettings: () => Promise<void>;
  saveAttendanceSettings: () => Promise<void>;
  fetchYearEndSettings: () => Promise<void>;
  saveYearEndSettings: () => Promise<void>;
  fetchWorkflowSettings: () => Promise<void>;
  saveWorkflowSettings: () => Promise<void>;
  fetchAllSettings: () => Promise<void>;
}

// デフォルト値
const defaultCompanyInfo: CompanyInfo = {
  name: '',
  nameKana: '',
  postalCode: '',
  address: '',
  phone: '',
  email: '',
  representativeName: '',
  representativeTitle: '',
  taxOffice: '',
  fiscalYearEnd: '03',
};

const defaultPayrollSettings: PayrollSettings = {
  paymentDay: 25,
  paymentDayType: 'current',
  closingDay: 31,
  defaultPayType: 'monthly',
  standardWorkHours: 8,
  standardWorkDays: 20,
  enableHealthInsurance: true,
  enablePensionInsurance: true,
  enableEmploymentInsurance: true,
  enableIncomeTax: true,
  enableResidentTax: true,
};

const defaultYearEndAdjustmentSettings: YearEndAdjustmentSettings = {
  adjustmentStartMonth: 11,
  adjustmentEndMonth: 12,
  enableBasicDeduction: true,
  enableSpouseDeduction: true,
  enableDependentDeduction: true,
  enableInsuranceDeduction: true,
  enableSocialInsuranceDeduction: true,
  withholdingSlipFormat: 'standard',
  includeQRCode: false,
};

const defaultAttendanceSettings: AttendanceSettings = {
  workStartTime: '09:00',
  workEndTime: '18:00',
  breakStartTime: '12:00',
  breakEndTime: '13:00',
  breakDurationMinutes: 60,
  enableFlexTime: false,
  coreTimeStart: undefined,
  coreTimeEnd: undefined,
  overtimeThresholdMinutes: 480,
  maxOvertimeHoursPerMonth: 45,
  allowRemoteCheckIn: true,
  requireLocationOnCheckIn: false,
  allowEarlyCheckIn: true,
  earlyCheckInMinutes: 30,
  weeklyHolidays: ['saturday', 'sunday'],
};

const defaultWorkflowSettings: WorkflowSettings = {
  defaultApprovalDeadlineDays: 3,
  enableAutoEscalation: false,
  escalationReminderDays: 1,
  enableAutoApproval: false,
  autoApprovalThreshold: 10000,
  requireCommentOnReject: true,
  allowParallelApproval: false,
  enableProxyApproval: false,
};

const initialState = {
  companyInfo: defaultCompanyInfo,
  payrollSettings: defaultPayrollSettings,
  yearEndAdjustmentSettings: defaultYearEndAdjustmentSettings,
  attendanceSettings: defaultAttendanceSettings,
  workflowSettings: defaultWorkflowSettings,
  initialized: false,
  isLoading: false,
  error: null,
};

const createCompanySettingsStore = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storeCreator = (set: (fn: (state: CompanySettingsState) => Partial<CompanySettingsState>) => void, get: () => CompanySettingsState & Record<string, unknown>) => ({
    ...initialState,

    // 同期アクション（UI用）
    updateCompanyInfo: (info: Partial<CompanyInfo>) => {
      set((state: CompanySettingsState) => ({
        companyInfo: { ...state.companyInfo, ...info },
      }));
    },

    updatePayrollSettings: (settings: Partial<PayrollSettings>) => {
      set((state: CompanySettingsState) => ({
        payrollSettings: { ...state.payrollSettings, ...settings },
      }));
    },

    updateYearEndAdjustmentSettings: (settings: Partial<YearEndAdjustmentSettings>) => {
      set((state: CompanySettingsState) => ({
        yearEndAdjustmentSettings: { ...state.yearEndAdjustmentSettings, ...settings },
      }));
    },

    updateAttendanceSettings: (settings: Partial<AttendanceSettings>) => {
      set((state: CompanySettingsState) => ({
        attendanceSettings: { ...state.attendanceSettings, ...settings },
      }));
    },

    updateWorkflowSettings: (settings: Partial<WorkflowSettings>) => {
      set((state: CompanySettingsState) => ({
        workflowSettings: { ...state.workflowSettings, ...settings },
      }));
    },

    resetSettings: () => {
      set(initialState);
    },

    // 非同期アクション（API連携）
    fetchCompanySettings: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch('/api/company-settings?tenantId=tenant-demo-001');
        const result = await response.json();

        if (result.success) {
          set({
            companyInfo: {
              name: result.data.name || '',
              nameKana: result.data.nameKana || '',
              postalCode: result.data.postalCode || '',
              address: result.data.address || '',
              phone: result.data.phone || '',
              fax: result.data.fax || '',
              email: result.data.email || '',
              corporateNumber: result.data.corporateNumber || '',
              representativeName: result.data.representativeName || '',
              representativeTitle: result.data.representativeTitle || '',
              taxOffice: result.data.taxOffice || '',
              taxOfficeCode: result.data.taxOfficeCode || '',
              fiscalYearEnd: result.data.fiscalYearEnd || '03',
              foundedDate: result.data.foundedDate || undefined,
            },
            isLoading: false,
          });
        } else {
          throw new Error(result.error || 'Failed to fetch company settings');
        }
      } catch (error) {
        console.error('Error fetching company settings:', error);
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },

    saveCompanySettings: async () => {
      const state = get() as CompanySettingsState;
      set({ isLoading: true, error: null });
      try {
        const response = await fetch('/api/company-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: 'tenant-demo-001',
            ...state.companyInfo,
          }),
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to save company settings');
        }
        set({ isLoading: false });
      } catch (error) {
        console.error('Error saving company settings:', error);
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },

    fetchPayrollSettings: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch('/api/payroll-settings?tenantId=tenant-demo-001');
        const result = await response.json();

        if (result.success) {
          set({
            payrollSettings: {
              paymentDay: result.data.paymentDay,
              paymentDayType: result.data.paymentDayType,
              closingDay: result.data.closingDay,
              defaultPayType: result.data.defaultPayType,
              standardWorkHours: result.data.standardWorkHours,
              standardWorkDays: result.data.standardWorkDays,
              enableHealthInsurance: result.data.enableHealthInsurance,
              enablePensionInsurance: result.data.enablePensionInsurance,
              enableEmploymentInsurance: result.data.enableEmploymentInsurance,
              enableIncomeTax: result.data.enableIncomeTax,
              enableResidentTax: result.data.enableResidentTax,
            },
            isLoading: false,
          });
        } else {
          throw new Error(result.error || 'Failed to fetch payroll settings');
        }
      } catch (error) {
        console.error('Error fetching payroll settings:', error);
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },

    savePayrollSettings: async () => {
      const state = get() as CompanySettingsState;
      set({ isLoading: true, error: null });
      try {
        const response = await fetch('/api/payroll-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: 'tenant-demo-001',
            ...state.payrollSettings,
          }),
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to save payroll settings');
        }
        set({ isLoading: false });
      } catch (error) {
        console.error('Error saving payroll settings:', error);
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },

    fetchAttendanceSettings: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch('/api/attendance-settings?tenantId=tenant-demo-001');
        const result = await response.json();

        if (result.success) {
          set({
            attendanceSettings: {
              workStartTime: result.data.workStartTime,
              workEndTime: result.data.workEndTime,
              breakStartTime: result.data.breakStartTime,
              breakEndTime: result.data.breakEndTime,
              breakDurationMinutes: result.data.breakDurationMinutes,
              enableFlexTime: result.data.enableFlexTime,
              coreTimeStart: result.data.coreTimeStart || undefined,
              coreTimeEnd: result.data.coreTimeEnd || undefined,
              overtimeThresholdMinutes: result.data.overtimeThresholdMinutes,
              maxOvertimeHoursPerMonth: result.data.maxOvertimeHoursPerMonth,
              allowRemoteCheckIn: result.data.allowRemoteCheckIn,
              requireLocationOnCheckIn: result.data.requireLocationOnCheckIn,
              allowEarlyCheckIn: result.data.allowEarlyCheckIn,
              earlyCheckInMinutes: result.data.earlyCheckInMinutes,
              weeklyHolidays: result.data.weeklyHolidays,
            },
            isLoading: false,
          });
        } else {
          throw new Error(result.error || 'Failed to fetch attendance settings');
        }
      } catch (error) {
        console.error('Error fetching attendance settings:', error);
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },

    saveAttendanceSettings: async () => {
      const state = get() as CompanySettingsState;
      set({ isLoading: true, error: null });
      try {
        const response = await fetch('/api/attendance-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: 'tenant-demo-001',
            ...state.attendanceSettings,
          }),
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to save attendance settings');
        }
        set({ isLoading: false });
      } catch (error) {
        console.error('Error saving attendance settings:', error);
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },

    fetchYearEndSettings: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch('/api/year-end-settings?tenantId=tenant-demo-001');
        const result = await response.json();

        if (result.success) {
          set({
            yearEndAdjustmentSettings: {
              adjustmentStartMonth: result.data.adjustmentStartMonth,
              adjustmentEndMonth: result.data.adjustmentEndMonth,
              enableBasicDeduction: result.data.enableBasicDeduction,
              enableSpouseDeduction: result.data.enableSpouseDeduction,
              enableDependentDeduction: result.data.enableDependentDeduction,
              enableInsuranceDeduction: result.data.enableInsuranceDeduction,
              enableSocialInsuranceDeduction: result.data.enableSocialInsuranceDeduction,
              withholdingSlipFormat: result.data.withholdingSlipFormat,
              includeQRCode: result.data.includeQRCode,
            },
            isLoading: false,
          });
        } else {
          throw new Error(result.error || 'Failed to fetch year-end settings');
        }
      } catch (error) {
        console.error('Error fetching year-end settings:', error);
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },

    saveYearEndSettings: async () => {
      const state = get() as CompanySettingsState;
      set({ isLoading: true, error: null });
      try {
        const response = await fetch('/api/year-end-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: 'tenant-demo-001',
            ...state.yearEndAdjustmentSettings,
          }),
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to save year-end settings');
        }
        set({ isLoading: false });
      } catch (error) {
        console.error('Error saving year-end settings:', error);
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },

    fetchWorkflowSettings: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch('/api/workflow-settings?tenantId=tenant-demo-001');
        const result = await response.json();

        if (result.success) {
          set({
            workflowSettings: {
              defaultApprovalDeadlineDays: result.data.defaultApprovalDeadlineDays,
              enableAutoEscalation: result.data.enableAutoEscalation,
              escalationReminderDays: result.data.escalationReminderDays,
              enableAutoApproval: result.data.enableAutoApproval,
              autoApprovalThreshold: result.data.autoApprovalThreshold,
              requireCommentOnReject: result.data.requireCommentOnReject,
              allowParallelApproval: result.data.allowParallelApproval,
              enableProxyApproval: result.data.enableProxyApproval,
            },
            isLoading: false,
          });
        } else {
          throw new Error(result.error || 'Failed to fetch workflow settings');
        }
      } catch (error) {
        console.error('Error fetching workflow settings:', error);
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },

    saveWorkflowSettings: async () => {
      const state = get() as CompanySettingsState;
      set({ isLoading: true, error: null });
      try {
        const response = await fetch('/api/workflow-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: 'tenant-demo-001',
            ...state.workflowSettings,
          }),
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to save workflow settings');
        }
        set({ isLoading: false });
      } catch (error) {
        console.error('Error saving workflow settings:', error);
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },

    fetchAllSettings: async () => {
      const { fetchCompanySettings, fetchPayrollSettings, fetchAttendanceSettings, fetchYearEndSettings, fetchWorkflowSettings } = get();
      set({ initialized: false, isLoading: true });

      try {
        await Promise.all([
          fetchCompanySettings(),
          fetchPayrollSettings(),
          fetchAttendanceSettings(),
          fetchYearEndSettings(),
          fetchWorkflowSettings(),
        ]);
        set({ initialized: true });
      } catch (error) {
        console.error('Error fetching all settings:', error);
        set({ initialized: true }); // エラーでも初期化完了とする
      }
    },
  });

  // SSR時はpersistを使わない
  if (typeof window === 'undefined') {
    return create<CompanySettingsState>()(storeCreator);
  }

  // クライアントサイドではpersistを使用（オフライン対応のキャッシュとして）
  return create<CompanySettingsState>()(
    persist(storeCreator, {
      name: 'company-settings-store',
      version: DATA_VERSION,
      partialize: (state) => ({
        companyInfo: state.companyInfo,
        payrollSettings: state.payrollSettings,
        yearEndAdjustmentSettings: state.yearEndAdjustmentSettings,
        attendanceSettings: state.attendanceSettings,
        workflowSettings: state.workflowSettings,
      }),
    })
  );
};

export const useCompanySettingsStore = createCompanySettingsStore();
