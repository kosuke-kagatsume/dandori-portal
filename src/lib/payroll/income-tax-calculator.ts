/**
 * 所得税計算エンジン
 * 国税庁の源泉徴収税額表に基づく正確な所得税計算
 */

import {
  MONTHLY_TAX_TABLE_KOU,
  BONUS_TAX_RATE_TABLE,
  RECONSTRUCTION_TAX_RATE,
} from './withholding-tax-tables';

/**
 * 月額給与に対する所得税計算（甲欄）
 *
 * @param taxableIncome - 社会保険料等控除後の給与額
 * @param dependents - 扶養親族等の数（0〜7人以上）
 * @returns 源泉徴収税額（所得税 + 復興特別所得税）
 *
 * @example
 * ```typescript
 * // 社会保険料控除後25万円、扶養1人の場合
 * const tax = calculateMonthlyIncomeTax(250000, 1);
 * console.log(tax); // 4084円
 * ```
 */
export function calculateMonthlyIncomeTax(
  taxableIncome: number,
  dependents: number = 0
): number {
  // 扶養人数を0〜7の範囲に制限
  const dependentIndex = Math.min(Math.max(dependents, 0), 7);

  // 該当する税額を検索
  let baseTax = 0;

  for (let i = 0; i < MONTHLY_TAX_TABLE_KOU.length; i++) {
    const row = MONTHLY_TAX_TABLE_KOU[i];

    if (taxableIncome >= row.min && taxableIncome < row.max) {
      baseTax = row.rates[dependentIndex];
      break;
    }

    // 最高額を超える場合の計算
    if (i === MONTHLY_TAX_TABLE_KOU.length - 1 && taxableIncome >= row.min) {
      // 120万円を超える場合：1000円増すごとに一定額を加算
      const excess = taxableIncome - row.min;
      const incrementPer1000 = [260, 247, 234, 221, 208, 195, 182, 169][dependentIndex];
      const additionalTax = Math.floor(excess / 1000) * incrementPer1000;
      baseTax = row.rates[dependentIndex] + additionalTax;
      break;
    }
  }

  // 復興特別所得税を加算（基準所得税額の2.1%）
  const reconstructionTax = Math.floor(baseTax * RECONSTRUCTION_TAX_RATE);
  const totalTax = baseTax + reconstructionTax;

  return totalTax;
}

/**
 * 賞与に対する所得税計算
 *
 * @param bonusAmount - 賞与額（社会保険料控除後）
 * @param previousMonthSalary - 前月給与（社会保険料控除後）
 * @param dependents - 扶養親族等の数（0〜7人以上）
 * @returns 源泉徴収税額（所得税 + 復興特別所得税）
 *
 * @example
 * ```typescript
 * // 賞与50万円、前月給与30万円、扶養1人の場合
 * const tax = calculateBonusIncomeTax(500000, 300000, 1);
 * console.log(tax); // 40840円（8.168%）
 * ```
 */
export function calculateBonusIncomeTax(
  bonusAmount: number,
  previousMonthSalary: number,
  dependents: number = 0
): number {
  // 扶養人数を0〜7の範囲に制限
  const dependentIndex = Math.min(Math.max(dependents, 0), 7);

  // 税率を検索
  let taxRate = 0;

  for (let i = 0; i < BONUS_TAX_RATE_TABLE.length; i++) {
    const row = BONUS_TAX_RATE_TABLE[i];

    if (previousMonthSalary >= row.min && previousMonthSalary < row.max) {
      taxRate = row.rates[dependentIndex];
      break;
    }

    // 最高額を超える場合
    if (i === BONUS_TAX_RATE_TABLE.length - 1 && previousMonthSalary >= row.min) {
      taxRate = row.rates[dependentIndex];
      break;
    }
  }

  // 賞与の所得税を計算（パーセンテージなので100で割る）
  const baseTax = Math.floor(bonusAmount * (taxRate / 100));

  // 復興特別所得税を加算（基準所得税額の2.1%）
  const reconstructionTax = Math.floor(baseTax * RECONSTRUCTION_TAX_RATE);
  const totalTax = baseTax + reconstructionTax;

  return totalTax;
}

/**
 * 復興特別所得税額の計算
 *
 * @param baseTax - 基準所得税額
 * @returns 復興特別所得税額
 */
export function calculateReconstructionTax(baseTax: number): number {
  return Math.floor(baseTax * RECONSTRUCTION_TAX_RATE);
}

/**
 * 年間所得税の計算（年末調整用）
 *
 * @param annualIncome - 年間総収入
 * @param socialInsurance - 年間社会保険料
 * @param dependents - 扶養親族等の数
 * @param otherDeductions - その他控除額（生命保険、地震保険、住宅ローンなど）
 * @returns 年税額
 */
export function calculateAnnualIncomeTax(
  annualIncome: number,
  socialInsurance: number,
  dependents: number = 0,
  otherDeductions: number = 0
): number {
  // 給与所得控除の計算（令和2年以降）
  let employmentIncomeDeduction = 0;
  if (annualIncome <= 1625000) {
    employmentIncomeDeduction = 550000;
  } else if (annualIncome <= 1800000) {
    employmentIncomeDeduction = Math.floor(annualIncome * 0.4 - 100000);
  } else if (annualIncome <= 3600000) {
    employmentIncomeDeduction = Math.floor(annualIncome * 0.3 + 80000);
  } else if (annualIncome <= 6600000) {
    employmentIncomeDeduction = Math.floor(annualIncome * 0.2 + 440000);
  } else if (annualIncome <= 8500000) {
    employmentIncomeDeduction = Math.floor(annualIncome * 0.1 + 1100000);
  } else {
    employmentIncomeDeduction = 1950000;
  }

  // 給与所得金額
  const employmentIncome = annualIncome - employmentIncomeDeduction;

  // 基礎控除（令和2年以降、所得2400万円以下の場合48万円）
  const basicDeduction = employmentIncome <= 24000000 ? 480000 : 0;

  // 扶養控除（一般扶養親族：38万円/人）
  const dependentDeduction = dependents * 380000;

  // 課税所得金額
  const taxableIncome = Math.max(
    0,
    employmentIncome - socialInsurance - basicDeduction - dependentDeduction - otherDeductions
  );

  // 所得税の計算（累進課税）
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

  // 復興特別所得税を加算
  const reconstructionTax = calculateReconstructionTax(baseTax);
  const totalTax = baseTax + reconstructionTax;

  return totalTax;
}

/**
 * 年末調整による還付金/徴収税額の計算
 *
 * @param withheldTaxTotal - 年間源泉徴収税額の合計
 * @param annualTax - 年税額
 * @returns 還付金額（正の値）または追徴税額（負の値）
 */
export function calculateYearEndAdjustment(
  withheldTaxTotal: number,
  annualTax: number
): {
  difference: number;
  isRefund: boolean;
  amount: number;
} {
  const difference = withheldTaxTotal - annualTax;
  const isRefund = difference > 0;
  const amount = Math.abs(difference);

  return {
    difference,
    isRefund,
    amount,
  };
}
