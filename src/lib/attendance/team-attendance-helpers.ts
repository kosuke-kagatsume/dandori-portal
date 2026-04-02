/**
 * チーム勤怠 — 型定義・定数・ヘルパー関数
 */

export interface TeamMember {
  id: string;
  name: string;
  department: string | null;
  position: string | null;
  employeeNumber?: string;
}

export interface TeamAttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  totalBreakMinutes: number;
  workMinutes: number;
  overtimeMinutes: number;
  workLocation: string | null;
  workPatternName: string | null;
  status: string;
  memo: string | null;
  approvalStatus?: string | null;
  punches?: Array<{
    id: string;
    punchType: string;
    punchTime: string;
    punchOrder: number;
  }>;
}

export interface DailyRecordData {
  checkIn: string | null;
  checkOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  totalBreakMinutes: number;
  workMinutes: number;
  overtimeMinutes: number;
  workLocation: string | null;
  workPatternName: string | null;
  status: string;
  memo: string | null;
  approvalStatus?: string | null;
  punchPairs?: Array<{ checkIn: string | null; checkOut: string | null }>;
}

export interface MemberMonthlyData {
  memberId: string;
  memberName: string;
  department: string;
  closingRequested: boolean;
  managerApproved: boolean;
  attendanceClosed: boolean;
  dailyRecords: Map<string, DailyRecordData>;
  summary: {
    workDays: number;
    presentDays: number;
    remoteDays: number;
    absentDays: number;
    lateDays: number;
    earlyLeaveDays: number;
    totalWorkHours: number;
    totalOvertimeHours: number;
  };
}

export interface DayDetail {
  memberName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}

export type ActionType = 'approve' | 'reject' | 'close' | 'unlock' | 'cancel_approval' | 'proxy_close_request';

export const TEAM_WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export const ACTION_LABELS: Record<ActionType, string> = {
  approve: '承認',
  reject: '差し戻し',
  close: '勤怠締め',
  unlock: '締め解除',
  cancel_approval: '承認解除',
  proxy_close_request: '代理締め申請',
};

export function toHHmm(value: string | null): string | null {
  if (!value) return null;
  if (/^\d{1,2}:\d{2}$/.test(value)) return value;
  try {
    return new Date(value).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
    });
  } catch {
    return value;
  }
}
