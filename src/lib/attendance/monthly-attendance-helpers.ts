/**
 * 月次勤怠一覧 — 型定義・定数・ヘルパー関数
 */

import type { PunchRecord, PunchMethod } from '@/lib/store/attendance-history-store';

// ── 型定義 ──────────────────────────────────────────

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'remote' | 'holiday' | 'weekend' | 'late' | 'early_leave';
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  breakMinutes?: number;
  workHours?: number;
  overtime?: number;
  workLocation?: 'office' | 'home' | 'client' | 'other';
  workPattern?: string;
  note?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  attendanceType?: string;
  scheduledHours?: number;
  scheduledOvertime?: number;
  legalOvertime?: number;
  nightScheduled?: number;
  nightOvertime?: number;
  nightLegalOvertime?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  deemedScheduled?: number;
  deemedOvertime?: number;
  deemedLegalOvertime?: number;
  punchHistory?: PunchRecord[];
}

export interface MonthlyAttendanceListProps {
  records: AttendanceRecord[];
  onRecordUpdate?: (date: string, updates: Partial<AttendanceRecord>) => Promise<void> | void;
  onMonthChange?: (startDate: string, endDate: string) => void;
}

export interface PunchPairDisplay {
  checkIn?: { time: string; method: string };
  checkOut?: { time: string; method: string };
  breakStart?: { time: string; method: string };
  breakEnd?: { time: string; method: string };
  breaks?: Array<{ start?: { time: string; method: string }; end?: { time: string; method: string } }>;
}

// ── 定数 ──────────────────────────────────────────

export const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export const DEFAULT_WORK_PATTERNS = [
  { value: 'normal', label: '通常勤務' },
  { value: 'flex', label: 'フレックス' },
  { value: 'shift_early', label: '早番' },
  { value: 'shift_late', label: '遅番' },
  { value: 'remote', label: '在宅勤務' },
  { value: 'outside', label: '事業場外みなし' },
];

export const APPLICATION_TYPES = [
  { value: 'late', label: '遅刻', icon: '⏰' },
  { value: 'early_leave', label: '早退', icon: '🏃' },
  { value: 'overtime', label: '残業', icon: '💼' },
  { value: 'early_work', label: '早出', icon: '🌅' },
  { value: 'absence', label: '欠勤', icon: '❌' },
  { value: 'leave', label: '休暇', icon: '🏖️' },
  { value: 'holiday_work', label: '休日出勤', icon: '📅' },
];

export const PUNCH_METHOD_LABELS: Record<PunchMethod, string> = {
  manual: '手動',
  web: 'PC',
  mobile: 'スマホ',
  ic_card: 'IC',
  biometric: '生体',
};

// ── ヘルパー関数 ──────────────────────────────────────────

export function extractPunchPairs(punchHistory?: PunchRecord[]): PunchPairDisplay[] {
  if (!punchHistory || punchHistory.length === 0) return [];

  const sorted = [...punchHistory].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const pairs: PunchPairDisplay[] = [];
  let currentPair: PunchPairDisplay | null = null;
  let currentBreak: { start?: { time: string; method: string }; end?: { time: string; method: string } } | null = null;

  for (const punch of sorted) {
    const label = PUNCH_METHOD_LABELS[punch.method] || punch.method;
    if (punch.type === 'check_in') {
      if (currentPair) {
        if (currentBreak) {
          currentPair.breaks = currentPair.breaks || [];
          currentPair.breaks.push(currentBreak);
          currentBreak = null;
        }
        pairs.push(currentPair);
      }
      currentPair = { checkIn: { time: punch.time, method: label }, breaks: [] };
    } else if (currentPair) {
      if (punch.type === 'check_out') {
        if (currentBreak) {
          currentPair.breaks = currentPair.breaks || [];
          currentPair.breaks.push(currentBreak);
          currentBreak = null;
        }
        currentPair.checkOut = { time: punch.time, method: label };
      } else if (punch.type === 'break_start') {
        if (currentBreak) {
          currentPair.breaks = currentPair.breaks || [];
          currentPair.breaks.push(currentBreak);
        }
        currentBreak = { start: { time: punch.time, method: label } };
        if (!currentPair.breakStart) {
          currentPair.breakStart = { time: punch.time, method: label };
        }
      } else if (punch.type === 'break_end') {
        if (currentBreak) {
          currentBreak.end = { time: punch.time, method: label };
          currentPair.breaks = currentPair.breaks || [];
          currentPair.breaks.push(currentBreak);
          currentBreak = null;
        }
        if (!currentPair.breakEnd) {
          currentPair.breakEnd = { time: punch.time, method: label };
        }
      }
    }
  }

  if (currentPair) {
    if (currentBreak) {
      currentPair.breaks = currentPair.breaks || [];
      currentPair.breaks.push(currentBreak);
    }
    pairs.push(currentPair);
  }
  return pairs;
}

export function getAttendanceStatusLabel(status?: AttendanceRecord['status']): string {
  switch (status) {
    case 'present': return '出勤';
    case 'remote': return '在宅';
    case 'absent': return '欠勤';
    case 'late': return '遅刻';
    case 'early_leave': return '早退';
    case 'holiday': return '祝日';
    case 'weekend': return '休日';
    default: return '-';
  }
}

export function getLocationLabel(location?: string): string {
  switch (location) {
    case 'office': return 'オフィス';
    case 'home': return '在宅';
    case 'client': return '客先';
    case 'other': return 'その他';
    default: return '-';
  }
}

export function formatMinutesToTime(minutes?: number): string {
  if (!minutes) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

export function formatHours(hours?: number): string {
  if (!hours && hours !== 0) return '-';
  return hours.toFixed(2);
}
