/**
 * 会社設定ストア
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DATA_VERSION = 1;

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

interface CompanySettingsState {
  // データ
  companyInfo: CompanyInfo;
  payrollSettings: PayrollSettings;
  yearEndAdjustmentSettings: YearEndAdjustmentSettings;

  // アクション
  updateCompanyInfo: (info: Partial<CompanyInfo>) => void;
  updatePayrollSettings: (settings: Partial<PayrollSettings>) => void;
  updateYearEndAdjustmentSettings: (settings: Partial<YearEndAdjustmentSettings>) => void;
  resetSettings: () => void;
}

// デフォルト値
const defaultCompanyInfo: CompanyInfo = {
  name: 'サンプル株式会社',
  nameKana: 'サンプルカブシキガイシャ',
  postalCode: '100-0001',
  address: '東京都千代田区千代田1-1-1',
  phone: '03-1234-5678',
  email: 'info@sample.co.jp',
  representativeName: '山田 太郎',
  representativeTitle: '代表取締役',
  taxOffice: '麹町税務署',
  fiscalYearEnd: '03', // 3月決算
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

const initialState = {
  companyInfo: defaultCompanyInfo,
  payrollSettings: defaultPayrollSettings,
  yearEndAdjustmentSettings: defaultYearEndAdjustmentSettings,
};

const createCompanySettingsStore = () => {
  const storeCreator = (set: any) => ({
    ...initialState,

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

    resetSettings: () => {
      set(initialState);
    },
  });

  // SSR時はpersistを使わない
  if (typeof window === 'undefined') {
    return create<CompanySettingsState>()(storeCreator);
  }

  // クライアントサイドではpersistを使用
  return create<CompanySettingsState>()(
    persist(storeCreator, {
      name: 'company-settings-store',
      version: DATA_VERSION,
    })
  );
};

export const useCompanySettingsStore = createCompanySettingsStore();
