/**
 * Settings 共通型定義
 */

// エクスポート時間フォーマット（P.22）
export type ExportTimeFormat = 'time' | 'hour_minute' | 'decimal' | 'minutes';

export interface SimpleSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  notifications: {
    browser: boolean;
    sound: boolean;
    email: boolean;
    emailAddress: string;
    emailTiming: 'instant' | 'daily' | 'weekly';
  };
  // エクスポート設定
  export: {
    // 時間フォーマット: time=1:30, hour_minute=1.30, decimal=1.50, minutes=90
    timeFormat: ExportTimeFormat;
    // CSVエンコーディング
    encoding: 'utf-8' | 'shift_jis';
    // 日付フォーマット
    dateFormat: 'YYYY-MM-DD' | 'YYYY/MM/DD' | 'MM/DD/YYYY';
  };
  saas: {
    monthlyBudget: number;
    budgetAlertThreshold: number;
    unusedLicenseDays: number;
    enableUnusedLicenseAlert: boolean;
  };
  attendance: {
    workStartTime: string;
    workEndTime: string;
    weekendDays: number[];
    enableNationalHolidays: boolean;
    defaultBreakMinutes: number;
    overtimeCalculationMethod: 'daily' | 'monthly';
    lateNightStartHour: number;
    lateNightEndHour: number;
    requireGpsForClockIn: boolean;
    allowedClockInRadius: number;
    annualLeaveGrantDays: number;
    enableLeaveCarryover: boolean;
    maxCarryoverDays: number;
  };
  assets: {
    assetNumberPrefix: string;
    depreciationMethod: 'straight-line' | 'declining-balance';
    requireApprovalForPurchase: boolean;
    approvalAmountThreshold: number;
    inventoryCheckFrequency: 'monthly' | 'quarterly' | 'yearly';
    enableAutoAssignment: boolean;
    lowStockAlertThreshold: number;
    enableReturnReminder: boolean;
    returnReminderDays: number;
  };
  workflow: {
    defaultApprovalDeadlineDays: number;
    enableAutoEscalation: boolean;
    escalationReminderDays: number;
    autoApprovalThreshold: number;
    enableAutoApproval: boolean;
    requireCommentOnReject: boolean;
    allowParallelApproval: boolean;
    enableProxyApproval: boolean;
  };
}

export interface SettingsTabProps {
  settings: SimpleSettings;
  updateSettings: (updates: Partial<SimpleSettings>) => void;
  saveSettings: () => void;
}

export const defaultSettings: SimpleSettings = {
  theme: 'light',
  language: 'ja',
  timezone: 'Asia/Tokyo',
  dateFormat: 'YYYY-MM-DD',
  notifications: {
    browser: false,
    sound: false,
    email: false,
    emailAddress: '',
    emailTiming: 'daily',
  },
  export: {
    timeFormat: 'time', // デフォルト: 時刻表示（1:30）
    encoding: 'utf-8',
    dateFormat: 'YYYY-MM-DD',
  },
  saas: {
    monthlyBudget: 500000,
    budgetAlertThreshold: 80,
    unusedLicenseDays: 30,
    enableUnusedLicenseAlert: true,
  },
  attendance: {
    workStartTime: '09:00',
    workEndTime: '18:00',
    weekendDays: [0, 6],
    enableNationalHolidays: true,
    defaultBreakMinutes: 60,
    overtimeCalculationMethod: 'daily',
    lateNightStartHour: 22,
    lateNightEndHour: 5,
    requireGpsForClockIn: false,
    allowedClockInRadius: 500,
    annualLeaveGrantDays: 10,
    enableLeaveCarryover: true,
    maxCarryoverDays: 20,
  },
  assets: {
    assetNumberPrefix: 'AST',
    depreciationMethod: 'straight-line',
    requireApprovalForPurchase: true,
    approvalAmountThreshold: 100000,
    inventoryCheckFrequency: 'yearly',
    enableAutoAssignment: false,
    lowStockAlertThreshold: 3,
    enableReturnReminder: true,
    returnReminderDays: 7,
  },
  workflow: {
    defaultApprovalDeadlineDays: 3,
    enableAutoEscalation: true,
    escalationReminderDays: 1,
    autoApprovalThreshold: 10000,
    enableAutoApproval: false,
    requireCommentOnReject: true,
    allowParallelApproval: false,
    enableProxyApproval: true,
  },
};
