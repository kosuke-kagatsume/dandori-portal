/**
 * 給与計算ロジック
 */

import { PaySlip, SalaryMaster, PayrollCalculationParams } from '@/types/payroll';

// 日本の税率テーブル（2025年）
const INCOME_TAX_RATES = [
  { min: 0, max: 1950000, rate: 0.05, deduction: 0 },
  { min: 1950000, max: 3300000, rate: 0.10, deduction: 97500 },
  { min: 3300000, max: 6950000, rate: 0.20, deduction: 427500 },
  { min: 6950000, max: 9000000, rate: 0.23, deduction: 636000 },
  { min: 9000000, max: 18000000, rate: 0.33, deduction: 1536000 },
  { min: 18000000, max: 40000000, rate: 0.40, deduction: 2796000 },
  { min: 40000000, max: Infinity, rate: 0.45, deduction: 4796000 },
];

// 標準報酬月額テーブル（簡略版）
const STANDARD_MONTHLY_REMUNERATION = [
  { min: 0, max: 63000, healthRate: 0.0495, pensionRate: 0.0915 },
  { min: 63000, max: 73000, healthRate: 0.0495, pensionRate: 0.0915 },
  { min: 73000, max: 83000, healthRate: 0.0495, pensionRate: 0.0915 },
  { min: 83000, max: 93000, healthRate: 0.0495, pensionRate: 0.0915 },
  { min: 93000, max: 101000, healthRate: 0.0495, pensionRate: 0.0915 },
  // ... 実際はもっと細かいテーブル
  { min: 605000, max: 635000, healthRate: 0.0495, pensionRate: 0.0915 },
  { min: 635000, max: Infinity, healthRate: 0.0495, pensionRate: 0.0915 },
];

export class PayrollCalculator {
  /**
   * 給与明細の計算
   */
  static calculatePaySlip(
    master: SalaryMaster,
    params: PayrollCalculationParams,
    employeeInfo: {
      name: string;
      department: string;
      position: string;
    }
  ): PaySlip {
    // 基本給の計算
    const basicSalary = this.calculateBasicSalary(master, params);

    // 残業手当の計算
    const overtimeAllowance = this.calculateOvertimeAllowance(
      master,
      params.overtimeHours,
      params.lateNightHours,
      params.holidayWorkHours
    );

    // 欠勤控除の計算
    const absenceDeduction = this.calculateAbsenceDeduction(
      master,
      params.absenceDays
    );

    // 総支給額の計算
    const earnings = {
      basicSalary: basicSalary - absenceDeduction,
      positionAllowance: master.fixedAllowances.positionAllowance,
      overtimeAllowance,
      commuteAllowance: master.fixedAllowances.commuteAllowance,
      housingAllowance: master.fixedAllowances.housingAllowance,
      familyAllowance: master.fixedAllowances.familyAllowance,
      qualificationAllowance: master.fixedAllowances.qualificationAllowance,
      otherAllowance: 0,
    };

    const grossPay = Object.values(earnings).reduce((sum, val) => sum + val, 0);

    // 社会保険料の計算
    const socialInsurance = this.calculateSocialInsurance(grossPay);

    // 所得税の計算
    const incomeTax = this.calculateIncomeTax(
      grossPay - socialInsurance.total
    );

    // 住民税（仮：前年の所得に基づくため固定値）
    const residentTax = Math.floor(grossPay * 0.1 / 12); // 簡易計算

    // 控除項目
    const deductions = {
      healthInsurance: socialInsurance.health,
      pensionInsurance: socialInsurance.pension,
      employmentInsurance: socialInsurance.employment,
      incomeTax,
      residentTax,
      otherDeductions: 0,
    };

    const totalDeductions = Object.values(deductions).reduce(
      (sum, val) => sum + val,
      0
    );

    // 差引支給額
    const netPay = grossPay - totalDeductions;

    return {
      id: `payslip-${params.employeeId}-${params.period}`,
      employeeId: params.employeeId,
      employeeName: employeeInfo.name,
      department: employeeInfo.department,
      position: employeeInfo.position,
      payPeriod: params.period,
      paymentDate: this.getPaymentDate(params.period),
      earnings,
      deductions,
      attendance: {
        workingDays: params.workingDays,
        actualWorkingDays: params.workingDays - params.absenceDays,
        absenceDays: params.absenceDays,
        paidLeaveDays: params.paidLeaveDays,
        overtimeHours: params.overtimeHours,
        lateNightHours: params.lateNightHours,
        holidayWorkHours: params.holidayWorkHours,
      },
      grossPay,
      totalDeductions,
      netPay,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 基本給の計算
   */
  private static calculateBasicSalary(
    master: SalaryMaster,
    params: PayrollCalculationParams
  ): number {
    if (master.paymentType === 'monthly') {
      return master.basicSalary;
    } else if (master.paymentType === 'daily') {
      return (master.dailyRate || 0) * params.workingDays;
    } else if (master.paymentType === 'hourly') {
      return (master.hourlyRate || 0) * params.workingDays * 8; // 1日8時間想定
    }
    return 0;
  }

  /**
   * 残業手当の計算
   */
  private static calculateOvertimeAllowance(
    master: SalaryMaster,
    overtimeHours: number,
    lateNightHours: number,
    holidayWorkHours: number
  ): number {
    const hourlyRate = this.getHourlyRate(master);

    const regular = hourlyRate * overtimeHours * (master.overtimeRates?.regular || 1.25);
    const lateNight = hourlyRate * lateNightHours * (master.overtimeRates?.lateNight || 1.5);
    const holiday = hourlyRate * holidayWorkHours * (master.overtimeRates?.holiday || 1.35);

    return Math.floor(regular + lateNight + holiday);
  }

  /**
   * 時給換算
   */
  private static getHourlyRate(master: SalaryMaster): number {
    if (master.paymentType === 'hourly') {
      return master.hourlyRate || 0;
    } else if (master.paymentType === 'daily') {
      return (master.dailyRate || 0) / 8; // 1日8時間想定
    } else {
      // 月給の場合: 月給 / (月平均労働日数 * 8時間)
      return master.basicSalary / (21 * 8); // 月21日勤務想定
    }
  }

  /**
   * 欠勤控除の計算
   */
  private static calculateAbsenceDeduction(
    master: SalaryMaster,
    absenceDays: number
  ): number {
    if (absenceDays === 0) return 0;

    if (master.paymentType === 'monthly') {
      const dailyRate = master.basicSalary / 21; // 月21日勤務想定
      return Math.floor(dailyRate * absenceDays);
    }
    return 0;
  }

  /**
   * 社会保険料の計算
   */
  private static calculateSocialInsurance(grossPay: number): {
    health: number;
    pension: number;
    employment: number;
    total: number;
  } {
    // 標準報酬月額を取得
    const range = STANDARD_MONTHLY_REMUNERATION.find(
      (r) => grossPay >= r.min && grossPay < r.max
    ) || STANDARD_MONTHLY_REMUNERATION[STANDARD_MONTHLY_REMUNERATION.length - 1];

    const health = Math.floor(grossPay * range.healthRate);
    const pension = Math.floor(grossPay * range.pensionRate);
    const employment = Math.floor(grossPay * 0.003); // 雇用保険料率 0.3%

    return {
      health,
      pension,
      employment,
      total: health + pension + employment,
    };
  }

  /**
   * 所得税の計算（源泉徴収）
   */
  private static calculateIncomeTax(taxableIncome: number): number {
    // 月額表を使った簡易計算
    const annualIncome = taxableIncome * 12;

    // 基礎控除
    const basicDeduction = 480000;
    const taxableAnnual = Math.max(0, annualIncome - basicDeduction);

    // 税率テーブルから計算
    const bracket = INCOME_TAX_RATES.find(
      (r) => taxableAnnual >= r.min && taxableAnnual < r.max
    );

    if (!bracket) return 0;

    const annualTax = taxableAnnual * bracket.rate - bracket.deduction;
    const monthlyTax = Math.floor(annualTax / 12);

    return Math.max(0, monthlyTax);
  }

  /**
   * 支給日の取得（25日締め、翌月10日払い）
   */
  private static getPaymentDate(period: string): string {
    const [year, month] = period.split('-').map(Number);
    const paymentDate = new Date(year, month, 10); // 翌月10日
    return paymentDate.toISOString().split('T')[0];
  }

  /**
   * 賞与の計算
   */
  static calculateBonus(
    basicSalary: number,
    performanceRate: number,
    months: number = 2, // 基本は2ヶ月分
    specialAmount: number = 0
  ): {
    baseAmount: number;
    performanceAmount: number;
    grossAmount: number;
    deductions: {
      healthInsurance: number;
      pensionInsurance: number;
      employmentInsurance: number;
      incomeTax: number;
    };
    netAmount: number;
  } {
    const baseAmount = basicSalary * months;
    const performanceAmount = Math.floor(baseAmount * (performanceRate / 100));
    const grossAmount = baseAmount + performanceAmount + specialAmount;

    // 賞与の社会保険料（料率は給与と同じ）
    const socialInsurance = this.calculateSocialInsurance(grossAmount);

    // 賞与の所得税（賞与の源泉徴収税率：簡易計算）
    const incomeTax = Math.floor(grossAmount * 0.04); // 4.084%

    const deductions = {
      healthInsurance: socialInsurance.health,
      pensionInsurance: socialInsurance.pension,
      employmentInsurance: socialInsurance.employment,
      incomeTax,
    };

    const totalDeductions = Object.values(deductions).reduce(
      (sum, val) => sum + val,
      0
    );

    return {
      baseAmount,
      performanceAmount,
      grossAmount,
      deductions,
      netAmount: grossAmount - totalDeductions,
    };
  }
}