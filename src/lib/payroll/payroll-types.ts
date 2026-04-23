/**
 * 給与管理 — 型定義・ラベル定数
 */

export interface ClosingDayGroup {
  id: string;
  name: string;
  closingDay: number;
  paymentMonth: string;
  paymentDay: number;
}

export interface PayCategory {
  id: string;
  name: string;
  code: string;
}

export interface Municipality {
  id: string;
  code: string;
  name: string;
  prefectureName: string;
}

export interface AllowanceItem {
  id: string;
  code: string;
  name: string;
  isTaxable: boolean;
  itemType: string;
  defaultAmount: number | null;
  sortOrder: number;
}

export interface DeductionItem {
  id: string;
  code: string;
  name: string;
  deductionCategory: string;
  sortOrder: number;
}

export interface EmployeeDependent {
  id: string;
  hasSpouse: boolean;
  spouseIsDependent: boolean;
  generalDependents: number;
  specificDependents: number;
  elderlyDependents: number;
  under16Dependents: number;
}

export interface BankAccount {
  id: string;
  bankCode: string | null;
  bankName: string;
  branchCode: string | null;
  branchName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  isPrimary: boolean;
  transferAmount: number | null;
  sortOrder: number;
}

export interface ResidentTaxMonthly {
  id: string;
  fiscalYear: number;
  month6: number; month7: number; month8: number; month9: number;
  month10: number; month11: number; month12: number;
  month1: number; month2: number; month3: number;
  month4: number; month5: number;
}

export interface SalarySettings {
  id: string;
  paymentType: string;
  basicSalary: number;
  hourlyRate: number | null;
  dailyRate: number | null;
  socialInsuranceGrade: number | null;
  employmentInsuranceRate: number;
  closingDayGroupId: string | null;
  payCategoryId: string | null;
  municipalityId: string | null;
  commuteMethod: string | null;
  commuteDistance: number | null;
  commuteAllowance: number | null;
  commuteNontaxableLimit: number | null;
  healthInsuranceGrade: number | null;
  pensionInsuranceGrade: number | null;
  nursingInsuranceApplicable: boolean;
}

// ── ラベル定数 ──────────────────────────────────────────

export const commuteMethodLabels: Record<string, string> = {
  train: '電車',
  bus: 'バス',
  car: '自動車',
  bicycle: '自転車',
  walk: '徒歩',
  other: 'その他',
};

export const accountTypeLabels: Record<string, string> = {
  ordinary: '普通',
  current: '当座',
};

export const taxClassLabels: Record<string, string> = {
  kou: '甲欄',
  otsu: '乙欄',
};

export const deductionCategoryLabels: Record<string, string> = {
  social_insurance: '法定控除',
  tax: '税金',
  other: '任意控除',
};

export const residentTaxMonthKeys = [
  'month6', 'month7', 'month8', 'month9', 'month10', 'month11',
  'month12', 'month1', 'month2', 'month3', 'month4', 'month5',
] as const;

export const residentTaxMonthLabels = [
  '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月', '5月',
];
