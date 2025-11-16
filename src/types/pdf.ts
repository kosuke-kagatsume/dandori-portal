/**
 * PDF生成用の型定義
 */

import type { jsPDF } from 'jspdf';

// 給与明細データ
export interface PayrollData {
  employeeName: string;
  employeeId: string;
  department: string;
  paymentDate: string; // YYYY-MM-DD形式
  basicSalary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
}

// 賞与明細データ
export interface BonusData {
  employeeName: string;
  employeeId: string;
  department: string;
  bonusType: 'summer' | 'winter' | 'special';
  paymentDate: string; // YYYY-MM-DD形式
  basicBonus: number;
  performanceBonus: number;
  performanceRating: 'S' | 'A' | 'B' | 'C' | 'D';
  deductions: Record<string, number>;
  totalDeductions: number;
  netBonus: number;
}

// 源泉徴収票データ
export interface WithholdingSlipData {
  employeeName: string;
  employeeId: string;
  address: string;
  year: number;
  totalIncome: number;
  employmentIncome: number;
  deductions: {
    socialInsurance: number;
    basic: number;
    dependent: number;
    spouse: number;
    lifeInsurance: number;
  };
  totalDeductions: number;
  taxableIncome: number;
  incomeTax: number;
  specialTax: number;
  companyName: string;
  companyAddress: string;
  representativeName: string;
}

// PDF生成結果
export interface PDFGenerationResult {
  success: boolean;
  error?: string;
  pdf?: jsPDF;
}

// 共通PDFセクション
export interface PDFSection {
  title: string;
  items: Array<{ label: string; value: number | string }>;
  total?: number;
}

// 共通PDF設定
export interface PDFConfig {
  title: string;
  subtitle: string;
  mainAmount: { label: string; value: number };
  leftSection: PDFSection;
  rightSection: PDFSection;
  summaryBar?: {
    leftLabel: string;
    leftTotal: number;
    rightLabel: string;
    rightTotal: number;
    netLabel: string;
    net: number;
  };
  employeeInfo: {
    name: string;
    id: string;
    department?: string;
    address?: string;
    extraFields?: Record<string, string>;
  };
}

// フォントローダー結果
export interface FontLoaderResult {
  success: boolean;
  error?: string;
}
