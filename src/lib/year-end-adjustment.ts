/**
 * 年末調整計算ロジック
 */

export interface YearEndAdjustmentParams {
  employeeId: string;
  year: number;

  // 年間収入
  annualGrossPay: number;
  annualBonuses: number;

  // 源泉徴収済み税額
  withheldIncomeTax: number;

  // 控除項目
  deductions: {
    // 基礎控除
    basicDeduction: number; // 48万円

    // 配偶者控除
    spouseDeduction: number;
    spouseSpecialDeduction: number;

    // 扶養控除
    dependentDeduction: number;
    dependentCount: number;

    // 保険料控除
    lifeInsuranceDeduction: number;
    earthquakeInsuranceDeduction: number;
    socialInsuranceDeduction: number;

    // 住宅ローン控除
    housingLoanDeduction: number;

    // 医療費控除
    medicalExpenseDeduction: number;

    // その他の控除
    otherDeductions: number;
  };
}

export interface YearEndAdjustmentResult {
  employeeId: string;
  year: number;

  // 年間総収入
  totalIncome: number;

  // 給与所得控除後の金額
  employmentIncomeDeduction: number;
  incomeAfterEmploymentDeduction: number;

  // 所得控除の合計
  totalDeductions: number;

  // 課税所得金額
  taxableIncome: number;

  // 年税額
  annualTaxAmount: number;

  // 調整額（還付 or 追徴）
  adjustmentAmount: number;
  isRefund: boolean;

  // 詳細
  details: {
    calculatedTax: number;
    withheldTax: number;
    difference: number;
  };
}

export class YearEndAdjustmentCalculator {

  // 給与所得控除額の計算テーブル（2025年）
  private static EMPLOYMENT_INCOME_DEDUCTION_TABLE = [
    { min: 0, max: 1625000, calc: (income: number) => 550000 },
    { min: 1625000, max: 1800000, calc: (income: number) => income * 0.4 - 100000 },
    { min: 1800000, max: 3600000, calc: (income: number) => income * 0.3 + 80000 },
    { min: 3600000, max: 6600000, calc: (income: number) => income * 0.2 + 440000 },
    { min: 6600000, max: 8500000, calc: (income: number) => income * 0.1 + 1100000 },
    { min: 8500000, max: Infinity, calc: (income: number) => 1950000 },
  ];

  // 所得税率テーブル（2025年）
  private static TAX_RATE_TABLE = [
    { min: 0, max: 1950000, rate: 0.05, deduction: 0 },
    { min: 1950000, max: 3300000, rate: 0.10, deduction: 97500 },
    { min: 3300000, max: 6950000, rate: 0.20, deduction: 427500 },
    { min: 6950000, max: 9000000, rate: 0.23, deduction: 636000 },
    { min: 9000000, max: 18000000, rate: 0.33, deduction: 1536000 },
    { min: 18000000, max: 40000000, rate: 0.40, deduction: 2796000 },
    { min: 40000000, max: Infinity, rate: 0.45, deduction: 4796000 },
  ];

  /**
   * 年末調整の計算
   */
  static calculate(params: YearEndAdjustmentParams): YearEndAdjustmentResult {
    // 1. 年間総収入の計算
    const totalIncome = params.annualGrossPay + params.annualBonuses;

    // 2. 給与所得控除額の計算
    const employmentIncomeDeduction = this.calculateEmploymentIncomeDeduction(totalIncome);
    const incomeAfterEmploymentDeduction = totalIncome - employmentIncomeDeduction;

    // 3. 所得控除の合計計算
    const totalDeductions = this.calculateTotalDeductions(params.deductions);

    // 4. 課税所得金額の計算
    const taxableIncome = Math.max(0, incomeAfterEmploymentDeduction - totalDeductions);

    // 5. 年税額の計算
    const annualTaxAmount = this.calculateAnnualTax(taxableIncome);

    // 6. 住宅ローン控除の適用
    const finalTaxAmount = Math.max(0, annualTaxAmount - params.deductions.housingLoanDeduction);

    // 7. 調整額の計算（還付 or 追徴）
    const adjustmentAmount = params.withheldIncomeTax - finalTaxAmount;

    return {
      employeeId: params.employeeId,
      year: params.year,
      totalIncome,
      employmentIncomeDeduction,
      incomeAfterEmploymentDeduction,
      totalDeductions,
      taxableIncome,
      annualTaxAmount: finalTaxAmount,
      adjustmentAmount: Math.abs(adjustmentAmount),
      isRefund: adjustmentAmount > 0,
      details: {
        calculatedTax: finalTaxAmount,
        withheldTax: params.withheldIncomeTax,
        difference: adjustmentAmount,
      },
    };
  }

  /**
   * 給与所得控除額の計算
   */
  private static calculateEmploymentIncomeDeduction(income: number): number {
    const bracket = this.EMPLOYMENT_INCOME_DEDUCTION_TABLE.find(
      (b) => income >= b.min && income < b.max
    );

    if (!bracket) {
      return this.EMPLOYMENT_INCOME_DEDUCTION_TABLE[
        this.EMPLOYMENT_INCOME_DEDUCTION_TABLE.length - 1
      ].calc(income);
    }

    return Math.floor(bracket.calc(income));
  }

  /**
   * 所得控除の合計計算
   */
  private static calculateTotalDeductions(deductions: YearEndAdjustmentParams['deductions']): number {
    return (
      deductions.basicDeduction +
      deductions.spouseDeduction +
      deductions.spouseSpecialDeduction +
      deductions.dependentDeduction +
      Math.min(deductions.lifeInsuranceDeduction, 120000) + // 生命保険料控除上限12万円
      Math.min(deductions.earthquakeInsuranceDeduction, 50000) + // 地震保険料控除上限5万円
      deductions.socialInsuranceDeduction +
      Math.min(deductions.medicalExpenseDeduction, 2000000) + // 医療費控除上限200万円
      deductions.otherDeductions
    );
  }

  /**
   * 年税額の計算
   */
  private static calculateAnnualTax(taxableIncome: number): number {
    const bracket = this.TAX_RATE_TABLE.find(
      (b) => taxableIncome >= b.min && taxableIncome < b.max
    );

    if (!bracket) {
      const lastBracket = this.TAX_RATE_TABLE[this.TAX_RATE_TABLE.length - 1];
      return Math.floor(taxableIncome * lastBracket.rate - lastBracket.deduction);
    }

    return Math.floor(taxableIncome * bracket.rate - bracket.deduction);
  }

  /**
   * 扶養控除額の計算
   */
  static calculateDependentDeduction(dependents: {
    general: number;      // 一般扶養親族（16歳以上）
    specified: number;     // 特定扶養親族（19-22歳）
    elderly: number;       // 老人扶養親族（70歳以上）
    elderlyLiving: number; // 同居老親等
  }): number {
    return (
      dependents.general * 380000 +
      dependents.specified * 630000 +
      dependents.elderly * 480000 +
      dependents.elderlyLiving * 580000
    );
  }

  /**
   * 配偶者控除・配偶者特別控除の計算
   */
  static calculateSpouseDeduction(
    employeeIncome: number,
    spouseIncome: number
  ): {
    spouseDeduction: number;
    spouseSpecialDeduction: number;
  } {
    // 本人の所得制限チェック（1000万円超は控除なし）
    if (employeeIncome > 10000000) {
      return { spouseDeduction: 0, spouseSpecialDeduction: 0 };
    }

    // 配偶者控除（配偶者の所得48万円以下）
    if (spouseIncome <= 480000) {
      let deduction = 380000;

      // 本人の所得による控除額の調整
      if (employeeIncome > 9000000) {
        deduction = 130000;
      } else if (employeeIncome > 9500000) {
        deduction = 260000;
      }

      return { spouseDeduction: deduction, spouseSpecialDeduction: 0 };
    }

    // 配偶者特別控除（配偶者の所得48万円超133万円以下）
    if (spouseIncome <= 1330000) {
      let deduction = 0;

      // 配偶者の所得による控除額の決定
      if (spouseIncome <= 950000) {
        deduction = 380000;
      } else if (spouseIncome <= 1000000) {
        deduction = 360000;
      } else if (spouseIncome <= 1050000) {
        deduction = 310000;
      } else if (spouseIncome <= 1100000) {
        deduction = 260000;
      } else if (spouseIncome <= 1150000) {
        deduction = 210000;
      } else if (spouseIncome <= 1200000) {
        deduction = 160000;
      } else if (spouseIncome <= 1250000) {
        deduction = 110000;
      } else if (spouseIncome <= 1300000) {
        deduction = 60000;
      } else if (spouseIncome <= 1330000) {
        deduction = 30000;
      }

      // 本人の所得による控除額の調整
      if (employeeIncome > 9000000) {
        deduction = Math.floor(deduction * 0.33);
      } else if (employeeIncome > 9500000) {
        deduction = Math.floor(deduction * 0.67);
      }

      return { spouseDeduction: 0, spouseSpecialDeduction: deduction };
    }

    return { spouseDeduction: 0, spouseSpecialDeduction: 0 };
  }
}