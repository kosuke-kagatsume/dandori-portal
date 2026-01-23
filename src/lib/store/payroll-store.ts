'use client';

import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAttendanceHistoryStore } from './attendance-history-store';
import { calculateMonthlyIncomeTax, calculateBonusIncomeTax } from '@/lib/payroll/income-tax-calculator';
import {
  YearEndAdjustmentResult,
  YearEndAdjustmentDeductions,
  YearEndAdjustmentDeclaration,
} from '@/lib/payroll/year-end-adjustment-types';
import { calculateYearEndAdjustment } from '@/lib/payroll/year-end-adjustment-calculator';
import {
  BonusEvaluation,
  PerformanceRating,
  getBonusMultiplier,
} from '@/lib/payroll/performance-evaluation-types';

// 型定義とデータを分離ファイルからインポート
import {
  EmployeeSalaryMaster,
  PayrollCalculation,
  BonusCalculation,
  INSURANCE_RATES,
} from '@/lib/payroll/types';
import { initialSalaryMasters } from '@/lib/payroll/salary-master-data';

const DATA_VERSION = 4; // 所得税計算エンジン統合（dependentsフィールド追加）

type PayrollState = {
  _version: number;
  salaryMasters: EmployeeSalaryMaster[];
  calculations: PayrollCalculation[];
  bonusCalculations: BonusCalculation[];
  bonusEvaluations: BonusEvaluation[]; // 賞与評価データ
  yearEndAdjustments: YearEndAdjustmentResult[]; // 年末調整計算結果
  yearEndAdjustmentDeclarations: YearEndAdjustmentDeclaration[]; // 年末調整申告データ
  isCalculating: boolean;
  currentPeriod: string;
  resetToSeed: () => void;
  runPayroll: (period?: string) => Promise<void>;
  calculatePayroll: (employeeId: string, period: string) => PayrollCalculation;
  calculateAllEmployees: (period: string) => PayrollCalculation[];
  getCalculationsByPeriod: (period: string) => PayrollCalculation[];
  getSalaryMaster: (employeeId: string) => EmployeeSalaryMaster | undefined;

  // データ追加メソッド（モックデータ用）
  addCalculation: (calculation: PayrollCalculation) => void;
  addMultipleCalculations: (calculations: PayrollCalculation[]) => void;

  // 賞与関連メソッド
  calculateBonus: (employeeId: string, period: string, bonusType: 'summer' | 'winter' | 'special') => BonusCalculation;
  calculateAllEmployeesBonus: (period: string, bonusType: 'summer' | 'winter' | 'special') => BonusCalculation[];
  getBonusCalculationsByPeriod: (period: string, bonusType?: 'summer' | 'winter' | 'special') => BonusCalculation[];
  runBonusCalculation: (period: string, bonusType: 'summer' | 'winter' | 'special') => Promise<void>;

  // 年末調整関連メソッド
  runYearEndAdjustment: (fiscalYear: number, employeeId: string, deductions: YearEndAdjustmentDeductions) => Promise<YearEndAdjustmentResult>;
  getYearEndAdjustment: (fiscalYear: number, employeeId: string) => YearEndAdjustmentResult | undefined;
  getYearEndAdjustmentsByYear: (fiscalYear: number) => YearEndAdjustmentResult[];
  saveDeclaration: (declaration: YearEndAdjustmentDeclaration) => void;
  getDeclaration: (fiscalYear: number, employeeId: string) => YearEndAdjustmentDeclaration | undefined;

  // 賞与評価データ管理メソッド
  saveBonusEvaluation: (evaluation: BonusEvaluation) => void;
  getBonusEvaluation: (fiscalYear: number, employeeId: string, bonusType: 'summer' | 'winter' | 'special') => BonusEvaluation | undefined;
  getBonusEvaluationsByYear: (fiscalYear: number) => BonusEvaluation[];
};

const initialState: Pick<PayrollState, '_version' | 'salaryMasters' | 'calculations' | 'bonusCalculations' | 'bonusEvaluations' | 'yearEndAdjustments' | 'yearEndAdjustmentDeclarations' | 'isCalculating' | 'currentPeriod'> = {
  _version: DATA_VERSION,
  salaryMasters: initialSalaryMasters,
  calculations: [],
  bonusCalculations: [],
  bonusEvaluations: [],
  yearEndAdjustments: [],
  yearEndAdjustmentDeclarations: [],
  isCalculating: false,
  currentPeriod: new Date().toISOString().slice(0, 7),
};

// SSR対応: サーバーではpersistを無効化
const createPayrollStore = () => {
  const storeCreator: StateCreator<PayrollState> = (set, get) => ({
          ...initialState,

          resetToSeed: () => {
            console.log('[PayrollStore] Resetting to seed data with 50 employees');
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

          // モックデータ追加用メソッド
          addCalculation: (calculation: PayrollCalculation) => {
            set((state: PayrollState) => ({
              calculations: [...state.calculations, calculation]
            }));
          },

          addMultipleCalculations: (calculations: PayrollCalculation[]) => {
            set((state: PayrollState) => ({
              calculations: [...state.calculations, ...calculations]
            }));
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

            // 源泉徴収税額計算（源泉徴収税額表を使用）
            const taxableIncome = grossSalary - (healthInsurance + pension + employmentInsurance);
            const dependents = master.dependents || 0; // 扶養人数（未設定の場合は0）
            const incomeTax = calculateMonthlyIncomeTax(taxableIncome, dependents);

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

            // 査定賞与の計算
            // 賞与評価データから取得、なければランダム生成
            const year = parseInt(period.split('-')[0]);
            const existingEvaluation = get().bonusEvaluations.find((e: BonusEvaluation) =>
              e.employeeId === employeeId && e.fiscalYear === year && e.bonusType === bonusType
            );

            let performanceRating: PerformanceRating;
            let performanceScore: number;
            let performanceMultiplier: number;

            if (existingEvaluation) {
              // 評価データが存在する場合
              performanceRating = existingEvaluation.performanceRating;
              performanceScore = existingEvaluation.performanceScore;
              performanceMultiplier = existingEvaluation.bonusMultiplier;
            } else {
              // 評価データがない場合はランダム生成（後方互換性）
              const performanceRatings: PerformanceRating[] = ['S', 'A', 'B', 'C', 'D'];
              performanceRating = performanceRatings[Math.floor(Math.random() * performanceRatings.length)];
              performanceMultiplier = getBonusMultiplier(performanceRating);
              performanceScore = { 'S': 95, 'A': 85, 'B': 75, 'C': 65, 'D': 50 }[performanceRating];
            }

            const performanceBonus = Math.round(basicBonus * performanceMultiplier);

            // 特別手当
            const specialAllowance = bonusType === 'special' ? 50000 : 0;

            // 総支給額
            const totalGrossBonus = basicBonus + positionBonus + performanceBonus + specialAllowance;

            // 控除額計算（社会保険料）
            const healthInsurance = Math.round(totalGrossBonus * INSURANCE_RATES.health.employee);
            const pension = Math.round(totalGrossBonus * INSURANCE_RATES.pension.employee);
            const employmentInsurance = Math.round(totalGrossBonus * INSURANCE_RATES.employment.employee);

            // 源泉徴収税額（賞与用税率表を使用）
            const taxableBonus = totalGrossBonus - (healthInsurance + pension + employmentInsurance);
            const dependents = master.dependents || 0;

            // 前月給与を取得（社会保険料控除後）
            // 実際の給与計算結果から取得するのが理想だが、ここでは簡易的にマスターから計算
            const previousMonthGrossSalary = master.basicSalary + master.positionAllowance +
              master.skillAllowance + master.housingAllowance + master.familyAllowance + master.commutingAllowance;
            const previousMonthSocialInsurance = Math.round(
              previousMonthGrossSalary * (INSURANCE_RATES.health.employee + INSURANCE_RATES.pension.employee + INSURANCE_RATES.employment.employee)
            );
            const previousMonthSalary = previousMonthGrossSalary - previousMonthSocialInsurance;

            const incomeTax = calculateBonusIncomeTax(taxableBonus, previousMonthSalary, dependents);

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

          // 年末調整関連メソッド
          runYearEndAdjustment: async (fiscalYear: number, employeeId: string, deductions: YearEndAdjustmentDeductions): Promise<YearEndAdjustmentResult> => {
            set({ isCalculating: true });
            try {
              const master = get().getSalaryMaster(employeeId);
              if (!master) {
                throw new Error(`Employee master not found: ${employeeId}`);
              }

              // 年間給与の集計（1月〜12月）
              const yearCalculations = get().calculations.filter((c: PayrollCalculation) => {
                const year = parseInt(c.period.split('-')[0]);
                return year === fiscalYear && c.employeeId === employeeId;
              });

              const totalAnnualIncome = yearCalculations.reduce((sum, c) => sum + c.grossSalary, 0);
              const withheldTaxTotal = yearCalculations.reduce((sum, c) => sum + c.incomeTax, 0);

              // 年末調整計算を実行
              const result = calculateYearEndAdjustment(
                employeeId,
                master.employeeName,
                master.department,
                fiscalYear,
                totalAnnualIncome,
                withheldTaxTotal,
                deductions
              );

              // 結果を保存
              const existing = get().yearEndAdjustments.filter((a: YearEndAdjustmentResult) =>
                !(a.fiscalYear === fiscalYear && a.employeeId === employeeId)
              );
              const updated = [...existing, result];
              set({ yearEndAdjustments: updated });

              return result;
            } finally {
              set({ isCalculating: false });
            }
          },

          getYearEndAdjustment: (fiscalYear: number, employeeId: string) => {
            return get().yearEndAdjustments.find((a: YearEndAdjustmentResult) =>
              a.fiscalYear === fiscalYear && a.employeeId === employeeId
            );
          },

          getYearEndAdjustmentsByYear: (fiscalYear: number) => {
            return get().yearEndAdjustments.filter((a: YearEndAdjustmentResult) => a.fiscalYear === fiscalYear);
          },

          saveDeclaration: (declaration: YearEndAdjustmentDeclaration) => {
            const existing = get().yearEndAdjustmentDeclarations.filter((d: YearEndAdjustmentDeclaration) =>
              !(d.fiscalYear === declaration.fiscalYear && d.employeeId === declaration.employeeId)
            );
            const updated = [...existing, declaration];
            set({ yearEndAdjustmentDeclarations: updated });
          },

          getDeclaration: (fiscalYear: number, employeeId: string) => {
            return get().yearEndAdjustmentDeclarations.find((d: YearEndAdjustmentDeclaration) =>
              d.fiscalYear === fiscalYear && d.employeeId === employeeId
            );
          },

          // 賞与評価データ管理メソッド
          saveBonusEvaluation: (evaluation: BonusEvaluation) => {
            const existing = get().bonusEvaluations.filter((e: BonusEvaluation) =>
              !(e.fiscalYear === evaluation.fiscalYear && e.employeeId === evaluation.employeeId && e.bonusType === evaluation.bonusType)
            );
            const updated = [...existing, evaluation];
            set({ bonusEvaluations: updated });
          },

          getBonusEvaluation: (fiscalYear: number, employeeId: string, bonusType: 'summer' | 'winter' | 'special') => {
            return get().bonusEvaluations.find((e: BonusEvaluation) =>
              e.fiscalYear === fiscalYear && e.employeeId === employeeId && e.bonusType === bonusType
            );
          },

          getBonusEvaluationsByYear: (fiscalYear: number) => {
            return get().bonusEvaluations.filter((e: BonusEvaluation) => e.fiscalYear === fiscalYear);
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
      skipHydration: true,
      version: DATA_VERSION,
      migrate: (persisted, version) => {
        console.log('[PayrollStore] Migration check:', { version, dataVersion: DATA_VERSION });
        const safe = (persisted as Partial<PayrollState>) || {};
        const count = Array.isArray(safe.salaryMasters) ? safe.salaryMasters.length : 0;

        if (version !== DATA_VERSION || count < 50) {
          console.log('[PayrollStore] Forcing reset due to version/count mismatch:', { version, count });
          return { ...initialState };
        }
        return { ...safe } as PayrollState;
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        _version: s._version,
        salaryMasters: s.salaryMasters,
        calculations: s.calculations,
        bonusCalculations: s.bonusCalculations,
        bonusEvaluations: s.bonusEvaluations,
        yearEndAdjustments: s.yearEndAdjustments,
        yearEndAdjustmentDeclarations: s.yearEndAdjustmentDeclarations,
        currentPeriod: s.currentPeriod
      }),
    })
  );
};


export const usePayrollStore = createPayrollStore();
