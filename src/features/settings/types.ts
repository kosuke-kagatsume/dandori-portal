/**
 * Settings 共通型定義
 */

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
