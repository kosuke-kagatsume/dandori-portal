'use client';

import { create } from 'zustand';
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

const DATA_VERSION = 4; // 所得税計算エンジン統合（dependentsフィールド追加）

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

// 50名の従業員マスタデータ
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
    dependents: 2, // 配偶者+子供1人
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
  // user-16 ~ user-50 (35名追加)
  {
    id: '16',
    employeeId: 'user-16',
    employeeName: '岡田聡',
    department: '営業部',
    position: 'スタッフ',
    basicSalary: 330000,
    positionAllowance: 10000,
    skillAllowance: 15000,
    housingAllowance: 22000,
    familyAllowance: 10000,
    commutingAllowance: 11000,
    hourlyRate: 2200,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 21000,
    savingsAmount: 8000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '17',
    employeeId: 'user-17',
    employeeName: '松井由香',
    department: '経理部',
    position: 'スタッフ',
    basicSalary: 300000,
    positionAllowance: 0,
    skillAllowance: 12000,
    housingAllowance: 20000,
    familyAllowance: 0,
    commutingAllowance: 10000,
    hourlyRate: 2000,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 18000,
    savingsAmount: 6000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '18',
    employeeId: 'user-18',
    employeeName: '野村健',
    department: '技術部',
    position: 'エンジニア',
    basicSalary: 420000,
    positionAllowance: 30000,
    skillAllowance: 35000,
    housingAllowance: 28000,
    familyAllowance: 20000,
    commutingAllowance: 15000,
    hourlyRate: 2800,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 29000,
    unionFee: 2400,
    savingsAmount: 13000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '19',
    employeeId: 'user-19',
    employeeName: '池田真理',
    department: '人事部',
    position: 'スタッフ',
    basicSalary: 295000,
    positionAllowance: 0,
    skillAllowance: 10000,
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
    residentTaxAmount: 17500,
    savingsAmount: 5000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '20',
    employeeId: 'user-20',
    employeeName: '久保田修',
    department: '総務部',
    position: 'スタッフ',
    basicSalary: 315000,
    positionAllowance: 10000,
    skillAllowance: 15000,
    housingAllowance: 22000,
    familyAllowance: 15000,
    commutingAllowance: 12000,
    hourlyRate: 2100,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 19500,
    savingsAmount: 7000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '21',
    employeeId: 'user-21',
    employeeName: '前田亮',
    department: '営業部',
    position: '主任',
    basicSalary: 400000,
    positionAllowance: 35000,
    skillAllowance: 20000,
    housingAllowance: 28000,
    familyAllowance: 20000,
    commutingAllowance: 16000,
    hourlyRate: 2650,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 27000,
    unionFee: 2300,
    savingsAmount: 11000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '22',
    employeeId: 'user-22',
    employeeName: '藤原美穂',
    department: '広報部',
    position: 'スタッフ',
    basicSalary: 325000,
    positionAllowance: 0,
    skillAllowance: 22000,
    housingAllowance: 23000,
    familyAllowance: 10000,
    commutingAllowance: 13000,
    hourlyRate: 2150,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 20000,
    savingsAmount: 8500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '23',
    employeeId: 'user-23',
    employeeName: '石川浩二',
    department: '法務部',
    position: 'スタッフ',
    basicSalary: 380000,
    positionAllowance: 25000,
    skillAllowance: 30000,
    housingAllowance: 26000,
    familyAllowance: 15000,
    commutingAllowance: 14000,
    hourlyRate: 2500,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 25000,
    unionFee: 2100,
    savingsAmount: 10000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '24',
    employeeId: 'user-24',
    employeeName: '坂本愛',
    department: '企画部',
    position: 'スタッフ',
    basicSalary: 305000,
    positionAllowance: 0,
    skillAllowance: 15000,
    housingAllowance: 20000,
    familyAllowance: 0,
    commutingAllowance: 10000,
    hourlyRate: 2000,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 18500,
    savingsAmount: 6500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '25',
    employeeId: 'user-25',
    employeeName: '近藤誠',
    department: '技術部',
    position: 'シニアエンジニア',
    basicSalary: 500000,
    positionAllowance: 70000,
    skillAllowance: 45000,
    housingAllowance: 38000,
    familyAllowance: 30000,
    commutingAllowance: 19000,
    hourlyRate: 3300,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 38000,
    unionFee: 3200,
    savingsAmount: 22000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '26',
    employeeId: 'user-26',
    employeeName: '村上綾香',
    department: '経理部',
    position: '主任',
    basicSalary: 395000,
    positionAllowance: 33000,
    skillAllowance: 20000,
    housingAllowance: 27000,
    familyAllowance: 15000,
    commutingAllowance: 14000,
    hourlyRate: 2600,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 26500,
    unionFee: 2250,
    savingsAmount: 11500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '27',
    employeeId: 'user-27',
    employeeName: '竹内隆史',
    department: '営業部',
    position: 'スタッフ',
    basicSalary: 345000,
    positionAllowance: 15000,
    skillAllowance: 18000,
    housingAllowance: 24000,
    familyAllowance: 10000,
    commutingAllowance: 12000,
    hourlyRate: 2250,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 22500,
    savingsAmount: 9000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '28',
    employeeId: 'user-28',
    employeeName: '須藤麗',
    department: '人事部',
    position: '課長',
    basicSalary: 460000,
    positionAllowance: 55000,
    skillAllowance: 25000,
    housingAllowance: 32000,
    familyAllowance: 25000,
    commutingAllowance: 17000,
    hourlyRate: 3050,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 33000,
    unionFee: 2700,
    savingsAmount: 16000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '29',
    employeeId: 'user-29',
    employeeName: '宮崎太一',
    department: '総務部',
    position: '主任',
    basicSalary: 385000,
    positionAllowance: 30000,
    skillAllowance: 18000,
    housingAllowance: 26000,
    familyAllowance: 20000,
    commutingAllowance: 13000,
    hourlyRate: 2550,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 25500,
    unionFee: 2150,
    savingsAmount: 10500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '30',
    employeeId: 'user-30',
    employeeName: '大野由紀',
    department: '広報部',
    position: 'スタッフ',
    basicSalary: 335000,
    positionAllowance: 0,
    skillAllowance: 20000,
    housingAllowance: 23000,
    familyAllowance: 0,
    commutingAllowance: 12000,
    hourlyRate: 2200,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 21000,
    savingsAmount: 8500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '31',
    employeeId: 'user-31',
    employeeName: '谷口信夫',
    department: '法務部',
    position: '課長',
    basicSalary: 470000,
    positionAllowance: 58000,
    skillAllowance: 38000,
    housingAllowance: 34000,
    familyAllowance: 25000,
    commutingAllowance: 18000,
    hourlyRate: 3100,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 34000,
    unionFee: 2850,
    savingsAmount: 17000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '32',
    employeeId: 'user-32',
    employeeName: '西村香織',
    department: '企画部',
    position: '主任',
    basicSalary: 375000,
    positionAllowance: 28000,
    skillAllowance: 16000,
    housingAllowance: 25000,
    familyAllowance: 10000,
    commutingAllowance: 13000,
    hourlyRate: 2450,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 24500,
    unionFee: 2050,
    savingsAmount: 10000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '33',
    employeeId: 'user-33',
    employeeName: '上田拓也',
    department: '技術部',
    position: 'エンジニア',
    basicSalary: 410000,
    positionAllowance: 32000,
    skillAllowance: 33000,
    housingAllowance: 29000,
    familyAllowance: 15000,
    commutingAllowance: 16000,
    hourlyRate: 2700,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 28000,
    unionFee: 2350,
    savingsAmount: 12500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '34',
    employeeId: 'user-34',
    employeeName: '金子美和',
    department: '経理部',
    position: '課長',
    basicSalary: 465000,
    positionAllowance: 56000,
    skillAllowance: 27000,
    housingAllowance: 33000,
    familyAllowance: 20000,
    commutingAllowance: 17000,
    hourlyRate: 3080,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 33500,
    unionFee: 2750,
    savingsAmount: 16500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '35',
    employeeId: 'user-35',
    employeeName: '三浦健太郎',
    department: '営業部',
    position: 'スタッフ',
    basicSalary: 325000,
    positionAllowance: 12000,
    skillAllowance: 14000,
    housingAllowance: 22000,
    familyAllowance: 10000,
    commutingAllowance: 11000,
    hourlyRate: 2150,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 20500,
    savingsAmount: 8000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '36',
    employeeId: 'user-36',
    employeeName: '内田千鶴',
    department: '人事部',
    position: 'スタッフ',
    basicSalary: 290000,
    positionAllowance: 0,
    skillAllowance: 11000,
    housingAllowance: 19000,
    familyAllowance: 0,
    commutingAllowance: 9500,
    hourlyRate: 1950,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 17500,
    savingsAmount: 5500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '37',
    employeeId: 'user-37',
    employeeName: '今井俊介',
    department: '総務部',
    position: 'スタッフ',
    basicSalary: 320000,
    positionAllowance: 8000,
    skillAllowance: 17000,
    housingAllowance: 21000,
    familyAllowance: 15000,
    commutingAllowance: 11500,
    hourlyRate: 2100,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 20000,
    savingsAmount: 7500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '38',
    employeeId: 'user-38',
    employeeName: '杉本直子',
    department: '広報部',
    position: '主任',
    basicSalary: 390000,
    positionAllowance: 31000,
    skillAllowance: 26000,
    housingAllowance: 27000,
    familyAllowance: 20000,
    commutingAllowance: 15000,
    hourlyRate: 2580,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 26000,
    unionFee: 2200,
    savingsAmount: 11500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '39',
    employeeId: 'user-39',
    employeeName: '横山勇',
    department: '法務部',
    position: 'スタッフ',
    basicSalary: 370000,
    positionAllowance: 23000,
    skillAllowance: 28000,
    housingAllowance: 25000,
    familyAllowance: 10000,
    commutingAllowance: 13500,
    hourlyRate: 2450,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 24000,
    unionFee: 2000,
    savingsAmount: 9500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '40',
    employeeId: 'user-40',
    employeeName: '水野沙織',
    department: '企画部',
    position: '課長',
    basicSalary: 455000,
    positionAllowance: 54000,
    skillAllowance: 24000,
    housingAllowance: 31000,
    familyAllowance: 25000,
    commutingAllowance: 16500,
    hourlyRate: 3000,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 32000,
    unionFee: 2650,
    savingsAmount: 15500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '41',
    employeeId: 'user-41',
    employeeName: '長野浩',
    department: '技術部',
    position: 'エンジニア',
    basicSalary: 425000,
    positionAllowance: 35000,
    skillAllowance: 36000,
    housingAllowance: 30000,
    familyAllowance: 20000,
    commutingAllowance: 16000,
    hourlyRate: 2800,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 29500,
    unionFee: 2450,
    savingsAmount: 13500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '42',
    employeeId: 'user-42',
    employeeName: '藤井瞳',
    department: '経理部',
    position: 'スタッフ',
    basicSalary: 315000,
    positionAllowance: 0,
    skillAllowance: 16000,
    housingAllowance: 21000,
    familyAllowance: 10000,
    commutingAllowance: 11000,
    hourlyRate: 2080,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 19500,
    savingsAmount: 7000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '43',
    employeeId: 'user-43',
    employeeName: '本田雅彦',
    department: '営業部',
    position: '主任',
    basicSalary: 405000,
    positionAllowance: 36000,
    skillAllowance: 21000,
    housingAllowance: 28000,
    familyAllowance: 20000,
    commutingAllowance: 15500,
    hourlyRate: 2670,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 27500,
    unionFee: 2350,
    savingsAmount: 12000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '44',
    employeeId: 'user-44',
    employeeName: '安藤理恵',
    department: '人事部',
    position: 'スタッフ',
    basicSalary: 298000,
    positionAllowance: 0,
    skillAllowance: 12000,
    housingAllowance: 19500,
    familyAllowance: 0,
    commutingAllowance: 10000,
    hourlyRate: 1980,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 18000,
    savingsAmount: 6000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '45',
    employeeId: 'user-45',
    employeeName: '柴田浩司',
    department: '総務部',
    position: '部長',
    basicSalary: 530000,
    positionAllowance: 90000,
    skillAllowance: 28000,
    housingAllowance: 40000,
    familyAllowance: 30000,
    commutingAllowance: 19000,
    hourlyRate: 3500,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 42000,
    unionFee: 3300,
    savingsAmount: 23000,
    dependents: 3,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '46',
    employeeId: 'user-46',
    employeeName: '河合あゆみ',
    department: '広報部',
    position: 'スタッフ',
    basicSalary: 330000,
    positionAllowance: 0,
    skillAllowance: 21000,
    housingAllowance: 23000,
    familyAllowance: 0,
    commutingAllowance: 12500,
    hourlyRate: 2170,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 21000,
    savingsAmount: 8500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '47',
    employeeId: 'user-47',
    employeeName: '片岡大輔',
    department: '法務部',
    position: '主任',
    basicSalary: 435000,
    positionAllowance: 38000,
    skillAllowance: 34000,
    housingAllowance: 31000,
    familyAllowance: 25000,
    commutingAllowance: 17000,
    hourlyRate: 2870,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 30000,
    unionFee: 2550,
    savingsAmount: 14500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '48',
    employeeId: 'user-48',
    employeeName: '橋爪千尋',
    department: '企画部',
    position: 'スタッフ',
    basicSalary: 310000,
    positionAllowance: 0,
    skillAllowance: 14000,
    housingAllowance: 20000,
    familyAllowance: 10000,
    commutingAllowance: 10500,
    hourlyRate: 2050,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 19000,
    savingsAmount: 7000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '49',
    employeeId: 'user-49',
    employeeName: '岩崎正樹',
    department: '技術部',
    position: '次長',
    basicSalary: 520000,
    positionAllowance: 85000,
    skillAllowance: 48000,
    housingAllowance: 39000,
    familyAllowance: 30000,
    commutingAllowance: 19500,
    hourlyRate: 3430,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 41000,
    unionFee: 3250,
    savingsAmount: 22000,
    dependents: 2,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '50',
    employeeId: 'user-50',
    employeeName: '平野恵美',
    department: '経理部',
    position: '部長',
    basicSalary: 540000,
    positionAllowance: 95000,
    skillAllowance: 32000,
    housingAllowance: 41000,
    familyAllowance: 30000,
    commutingAllowance: 20000,
    hourlyRate: 3570,
    overtimeRate: 1.25,
    lateNightRate: 1.5,
    holidayRate: 1.35,
    healthInsuranceRate: INSURANCE_RATES.health.employee,
    pensionRate: INSURANCE_RATES.pension.employee,
    employmentInsuranceRate: INSURANCE_RATES.employment.employee,
    residentTaxAmount: 43000,
    unionFee: 3400,
    savingsAmount: 24000,
    dependents: 2,
    updatedAt: new Date().toISOString(),
  },
];

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
  const storeCreator = (set: any, get: any) => ({
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
      version: DATA_VERSION,
      migrate: (persisted, version) => {
        console.log('[PayrollStore] Migration check:', { version, dataVersion: DATA_VERSION });
        const safe = (persisted as Partial<PayrollState>) || {};
        const count = Array.isArray(safe.salaryMasters) ? safe.salaryMasters.length : 0;

        if (version !== DATA_VERSION || count < 50) {
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
        bonusEvaluations: s.bonusEvaluations,
        yearEndAdjustments: s.yearEndAdjustments,
        yearEndAdjustmentDeclarations: s.yearEndAdjustmentDeclarations,
        currentPeriod: s.currentPeriod
      }),
    })
  );
};

export const usePayrollStore = createPayrollStore();