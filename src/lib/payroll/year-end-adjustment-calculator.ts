/**
 * 年末調整計算エンジン
 * 各種控除額の計算と年末調整の実行
 */

import {
  LifeInsuranceDeduction,
  EarthquakeInsuranceDeduction,
  MortgageDeduction,
  SpouseDeduction,
  DependentDeduction,
  DisabilityDeduction,
  SmallBusinessMutualAidDeduction,
  YearEndAdjustmentDeductions,
  YearEndAdjustmentResult,
} from './year-end-adjustment-types';
import { calculateReconstructionTax } from './income-tax-calculator';

/**
 * 生命保険料控除額の計算（新制度）
 * 令和4年以降
 */
export function calculateLifeInsuranceDeduction(
  lifeInsurance: LifeInsuranceDeduction
): number {
  const calculateSingleDeduction = (amount: number): number => {
    if (amount <= 20000) return amount;
    if (amount <= 40000) return Math.floor(amount * 0.5 + 10000);
    if (amount <= 80000) return Math.floor(amount * 0.25 + 20000);
    return 40000; // 上限4万円
  };

  const general = calculateSingleDeduction(lifeInsurance.generalInsurance);
  const medical = calculateSingleDeduction(lifeInsurance.medicalInsurance);
  const pension = calculateSingleDeduction(lifeInsurance.pensionInsurance);

  // 合計最大12万円
  return Math.min(general + medical + pension, 120000);
}

/**
 * 地震保険料控除額の計算
 */
export function calculateEarthquakeInsuranceDeduction(
  earthquakeInsurance: EarthquakeInsuranceDeduction
): number {
  // 地震保険料（最大5万円控除）
  const earthquakeDed = Math.min(earthquakeInsurance.earthquakeInsurance, 50000);

  // 旧長期損害保険料（最大1.5万円控除）
  let longTermDed = 0;
  const longTerm = earthquakeInsurance.longTermDamageInsurance;
  if (longTerm <= 10000) {
    longTermDed = longTerm;
  } else if (longTerm <= 20000) {
    longTermDed = Math.floor(longTerm * 0.5 + 5000);
  } else {
    longTermDed = 15000;
  }

  // 合計最大5万円
  return Math.min(earthquakeDed + longTermDed, 50000);
}

/**
 * 住宅借入金等特別控除額の計算
 */
export function calculateMortgageDeduction(
  mortgage: MortgageDeduction | undefined,
  annualIncomeTax: number
): number {
  if (!mortgage) return 0;

  const deduction = Math.floor(mortgage.loanBalance * mortgage.deductionRate);
  const limited = Math.min(deduction, mortgage.maxDeduction);

  // 所得税額を超える控除はできない
  return Math.min(limited, annualIncomeTax);
}

/**
 * 配偶者控除・配偶者特別控除額の計算
 * 納税者本人の所得が1000万円以下の場合のみ適用
 */
export function calculateSpouseDeduction(
  spouse: SpouseDeduction,
  taxpayerIncome: number
): number {
  if (!spouse.hasSpouse) return 0;
  if (taxpayerIncome > 10000000) return 0;

  const spouseIncome = spouse.spouseIncome;

  // 配偶者控除（配偶者の所得48万円以下）
  if (spouseIncome <= 480000) {
    // 70歳以上の場合は老人控除対象配偶者
    if (spouse.spouseAge >= 70) {
      return 480000; // 老人控除対象配偶者（通常は480,000円）
    }
    return 380000; // 一般の控除対象配偶者
  }

  // 配偶者特別控除（配偶者の所得48万円超133万円以下）
  if (spouseIncome <= 1330000) {
    // 簡易計算（実際は納税者の所得に応じて段階的に減少）
    if (spouseIncome <= 950000) return 380000;
    if (spouseIncome <= 1000000) return 360000;
    if (spouseIncome <= 1050000) return 310000;
    if (spouseIncome <= 1100000) return 260000;
    if (spouseIncome <= 1150000) return 210000;
    if (spouseIncome <= 1200000) return 160000;
    if (spouseIncome <= 1250000) return 110000;
    if (spouseIncome <= 1300000) return 60000;
    return 30000;
  }

  return 0;
}

/**
 * 扶養控除額の計算
 */
export function calculateDependentDeduction(dependent: DependentDeduction): number {
  let total = 0;

  // 一般扶養親族（38万円）
  total += dependent.general * 380000;

  // 特定扶養親族（63万円）
  total += dependent.specific * 630000;

  // 老人扶養親族（48万円）
  total += dependent.elderly * 480000;

  // 同居老親等（58万円）
  total += dependent.elderlyLivingTogether * 580000;

  return total;
}

/**
 * 障害者控除額の計算
 */
export function calculateDisabilityDeduction(disability: DisabilityDeduction): number {
  let total = 0;

  // 一般障害者（27万円）
  total += disability.general * 270000;

  // 特別障害者（40万円）
  total += disability.special * 400000;

  // 同居特別障害者（75万円）
  total += disability.specialLivingTogether * 750000;

  return total;
}

/**
 * 社会保険料控除額の計算
 */
export function calculateSocialInsuranceDeduction(
  socialInsurance: { healthInsurance: number; pension: number; employmentInsurance: number; nationalPension: number; other: number }
): number {
  return (
    socialInsurance.healthInsurance +
    socialInsurance.pension +
    socialInsurance.employmentInsurance +
    socialInsurance.nationalPension +
    socialInsurance.other
  );
}

/**
 * 小規模企業共済等掛金控除額の計算
 */
export function calculateSmallBusinessMutualAidDeduction(
  mutualAid: SmallBusinessMutualAidDeduction
): number {
  return mutualAid.ideco + mutualAid.mutualAid;
}

/**
 * 基礎控除額の計算（令和2年以降）
 * 所得2400万円以下: 48万円
 * 所得2400万円超2450万円以下: 32万円
 * 所得2450万円超2500万円以下: 16万円
 * 所得2500万円超: 0円
 */
export function calculateBasicDeduction(income: number): number {
  if (income <= 24000000) return 480000;
  if (income <= 24500000) return 320000;
  if (income <= 25000000) return 160000;
  return 0;
}

/**
 * 給与所得控除額の計算（令和2年以降）
 */
export function calculateEmploymentIncomeDeduction(annualIncome: number): number {
  if (annualIncome <= 1625000) return 550000;
  if (annualIncome <= 1800000) return Math.floor(annualIncome * 0.4 - 100000);
  if (annualIncome <= 3600000) return Math.floor(annualIncome * 0.3 + 80000);
  if (annualIncome <= 6600000) return Math.floor(annualIncome * 0.2 + 440000);
  if (annualIncome <= 8500000) return Math.floor(annualIncome * 0.1 + 1100000);
  return 1950000; // 上限195万円
}

/**
 * 年末調整の計算を実行
 */
export function calculateYearEndAdjustment(
  employeeId: string,
  employeeName: string,
  department: string,
  fiscalYear: number,
  totalAnnualIncome: number,
  withheldTaxTotal: number,
  deductions: YearEndAdjustmentDeductions
): YearEndAdjustmentResult {
  // 1. 給与所得控除
  const employmentIncomeDeduction = calculateEmploymentIncomeDeduction(totalAnnualIncome);
  const employmentIncome = totalAnnualIncome - employmentIncomeDeduction;

  // 2. 各種控除額の計算
  const basicDeduction = calculateBasicDeduction(employmentIncome);
  const spouseDeduction = calculateSpouseDeduction(deductions.spouse, employmentIncome);
  const dependentDeduction = calculateDependentDeduction(deductions.dependent);
  const disabilityDeduction = calculateDisabilityDeduction(deductions.disability);
  const socialInsuranceDeduction = calculateSocialInsuranceDeduction(deductions.socialInsurance);
  const lifeInsuranceDeduction = calculateLifeInsuranceDeduction(deductions.lifeInsurance);
  const earthquakeInsuranceDeduction = calculateEarthquakeInsuranceDeduction(deductions.earthquakeInsurance);
  const smallBusinessMutualAidDeduction = calculateSmallBusinessMutualAidDeduction(deductions.smallBusinessMutualAid);

  // その他控除（寡婦、ひとり親、勤労学生）
  const otherDeductions =
    deductions.other.widow + deductions.other.singleParent + deductions.other.workingStudent;

  // 控除合計
  const totalDeductionsAmount =
    basicDeduction +
    spouseDeduction +
    dependentDeduction +
    disabilityDeduction +
    socialInsuranceDeduction +
    lifeInsuranceDeduction +
    earthquakeInsuranceDeduction +
    smallBusinessMutualAidDeduction +
    otherDeductions;

  // 3. 課税所得金額
  const taxableIncome = Math.max(0, employmentIncome - totalDeductionsAmount);

  // 4. 所得税額の計算（累進課税）
  let baseTax = 0;
  if (taxableIncome <= 1950000) {
    baseTax = Math.floor(taxableIncome * 0.05);
  } else if (taxableIncome <= 3300000) {
    baseTax = Math.floor(taxableIncome * 0.1 - 97500);
  } else if (taxableIncome <= 6950000) {
    baseTax = Math.floor(taxableIncome * 0.2 - 427500);
  } else if (taxableIncome <= 9000000) {
    baseTax = Math.floor(taxableIncome * 0.23 - 636000);
  } else if (taxableIncome <= 18000000) {
    baseTax = Math.floor(taxableIncome * 0.33 - 1536000);
  } else if (taxableIncome <= 40000000) {
    baseTax = Math.floor(taxableIncome * 0.4 - 2796000);
  } else {
    baseTax = Math.floor(taxableIncome * 0.45 - 4796000);
  }

  // 復興特別所得税
  const reconstructionTax = calculateReconstructionTax(baseTax);
  let annualIncomeTax = baseTax + reconstructionTax;

  // 5. 住宅借入金等特別控除
  const mortgageDeduction = calculateMortgageDeduction(deductions.mortgage, annualIncomeTax);
  annualIncomeTax = Math.max(0, annualIncomeTax - mortgageDeduction);

  // 6. 年末調整による過不足額
  const yearEndAdjustmentAmount = withheldTaxTotal - annualIncomeTax;
  const isRefund = yearEndAdjustmentAmount > 0;

  const result: YearEndAdjustmentResult = {
    id: `${employeeId}-${fiscalYear}`,
    employeeId,
    employeeName,
    department,
    fiscalYear,

    // 収入金額
    totalAnnualIncome,
    employmentIncomeDeduction,
    employmentIncome,

    // 各種控除
    basicDeduction,
    spouseDeduction,
    dependentDeduction,
    disabilityDeduction,
    socialInsuranceDeduction,
    lifeInsuranceDeduction,
    earthquakeInsuranceDeduction,
    smallBusinessMutualAidDeduction,
    otherDeductions,
    totalDeductions: totalDeductionsAmount,

    // 課税所得・税額
    taxableIncome,
    annualIncomeTax,
    withheldTaxTotal,
    mortgageDeduction,

    // 還付・徴収
    yearEndAdjustmentAmount,
    isRefund,

    // 計算日時
    calculatedAt: new Date().toISOString(),

    // ステータス
    status: 'draft',
  };

  return result;
}
