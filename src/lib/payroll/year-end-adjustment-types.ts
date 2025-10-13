/**
 * 年末調整機能用の型定義
 */

/**
 * 生命保険料控除
 */
export interface LifeInsuranceDeduction {
  // 一般生命保険料
  generalInsurance: number;
  // 介護医療保険料
  medicalInsurance: number;
  // 個人年金保険料
  pensionInsurance: number;
}

/**
 * 地震保険料控除
 */
export interface EarthquakeInsuranceDeduction {
  // 地震保険料
  earthquakeInsurance: number;
  // 旧長期損害保険料
  longTermDamageInsurance: number;
}

/**
 * 住宅借入金等特別控除
 */
export interface MortgageDeduction {
  // 住宅ローン年末残高
  loanBalance: number;
  // 控除率（通常1%）
  deductionRate: number;
  // 控除限度額
  maxDeduction: number;
}

/**
 * 配偶者控除・配偶者特別控除
 */
export interface SpouseDeduction {
  // 配偶者の有無
  hasSpouse: boolean;
  // 配偶者の年間所得
  spouseIncome: number;
  // 配偶者の年齢（70歳以上で控除額増加）
  spouseAge: number;
}

/**
 * 扶養控除
 */
export interface DependentDeduction {
  // 一般扶養親族（16歳以上19歳未満、23歳以上70歳未満）
  general: number;
  // 特定扶養親族（19歳以上23歳未満）
  specific: number;
  // 老人扶養親族（70歳以上）
  elderly: number;
  // 同居老親等（70歳以上で同居）
  elderlyLivingTogether: number;
}

/**
 * 障害者控除
 */
export interface DisabilityDeduction {
  // 一般障害者
  general: number;
  // 特別障害者
  special: number;
  // 同居特別障害者
  specialLivingTogether: number;
}

/**
 * 社会保険料控除
 */
export interface SocialInsuranceDeduction {
  // 健康保険料
  healthInsurance: number;
  // 厚生年金保険料
  pension: number;
  // 雇用保険料
  employmentInsurance: number;
  // 国民年金保険料（自己負担分）
  nationalPension: number;
  // その他社会保険料
  other: number;
}

/**
 * 小規模企業共済等掛金控除
 */
export interface SmallBusinessMutualAidDeduction {
  // iDeCo掛金
  ideco: number;
  // 小規模企業共済掛金
  mutualAid: number;
}

/**
 * その他控除
 */
export interface OtherDeductions {
  // 寡婦控除
  widow: number;
  // ひとり親控除
  singleParent: number;
  // 勤労学生控除
  workingStudent: number;
}

/**
 * 年末調整控除項目（全体）
 */
export interface YearEndAdjustmentDeductions {
  // 生命保険料控除
  lifeInsurance: LifeInsuranceDeduction;
  // 地震保険料控除
  earthquakeInsurance: EarthquakeInsuranceDeduction;
  // 住宅借入金等特別控除
  mortgage?: MortgageDeduction;
  // 配偶者控除・配偶者特別控除
  spouse: SpouseDeduction;
  // 扶養控除
  dependent: DependentDeduction;
  // 障害者控除
  disability: DisabilityDeduction;
  // 社会保険料控除
  socialInsurance: SocialInsuranceDeduction;
  // 小規模企業共済等掛金控除
  smallBusinessMutualAid: SmallBusinessMutualAidDeduction;
  // その他控除
  other: OtherDeductions;
}

/**
 * 年末調整計算結果
 */
export interface YearEndAdjustmentResult {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  fiscalYear: number; // 年度（例：2024）

  // 収入金額
  totalAnnualIncome: number; // 年間総収入
  employmentIncomeDeduction: number; // 給与所得控除
  employmentIncome: number; // 給与所得金額

  // 各種控除
  basicDeduction: number; // 基礎控除
  spouseDeduction: number; // 配偶者控除・配偶者特別控除
  dependentDeduction: number; // 扶養控除
  disabilityDeduction: number; // 障害者控除
  socialInsuranceDeduction: number; // 社会保険料控除
  lifeInsuranceDeduction: number; // 生命保険料控除
  earthquakeInsuranceDeduction: number; // 地震保険料控除
  smallBusinessMutualAidDeduction: number; // 小規模企業共済等掛金控除
  otherDeductions: number; // その他控除
  totalDeductions: number; // 控除合計

  // 課税所得・税額
  taxableIncome: number; // 課税所得金額
  annualIncomeTax: number; // 年調年税額（所得税+復興特別所得税）
  withheldTaxTotal: number; // 年間源泉徴収税額合計
  mortgageDeduction: number; // 住宅借入金等特別控除額

  // 還付・徴収
  yearEndAdjustmentAmount: number; // 年末調整による過不足額（正=還付、負=徴収）
  isRefund: boolean; // 還付かどうか

  // 計算日時
  calculatedAt: string;
  approvedAt?: string;

  // ステータス
  status: 'draft' | 'submitted' | 'approved' | 'completed';
}

/**
 * 年末調整申告データ
 */
export interface YearEndAdjustmentDeclaration {
  id: string;
  employeeId: string;
  fiscalYear: number;
  deductions: YearEndAdjustmentDeductions;
  submittedAt?: string;
  status: 'draft' | 'submitted' | 'approved';
}

/**
 * 源泉徴収票データ（年末調整用）
 */
export interface WithholdingSlipData {
  // 従業員情報
  employeeId: string;
  employeeName: string;
  address: string;
  department: string;
  position: string;

  // 支払者（会社）情報
  payerName: string;
  payerAddress: string;
  payerTaxId: string; // 法人番号

  // 年度
  fiscalYear: number;

  // 収入金額
  totalIncome: number; // 支払金額
  employmentIncome: number; // 給与所得控除後の金額

  // 所得控除の額の合計額
  totalDeductions: number;

  // 源泉徴収税額
  withheldTax: number;

  // 控除対象配偶者の有無等
  spouseDeduction: number;
  dependents: number; // 扶養親族の数

  // 社会保険料等の金額
  socialInsuranceTotal: number;

  // 生命保険料の控除額
  lifeInsuranceDeduction: number;

  // 地震保険料の控除額
  earthquakeInsuranceDeduction: number;

  // 住宅借入金等特別控除の額
  mortgageDeduction: number;

  // 発行日
  issuedAt: string;
}
