/**
 * 就業ルールマスタ — 型定義・定数・デフォルト値・ヘルパー
 */

import type { WorkRuleType } from '@/features/users/user-attendance-tab';

// ── 定数定義 ──────────────────────────────────────────

export const workRuleTypes: { value: WorkRuleType; label: string; description: string }[] = [
  { value: 'standard', label: '基本勤務制', description: '固定の始業・終業時刻で勤務' },
  { value: 'shift', label: 'シフト制', description: '日によって勤務時間が変動' },
  { value: 'manager', label: '管理監督者', description: '労働時間・休日の規定が適用されない' },
  { value: 'discretionary', label: '裁量労働制', description: '業務の遂行方法を労働者に委ねる' },
  { value: 'flextime', label: 'フレックスタイム制', description: 'コアタイムを設定し柔軟に勤務' },
  { value: 'monthly_variable', label: '1ヶ月単位変形労働制', description: '1ヶ月以内の期間で労働時間を調整' },
  { value: 'yearly_variable', label: '1年単位変形労働制', description: '1年以内の期間で労働時間を調整' },
];

export const workRuleTypeLabels: Record<WorkRuleType, string> = {
  standard: '基本勤務制',
  shift: 'シフト制',
  manager: '管理監督者',
  discretionary: '裁量労働制',
  flextime: 'フレックスタイム制',
  monthly_variable: '1ヶ月単位変形労働制',
  yearly_variable: '1年単位変形労働制',
};

export const weekdays = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'] as const;

export const attendanceCategories = ['出勤', '法定休日', '所定休日'] as const;

export const weekdayOptions = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'] as const;

// ── 型定義 ──────────────────────────────────────────

export interface AutoBreakRule {
  id: string;
  laborMinutes: number;
  breakMinutes: number;
}

export interface AutoBreakTimeRange {
  id: string;
  startTime: string;
  endTime: string;
}

export interface WorkPatternFormData {
  id: string;
  name: string;
  punchDeemedType: string;
  contractStartTime: string;
  contractEndTime: string;
  autoBreak: boolean;
  autoBreakTimeSlot: 'none' | 'specify';
  autoBreakSlotType: 'scheduled' | 'night';
  autoBreakRules: AutoBreakRule[];
  autoBreakOutsideContract: boolean;
  autoBreakTimeRanges: AutoBreakTimeRange[];
  amLeaveContractStart: string;
  amLeaveDeemedTime: string;
  pmLeaveContractEnd: string;
  pmLeaveDeemedTime: string;
  patternFlexTimeStart: string;
  patternFlexTimeEnd: string;
  patternCoreTimeStart: string;
  patternCoreTimeEnd: string;
  fullFlex: boolean;
}

export interface ScheduleRow {
  weekday: string;
  category: string;
  patternId: string;
}

export interface WorkRuleFormData {
  // A1: ルール名 + 種別
  type: WorkRuleType;
  name: string;
  // A2: 締め日/起算日
  dateChangeHour: string;
  dateChangeMinute: string;
  closingDay: string;
  weekStartDay: string;
  yearStartMonth: string;
  yearStartDay: string;
  overtimeLimitYearStartMonth: string;
  overtimeLimitYearStartDay: string;
  // A7: 勤務日の判定方法
  workDayJudgment: string;
  // A8: 勤務パターン
  workPatterns: WorkPatternFormData[];
  // A9: 勤務スケジュール
  scheduleRows: ScheduleRow[];
  // A10: 休憩打刻
  breakPunch: string;
  // A11-15: 休暇・休日
  paidLeaveAutoGrant: boolean;
  paidLeavePattern: string;
  weeklyContractDays: string;
  paidLeaveHourlyUnit: boolean;
  paidLeaveHourlyHours: string;
  leaveNursingCare: boolean;
  leaveChildCare: boolean;
  leaveYearEnd: boolean;
  leaveCongratulatory: boolean;
  holidayPattern: string;
  substituteHolidayPattern: string;
  compensatoryDayOffPattern: string;
  compensatoryDayOffAutoGrant: string;
  // A16: 36協定
  agreement36Name: string;
  // A17: 未申請打刻の取り扱い
  unapprovedEarlyWork: string;
  unapprovedLateArrival: string;
  unapprovedEarlyLeave: string;
  unapprovedOvertime: string;
  // 勤務時間（共通）
  standardWorkHours: number;
  breakMinutes: number;
  workStartTime: string;
  workEndTime: string;
  // B: 基本勤務制 / シフト制
  lateEarlyTally: string;
  scheduledTallyRange: string;
  legalHolidayDesignation: string;
  // B: 管理監督者
  managerDayOffDeemedHour: string;
  managerDayOffDeemedMinute: string;
  // B: 裁量労働制
  discretionaryScope: string;
  discretionaryPrescribedHour: string;
  discretionaryPrescribedMinute: string;
  discretionaryDeemedHour: string;
  discretionaryDeemedMinute: string;
  discretionaryDayOffDeemedHour: string;
  discretionaryDayOffDeemedMinute: string;
  // B: フレックスタイム制
  flexSettlementPeriod: string;
  flexTotalWorkCalc: string;
  flexTotalWorkHours: string;
  flexLegalFrameCalc: string;
  flexDeficiencyHandling: string;
  flexDeficiencyCarryOverLimit: string;
  flexScope: string;
  flexStandardWorkTime: string;
  flexDayOffDeemedTime: string;
  coreTimeStart: string;
  coreTimeEnd: string;
  flexTimeStart: string;
  flexTimeEnd: string;
  // B: 1ヶ月単位変形
  monthlyStartDay: string;
  monthlyFractionWeekHandling: string;
  monthlyScope: string;
  // B: 1年単位変形
  yearlyStartMonth: string;
  yearlyStartDay: string;
  yearlyFractionWeekHandling: string;
  yearlyScope: string;
}

// ── デフォルト値 ──────────────────────────────────────────

export const defaultWorkPattern: WorkPatternFormData = {
  id: '',
  name: '',
  punchDeemedType: 'none',
  contractStartTime: '09:00',
  contractEndTime: '18:00',
  autoBreak: false,
  autoBreakTimeSlot: 'none',
  autoBreakSlotType: 'scheduled',
  autoBreakRules: [],
  autoBreakOutsideContract: false,
  autoBreakTimeRanges: [],
  amLeaveContractStart: '09:00',
  amLeaveDeemedTime: '04:00',
  pmLeaveContractEnd: '18:00',
  pmLeaveDeemedTime: '04:00',
  patternFlexTimeStart: '07:00',
  patternFlexTimeEnd: '22:00',
  patternCoreTimeStart: '10:00',
  patternCoreTimeEnd: '15:00',
  fullFlex: false,
};

export const defaultScheduleRows: ScheduleRow[] = weekdays.map((day) => ({
  weekday: day,
  category: day === '土曜日' || day === '日曜日' ? '所定休日' : '出勤',
  patternId: '',
}));

export const defaultFormData: WorkRuleFormData = {
  type: 'standard',
  name: '',
  dateChangeHour: '0',
  dateChangeMinute: '0',
  closingDay: 'month_end',
  weekStartDay: '日曜日',
  yearStartMonth: '4',
  yearStartDay: '1',
  overtimeLimitYearStartMonth: '4',
  overtimeLimitYearStartDay: '1',
  workDayJudgment: 'company',
  workPatterns: [],
  scheduleRows: defaultScheduleRows,
  breakPunch: 'accept',
  paidLeaveAutoGrant: false,
  paidLeavePattern: '',
  weeklyContractDays: '5',
  paidLeaveHourlyUnit: false,
  paidLeaveHourlyHours: '8',
  leaveNursingCare: false,
  leaveChildCare: false,
  leaveYearEnd: false,
  leaveCongratulatory: false,
  holidayPattern: '',
  substituteHolidayPattern: '',
  compensatoryDayOffPattern: '',
  compensatoryDayOffAutoGrant: 'none',
  agreement36Name: '',
  unapprovedEarlyWork: 'discard',
  unapprovedLateArrival: 'discard',
  unapprovedEarlyLeave: 'discard',
  unapprovedOvertime: 'discard',
  standardWorkHours: 480,
  breakMinutes: 60,
  workStartTime: '09:00',
  workEndTime: '18:00',
  lateEarlyTally: 'count',
  scheduledTallyRange: 'contract_range_only',
  legalHolidayDesignation: 'specify_both',
  managerDayOffDeemedHour: '8',
  managerDayOffDeemedMinute: '0',
  discretionaryScope: 'weekday_only',
  discretionaryPrescribedHour: '8',
  discretionaryPrescribedMinute: '0',
  discretionaryDeemedHour: '8',
  discretionaryDeemedMinute: '0',
  discretionaryDayOffDeemedHour: '8',
  discretionaryDayOffDeemedMinute: '0',
  flexSettlementPeriod: '1month',
  flexTotalWorkCalc: 'standard_days',
  flexTotalWorkHours: '160:00',
  flexLegalFrameCalc: 'principle',
  flexDeficiencyHandling: 'settle_at_end',
  flexDeficiencyCarryOverLimit: '06:00',
  flexScope: 'weekday_only',
  flexStandardWorkTime: '08:00',
  flexDayOffDeemedTime: '08:00',
  coreTimeStart: '10:00',
  coreTimeEnd: '15:00',
  flexTimeStart: '07:00',
  flexTimeEnd: '22:00',
  monthlyStartDay: '1',
  monthlyFractionWeekHandling: 'proportional',
  monthlyScope: 'all',
  yearlyStartMonth: '4',
  yearlyStartDay: '1',
  yearlyFractionWeekHandling: 'proportional',
  yearlyScope: 'all',
};

// ── セクション表示ヘルパー ────────────────────────────

export function showSection(type: WorkRuleType, section: string): boolean {
  const matrix: Record<string, WorkRuleType[]> = {
    closingDate: ['standard', 'shift', 'manager', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    workDayJudgment: ['standard', 'shift', 'manager', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    discretionaryScope: ['discretionary'],
    flexSettlement: ['flextime'],
    flexScope: ['flextime'],
    variablePeriod: ['monthly_variable', 'yearly_variable'],
    variableScope: ['monthly_variable', 'yearly_variable'],
    workTime: ['standard', 'shift', 'manager'],
    workPattern: ['standard', 'shift', 'manager', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    lateEarlyTally: ['standard', 'shift', 'flextime', 'discretionary', 'monthly_variable', 'yearly_variable'],
    scheduledTallyRange: ['standard', 'shift', 'monthly_variable', 'yearly_variable'],
    legalHolidayDesignation: ['standard', 'shift', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    schedule: ['standard', 'manager', 'discretionary', 'flextime'],
    breakPunch: ['standard', 'shift', 'manager', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    leave: ['standard', 'shift', 'manager', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    compensatoryDayOff: ['standard', 'shift', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    agreement36: ['standard', 'shift', 'manager', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    unapprovedPunch: ['standard', 'shift', 'monthly_variable', 'yearly_variable'],
  };
  return matrix[section]?.includes(type) ?? false;
}

// ── ユーティリティ ────────────────────────────

export function formatHoursMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
}
