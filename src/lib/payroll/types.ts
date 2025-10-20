// 従業員の給与マスタデータ
export interface EmployeeSalaryMaster {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  basicSalary: number;
  positionAllowance: number;
  skillAllowance: number;
  housingAllowance: number;
  familyAllowance: number;
  commutingAllowance: number;
  hourlyRate: number;
  overtimeRate: number;
  lateNightRate: number;
  holidayRate: number;
  healthInsuranceRate: number;
  pensionRate: number;
  employmentInsuranceRate: number;
  residentTaxAmount?: number;
  incomeTaxAmount?: number;
  unionFee?: number;
  savingsAmount?: number;
  loanRepayment?: number;
  dependents?: number; // 扶養親族等の数（所得税計算用）
  updatedAt: string;
}

// 給与計算結果
export interface PayrollCalculation {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  period: string; // YYYY-MM

  // 支給額
  basicSalary: number;
  positionAllowance: number;
  skillAllowance: number;
  housingAllowance: number;
  familyAllowance: number;
  commutingAllowance: number;
  overtimePay: number;
  lateNightPay: number;
  holidayPay: number;
  totalAllowances: number;
  grossSalary: number;

  // 勤怠データ
  workDays: number;
  totalWorkHours: number;
  overtimeHours: number;
  lateNightHours: number;
  holidayWorkHours: number;

  // 控除額
  healthInsurance: number;
  pension: number;
  employmentInsurance: number;
  incomeTax: number;
  residentTax: number;
  unionFee: number;
  savingsAmount: number;
  loanRepayment: number;
  otherDeductions: number;
  totalDeductions: number;

  // 差引支給額
  netSalary: number;

  // ステータス
  status: 'draft' | 'approved' | 'paid';
  calculatedAt: string;
}

// 賞与計算結果
export interface BonusCalculation {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  period: string; // YYYY-MM (支給期間)
  bonusType: 'summer' | 'winter' | 'special'; // 賞与種別

  // 基本賞与
  basicBonus: number;
  positionBonus: number;
  performanceBonus: number; // 査定賞与
  specialAllowance: number;
  totalGrossBonus: number;

  // 控除額
  healthInsurance: number;
  pension: number;
  employmentInsurance: number;
  incomeTax: number;
  residentTax: number;
  totalDeductions: number;

  // 差引支給額
  netBonus: number;

  // 査定情報
  performanceRating: 'S' | 'A' | 'B' | 'C' | 'D';
  performanceScore: number; // 0-100
  comments?: string;

  // ステータス
  status: 'draft' | 'approved' | 'paid';
  calculatedAt: string;
  approvedAt?: string;
  paidAt?: string;
}

// 2025年の社会保険料率
export const INSURANCE_RATES = {
  health: { employee: 0.0495, employer: 0.0495 },
  pension: { employee: 0.0915, employer: 0.0915 },
  employment: { employee: 0.006, employer: 0.0095 },
  accident: { employer: 0.003 },
};
