/**
 * 給与計算関連の型定義
 */

// 給与明細
export interface PaySlip {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  payPeriod: string; // 2025-01 など
  paymentDate: string;

  // 支給項目
  earnings: {
    basicSalary: number;        // 基本給
    positionAllowance: number;  // 役職手当
    overtimeAllowance: number;  // 残業手当
    commuteAllowance: number;   // 通勤手当
    housingAllowance: number;   // 住宅手当
    familyAllowance: number;    // 家族手当
    qualificationAllowance: number; // 資格手当
    otherAllowance: number;     // その他手当
  };

  // 控除項目
  deductions: {
    healthInsurance: number;    // 健康保険料
    pensionInsurance: number;   // 厚生年金
    employmentInsurance: number; // 雇用保険
    incomeTax: number;          // 所得税
    residentTax: number;        // 住民税
    otherDeductions: number;    // その他控除
  };

  // 勤怠情報
  attendance: {
    workingDays: number;        // 勤務日数
    actualWorkingDays: number;  // 実働日数
    absenceDays: number;        // 欠勤日数
    paidLeaveDays: number;      // 有給消化日数
    overtimeHours: number;      // 残業時間
    lateNightHours: number;     // 深夜労働時間
    holidayWorkHours: number;   // 休日労働時間
  };

  // 集計
  grossPay: number;             // 総支給額
  totalDeductions: number;      // 総控除額
  netPay: number;               // 差引支給額（手取り）

  status: 'draft' | 'confirmed' | 'paid' | 'corrected';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 給与マスタ
export interface SalaryMaster {
  id: string;
  employeeId: string;
  effectiveFrom: string;        // 適用開始日
  effectiveTo?: string;         // 適用終了日

  // 基本情報
  basicSalary: number;          // 基本給
  paymentType: 'monthly' | 'daily' | 'hourly'; // 支給形態
  hourlyRate?: number;          // 時給（時給制の場合）
  dailyRate?: number;           // 日給（日給制の場合）

  // 固定手当
  fixedAllowances: {
    positionAllowance: number;   // 役職手当
    qualificationAllowance: number; // 資格手当
    housingAllowance: number;    // 住宅手当
    familyAllowance: number;     // 家族手当
    commuteAllowance: number;    // 通勤手当
  };

  // 控除設定
  deductionRates: {
    healthInsuranceRate: number; // 健康保険料率
    pensionInsuranceRate: number; // 厚生年金料率
    employmentInsuranceRate: number; // 雇用保険料率
  };

  // 残業計算設定
  overtimeRates: {
    regular: number;             // 通常残業倍率（1.25）
    lateNight: number;          // 深夜残業倍率（1.5）
    holiday: number;            // 休日残業倍率（1.35）
  };

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 賞与
export interface Bonus {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;

  bonusType: 'summer' | 'winter' | 'special'; // 夏季、冬季、特別
  paymentDate: string;
  evaluationPeriod: string;     // 評価対象期間

  // 支給内容
  baseAmount: number;           // 基本賞与額
  performanceRate: number;      // 成績率（%）
  performanceAmount: number;    // 成績加算額
  specialAmount: number;        // 特別加算額

  // 控除
  deductions: {
    healthInsurance: number;
    pensionInsurance: number;
    employmentInsurance: number;
    incomeTax: number;
  };

  grossAmount: number;          // 総支給額
  totalDeductions: number;      // 総控除額
  netAmount: number;            // 差引支給額

  status: 'draft' | 'approved' | 'paid';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 年末調整
export interface YearEndAdjustment {
  id: string;
  employeeId: string;
  year: number;

  // 所得情報
  totalEarnings: number;        // 年間総支給額
  totalSocialInsurance: number; // 社会保険料合計

  // 控除申告
  deductions: {
    basicDeduction: number;      // 基礎控除
    spouseDeduction: number;     // 配偶者控除
    dependentDeduction: number;  // 扶養控除
    insuranceDeduction: number;  // 生命保険料控除
    mortgageDeduction: number;   // 住宅ローン控除
    medicalDeduction: number;    // 医療費控除
    donationDeduction: number;   // 寄付金控除
  };

  // 計算結果
  taxableIncome: number;        // 課税所得
  calculatedTax: number;        // 算出所得税
  paidTax: number;             // 既納付所得税
  adjustmentAmount: number;     // 調整額（還付/追徴）

  status: 'pending' | 'processing' | 'completed' | 'confirmed';
  documents: string[];          // 添付書類
  submittedAt?: string;
  processedAt?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 給与計算パラメータ
export interface PayrollCalculationParams {
  employeeId: string;
  period: string;               // 計算対象期間
  workingDays: number;
  overtimeHours: number;
  lateNightHours: number;
  holidayWorkHours: number;
  absenceDays: number;
  paidLeaveDays: number;
}