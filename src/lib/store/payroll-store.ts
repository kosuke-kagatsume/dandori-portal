'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAttendanceHistoryStore } from './attendance-history-store';

const DATA_VERSION = 3; // SSR対応実装のため上げる

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
  updatedAt: string;
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

// 2025年の社会保険料率
const INSURANCE_RATES = {
  health: { employee: 0.0495, employer: 0.0495 },
  pension: { employee: 0.0915, employer: 0.0915 },
  employment: { employee: 0.006, employer: 0.0095 },
  accident: { employer: 0.003 },
};

// 15名の従業員マスタデータ
const initialSalaryMasters: EmployeeSalaryMaster[] = [
  {
    id: '1',
    employeeId: 'demo-user-1',
    employeeName: '田中太郎',
    department: '営業部',
    position: '部長',
    basicSalary: 550000,
    positionAllowance: 100000,
    skillAllowance: 30000,
    housingAllowance: 40000,
    familyAllowance: 30000,
    commutingAllowance: 15000,
    hourlyRate: 3500,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 45000,
    unionFee: 3000,
    savingsAmount: 20000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    employeeId: 'user-2',
    employeeName: '佐藤花子',
    department: '経理部',
    position: '主任',
    basicSalary: 380000,
    positionAllowance: 30000,
    skillAllowance: 15000,
    housingAllowance: 25000,
    familyAllowance: 10000,
    commutingAllowance: 12000,
    hourlyRate: 2400,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 24000,
    savingsAmount: 10000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    employeeId: 'user-3',
    employeeName: '鈴木一郎',
    department: '技術部',
    position: '課長',
    basicSalary: 480000,
    positionAllowance: 60000,
    skillAllowance: 40000,
    housingAllowance: 30000,
    familyAllowance: 30000,
    commutingAllowance: 18000,
    hourlyRate: 3200,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 38000,
    unionFee: 2500,
    loanRepayment: 15000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    employeeId: 'user-4',
    employeeName: '高橋美咲',
    department: '人事部',
    position: 'スタッフ',
    basicSalary: 280000,
    positionAllowance: 0,
    skillAllowance: 10000,
    housingAllowance: 20000,
    familyAllowance: 0,
    commutingAllowance: 15000,
    hourlyRate: 1900,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 16000,
    savingsAmount: 5000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    employeeId: 'user-5',
    employeeName: '渡辺健太',
    department: '営業部',
    position: 'スタッフ',
    basicSalary: 350000,
    positionAllowance: 20000,
    skillAllowance: 15000,
    housingAllowance: 25000,
    familyAllowance: 20000,
    commutingAllowance: 10000,
    hourlyRate: 2300,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 22000,
    unionFee: 2000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    employeeId: 'user-6',
    employeeName: '山田雅子',
    department: '総務部',
    position: '課長',
    basicSalary: 420000,
    positionAllowance: 50000,
    skillAllowance: 20000,
    housingAllowance: 30000,
    familyAllowance: 15000,
    commutingAllowance: 14000,
    hourlyRate: 2800,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 30000,
    unionFee: 2500,
    savingsAmount: 15000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '7',
    employeeId: 'user-7',
    employeeName: '伊藤幸子',
    department: '広報部',
    position: 'スタッフ',
    basicSalary: 320000,
    positionAllowance: 0,
    skillAllowance: 25000,
    housingAllowance: 22000,
    familyAllowance: 10000,
    commutingAllowance: 13000,
    hourlyRate: 2100,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 19000,
    savingsAmount: 8000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '8',
    employeeId: 'user-8',
    employeeName: '小林直樹',
    department: '法務部',
    position: '主任',
    basicSalary: 450000,
    positionAllowance: 40000,
    skillAllowance: 35000,
    housingAllowance: 35000,
    familyAllowance: 25000,
    commutingAllowance: 16000,
    hourlyRate: 3000,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 32000,
    unionFee: 3000,
    savingsAmount: 18000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '9',
    employeeId: 'user-9',
    employeeName: '加藤明美',
    department: '企画部',
    position: 'スタッフ',
    basicSalary: 290000,
    positionAllowance: 0,
    skillAllowance: 12000,
    housingAllowance: 18000,
    familyAllowance: 0,
    commutingAllowance: 9000,
    hourlyRate: 1950,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 17000,
    savingsAmount: 6000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '10',
    employeeId: 'user-10',
    employeeName: '斎藤隆',
    department: '技術部',
    position: '部長',
    basicSalary: 500000,
    positionAllowance: 80000,
    skillAllowance: 50000,
    housingAllowance: 40000,
    familyAllowance: 30000,
    commutingAllowance: 20000,
    hourlyRate: 3300,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 40000,
    unionFee: 3500,
    savingsAmount: 25000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '11',
    employeeId: 'user-11',
    employeeName: '中村優子',
    department: '経理部',
    position: 'スタッフ',
    basicSalary: 310000,
    positionAllowance: 0,
    skillAllowance: 18000,
    housingAllowance: 20000,
    familyAllowance: 15000,
    commutingAllowance: 11000,
    hourlyRate: 2050,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 18500,
    savingsAmount: 7000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '12',
    employeeId: 'user-12',
    employeeName: '森田健一',
    department: '営業部',
    position: '課長',
    basicSalary: 480000,
    positionAllowance: 60000,
    skillAllowance: 30000,
    housingAllowance: 32000,
    familyAllowance: 25000,
    commutingAllowance: 18000,
    hourlyRate: 3200,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 35000,
    unionFee: 2800,
    savingsAmount: 20000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '13',
    employeeId: 'user-13',
    employeeName: '吉田美穂',
    department: '人事部',
    position: '主任',
    basicSalary: 390000,
    positionAllowance: 35000,
    skillAllowance: 22000,
    housingAllowance: 28000,
    familyAllowance: 20000,
    commutingAllowance: 15000,
    hourlyRate: 2600,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 26000,
    unionFee: 2200,
    savingsAmount: 12000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '14',
    employeeId: 'user-14',
    employeeName: '橋本大輔',
    department: '総務部',
    position: 'スタッフ',
    basicSalary: 340000,
    positionAllowance: 15000,
    skillAllowance: 20000,
    housingAllowance: 25000,
    familyAllowance: 10000,
    commutingAllowance: 12000,
    hourlyRate: 2250,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 20500,
    savingsAmount: 9000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '15',
    employeeId: 'user-15',
    employeeName: '西田恵理',
    department: '広報部',
    position: '課長',
    basicSalary: 410000,
    positionAllowance: 45000,
    skillAllowance: 28000,
    housingAllowance: 30000,
    familyAllowance: 20000,
    commutingAllowance: 17000,
    hourlyRate: 2750,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 28500,
    unionFee: 2600,
    savingsAmount: 14000,
    updatedAt: new Date().toISOString(),
  },
];

type PayrollState = {
  _version: number;
  salaryMasters: EmployeeSalaryMaster[];
  calculations: PayrollCalculation[];
  bonusCalculations: BonusCalculation[];
  isCalculating: boolean;
  currentPeriod: string;
  resetToSeed: () => void;
  runPayroll: (period?: string) => Promise<void>;
  calculatePayroll: (employeeId: string, period: string) => PayrollCalculation;
  calculateAllEmployees: (period: string) => PayrollCalculation[];
  getCalculationsByPeriod: (period: string) => PayrollCalculation[];
  getSalaryMaster: (employeeId: string) => EmployeeSalaryMaster | undefined;

  // 賞与関連メソッド
  calculateBonus: (employeeId: string, period: string, bonusType: 'summer' | 'winter' | 'special') => BonusCalculation;
  calculateAllEmployeesBonus: (period: string, bonusType: 'summer' | 'winter' | 'special') => BonusCalculation[];
  getBonusCalculationsByPeriod: (period: string, bonusType?: 'summer' | 'winter' | 'special') => BonusCalculation[];
  runBonusCalculation: (period: string, bonusType: 'summer' | 'winter' | 'special') => Promise<void>;
};

const initialState: Pick<PayrollState, '_version' | 'salaryMasters' | 'calculations' | 'bonusCalculations' | 'isCalculating' | 'currentPeriod'> = {
  _version: DATA_VERSION,
  salaryMasters: initialSalaryMasters,
  calculations: [],
  bonusCalculations: [],
  isCalculating: false,
  currentPeriod: new Date().toISOString().slice(0, 7),
};

// SSR対応: サーバーではpersistを無効化
const createPayrollStore = () => {
  const storeCreator = (set: any, get: any) => ({
          ...initialState,

          resetToSeed: () => {
            console.log('[PayrollStore] Resetting to seed data with 15 employees');
            set({ ...initialState });
          },

          runPayroll: async (period?: string) => {
            const targetPeriod = period || get().currentPeriod;
            if (get().isCalculating) return;

            console.log('[PayrollStore] Running payroll calculation for', targetPeriod);
            set({ isCalculating: true });

            try {
              const results = get().calculateAllEmployees(targetPeriod);
              console.log('[PayrollStore] Calculated payroll for', results.length, 'employees');
              set({ calculations: results });
            } finally {
              set({ isCalculating: false });
            }
          },

          getSalaryMaster: (employeeId: string) => {
            return get().salaryMasters.find((m: EmployeeSalaryMaster) => m.employeeId === employeeId);
          },

          getCalculationsByPeriod: (period: string) => {
            return get().calculations.filter((c: PayrollCalculation) => c.period === period);
          },

          calculatePayroll: (employeeId: string, period: string) => {
            const master = get().getSalaryMaster(employeeId);
            if (!master) {
              throw new Error(`Employee master not found: ${employeeId}`);
            }

            // 勤怠データから労働時間を取得
            const attendanceStore = useAttendanceHistoryStore.getState();
            const [year, month] = period.split('-').map(Number);
            const attendanceRecords = attendanceStore.getMonthlyRecords(year, month, employeeId);
            const monthlyStats = attendanceStore.getMonthlyStats(year, month, employeeId);

            // 残業時間の詳細計算
            let overtimeHours = 0;
            let lateNightHours = 0;
            let holidayWorkHours = 0;

            attendanceRecords.forEach((record) => {
              const dayOfWeek = new Date(record.date).getDay();
              const isHoliday = dayOfWeek === 0 || dayOfWeek === 6;

              if (isHoliday && record.workMinutes > 0) {
                holidayWorkHours += record.workMinutes / 60;
              } else if (record.overtimeMinutes > 0) {
                overtimeHours += record.overtimeMinutes / 60;
              }

              if (record.checkOut) {
                const [checkOutHour, checkOutMinute] = record.checkOut.split(':').map(Number);
                const checkOutTime = checkOutHour + checkOutMinute / 60;

                if (checkOutTime >= 22) {
                  const lateNightMinutes = (checkOutTime - 22) * 60;
                  lateNightHours += Math.min(lateNightMinutes / 60, 7);
                } else if (checkOutTime <= 5) {
                  lateNightHours += checkOutTime;
                }
              }
            });

            // 残業代計算
            const regularOvertimeHours = Math.min(overtimeHours, 60);
            const excessiveOvertimeHours = Math.max(overtimeHours - 60, 0);

            const regularOvertimePay = Math.round(master.hourlyRate * 1.25 * regularOvertimeHours);
            const excessiveOvertimePay = Math.round(master.hourlyRate * 1.50 * excessiveOvertimeHours);
            const lateNightPay = Math.round(master.hourlyRate * 1.50 * lateNightHours);
            const holidayPay = Math.round(master.hourlyRate * 1.35 * holidayWorkHours);

            const overtimePay = regularOvertimePay + excessiveOvertimePay;

            // 総支給額計算
            const totalAllowances =
              master.positionAllowance +
              master.skillAllowance +
              master.housingAllowance +
              master.familyAllowance +
              master.commutingAllowance;

            const grossSalary = master.basicSalary + totalAllowances + overtimePay + lateNightPay + holidayPay;

            // 社会保険料計算
            const healthInsurance = Math.round(grossSalary * INSURANCE_RATES.health.employee);
            const pension = Math.round(grossSalary * INSURANCE_RATES.pension.employee);
            const employmentInsurance = Math.round(grossSalary * INSURANCE_RATES.employment.employee);

            // 源泉徴収税額計算
            const taxableIncome = grossSalary - (healthInsurance + pension + employmentInsurance);
            const incomeTax = master.incomeTaxAmount || Math.round(taxableIncome * 0.05);

            // その他控除
            const unionFee = master.unionFee || 0;
            const savingsAmount = master.savingsAmount || 0;
            const loanRepayment = master.loanRepayment || 0;
            const otherDeductions = unionFee + savingsAmount + loanRepayment;

            // 控除額合計
            const totalDeductions =
              healthInsurance +
              pension +
              employmentInsurance +
              incomeTax +
              (master.residentTaxAmount || 0) +
              otherDeductions;

            // 差引支給額
            const netSalary = grossSalary - totalDeductions;

            const calculation: PayrollCalculation = {
              id: `${employeeId}-${period}`,
              employeeId,
              employeeName: master.employeeName,
              department: master.department,
              period,

              // 支給額
              basicSalary: master.basicSalary,
              positionAllowance: master.positionAllowance,
              skillAllowance: master.skillAllowance,
              housingAllowance: master.housingAllowance,
              familyAllowance: master.familyAllowance,
              commutingAllowance: master.commutingAllowance,
              overtimePay,
              lateNightPay,
              holidayPay,
              totalAllowances,
              grossSalary,

              // 勤怠データ
              workDays: monthlyStats.totalWorkDays,
              totalWorkHours: monthlyStats.totalWorkHours,
              overtimeHours,
              lateNightHours,
              holidayWorkHours,

              // 控除額
              healthInsurance,
              pension,
              employmentInsurance,
              incomeTax,
              residentTax: master.residentTaxAmount || 0,
              unionFee,
              savingsAmount,
              loanRepayment,
              otherDeductions,
              totalDeductions,

              // 差引支給額
              netSalary,

              // ステータス
              status: 'draft',
              calculatedAt: new Date().toISOString(),
            };

            return calculation;
          },

          calculateAllEmployees: (period: string) => {
            const masters = get().salaryMasters;
            const calculations: PayrollCalculation[] = [];

            for (const master of masters) {
              try {
                const calculation = get().calculatePayroll(master.employeeId, period);
                calculations.push(calculation);
              } catch (error) {
                console.error(`Failed to calculate payroll for ${master.employeeId}:`, error);
              }
            }

            return calculations;
          },

          // 賞与関連メソッド実装
          calculateBonus: (employeeId: string, period: string, bonusType: 'summer' | 'winter' | 'special') => {
            const master = get().getSalaryMaster(employeeId);
            if (!master) {
              throw new Error(`Employee master not found: ${employeeId}`);
            }

            // 基本賞与計算（基本給の2-6ヶ月分）
            const bonusMonths = bonusType === 'summer' ? 2.5 : bonusType === 'winter' ? 3.0 : 1.0;
            const basicBonus = Math.round(master.basicSalary * bonusMonths);

            // 役職賞与（役職手当の1-3ヶ月分）
            const positionBonusMonths = bonusType === 'summer' ? 1.5 : bonusType === 'winter' ? 2.0 : 0.5;
            const positionBonus = Math.round(master.positionAllowance * positionBonusMonths);

            // 査定賞与（基本賞与の0-50%）- 現在はランダム
            const performanceRatings: Array<'S' | 'A' | 'B' | 'C' | 'D'> = ['S', 'A', 'B', 'C', 'D'];
            const performanceRating = performanceRatings[Math.floor(Math.random() * performanceRatings.length)];
            const performanceMultiplier = {
              'S': 0.5, 'A': 0.3, 'B': 0.15, 'C': 0.05, 'D': 0
            }[performanceRating];
            const performanceBonus = Math.round(basicBonus * performanceMultiplier);
            const performanceScore = { 'S': 95, 'A': 85, 'B': 75, 'C': 65, 'D': 50 }[performanceRating];

            // 特別手当
            const specialAllowance = bonusType === 'special' ? 50000 : 0;

            // 総支給額
            const totalGrossBonus = basicBonus + positionBonus + performanceBonus + specialAllowance;

            // 控除額計算（社会保険料）
            const healthInsurance = Math.round(totalGrossBonus * INSURANCE_RATES.health.employee);
            const pension = Math.round(totalGrossBonus * INSURANCE_RATES.pension.employee);
            const employmentInsurance = Math.round(totalGrossBonus * INSURANCE_RATES.employment.employee);

            // 源泉徴収税額（賞与用税率）
            const taxableBonus = totalGrossBonus - (healthInsurance + pension + employmentInsurance);
            const incomeTax = Math.round(taxableBonus * 0.1021); // 賞与用税率

            const residentTax = 0; // 賞与は住民税なし
            const totalDeductions = healthInsurance + pension + employmentInsurance + incomeTax + residentTax;

            // 差引支給額
            const netBonus = totalGrossBonus - totalDeductions;

            const bonusCalculation: BonusCalculation = {
              id: `${employeeId}-${period}-${bonusType}`,
              employeeId,
              employeeName: master.employeeName,
              department: master.department,
              position: master.position,
              period,
              bonusType,

              // 支給額
              basicBonus,
              positionBonus,
              performanceBonus,
              specialAllowance,
              totalGrossBonus,

              // 控除額
              healthInsurance,
              pension,
              employmentInsurance,
              incomeTax,
              residentTax,
              totalDeductions,

              // 差引支給額
              netBonus,

              // 査定情報
              performanceRating,
              performanceScore,

              // ステータス
              status: 'draft',
              calculatedAt: new Date().toISOString(),
            };

            return bonusCalculation;
          },

          calculateAllEmployeesBonus: (period: string, bonusType: 'summer' | 'winter' | 'special') => {
            const masters = get().salaryMasters;
            const calculations: BonusCalculation[] = [];

            for (const master of masters) {
              try {
                const calculation = get().calculateBonus(master.employeeId, period, bonusType);
                calculations.push(calculation);
              } catch (error) {
                console.error(`Failed to calculate bonus for ${master.employeeId}:`, error);
              }
            }

            return calculations;
          },

          getBonusCalculationsByPeriod: (period: string, bonusType?: 'summer' | 'winter' | 'special') => {
            const all = get().bonusCalculations.filter((c: BonusCalculation) => c.period === period);
            return bonusType ? all.filter((c: BonusCalculation) => c.bonusType === bonusType) : all;
          },

          runBonusCalculation: async (period: string, bonusType: 'summer' | 'winter' | 'special') => {
            set({ isCalculating: true });
            try {
              const calculations = get().calculateAllEmployeesBonus(period, bonusType);
              const existing = get().bonusCalculations.filter((c: BonusCalculation) => !(c.period === period && c.bonusType === bonusType));
              const updated = [...existing, ...calculations];
              set({ bonusCalculations: updated });
            } finally {
              set({ isCalculating: false });
            }
          },
        });

  // SSR時はpersistを使わない
  if (typeof window === 'undefined') {
    return create<PayrollState>()(storeCreator);
  }

  // クライアントサイドではpersistを使用
  return create<PayrollState>()(
    persist(storeCreator, {
      name: 'payroll-store',
      version: DATA_VERSION,
      migrate: (persisted, version) => {
        console.log('[PayrollStore] Migration check:', { version, dataVersion: DATA_VERSION });
        const safe = (persisted as Partial<PayrollState>) || {};
        const count = Array.isArray(safe.salaryMasters) ? safe.salaryMasters.length : 0;

        if (version !== DATA_VERSION || count < 15) {
          console.log('[PayrollStore] Forcing reset due to version/count mismatch:', { version, count });
          return { ...initialState };
        }
        return { ...safe } as any;
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        _version: s._version,
        salaryMasters: s.salaryMasters,
        calculations: s.calculations,
        bonusCalculations: s.bonusCalculations,
        currentPeriod: s.currentPeriod
      }),
    })
  );
};

export const usePayrollStore = createPayrollStore();