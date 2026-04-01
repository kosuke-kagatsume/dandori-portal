/**
 * 勤怠管理 共通型定義
 *
 * attendance-settings, work-rules, holidays, shifts, punches 等の
 * 型定義を集約。各コンポーネントでの個別定義を解消。
 */

// ── 勤怠設定 ──────────────────────────────────

/** 集計カテゴリ */
export interface AggregationCategory {
  id: string;
  name: string;
  color?: string;
}

/** フリーテキストマスタ項目（部署・職種等） */
export interface FreeTextMasterItem {
  id: string;
  name: string;
}

/** 集計設定 */
export interface AggregationSettings {
  categories: AggregationCategory[];
  departments: FreeTextMasterItem[];
  jobTypes: FreeTextMasterItem[];
}

/** 打刻丸めルール */
export interface PunchRoundingRule {
  target: 'check_in' | 'check_out' | 'break_start' | 'break_end';
  label: string;
  direction: 'up' | 'down' | 'none';
  interval: number;
}

/** 勤怠設定全体（GET /api/attendance-settings の data） */
export interface AttendanceSettings {
  aggregationSettings?: AggregationSettings;
  punchRoundingRules?: PunchRoundingRule[];
}

// ── 就業ルール ──────────────────────────────────

/** 就業ルール（一覧用） */
export interface WorkRuleRecord {
  id: string;
  name: string;
  type?: string;
  [key: string]: unknown;
}

/** 就業ルール保存ペイロード */
export type WorkRulePayload = Record<string, unknown>;

// ── 休日マスタ ──────────────────────────────────

/** 会社休日 */
export interface CompanyHoliday {
  id: string;
  date: string;
  name: string;
  type: 'company';
  fiscalYear: number;
  isRecurring: boolean;
}

/** 休日作成ペイロード */
export interface CreateHolidayPayload {
  date: string;
  name: string;
  type: 'company';
  fiscalYear: number;
  isRecurring: boolean;
}

// ── 勤務パターン ──────────────────────────────────

/** 勤務パターン（一覧用） */
export interface WorkPattern {
  id: string;
  name: string;
  code?: string;
  workStartTime?: string;
  workEndTime?: string;
  breakDurationMinutes?: number;
  workingMinutes?: number;
  isNightShift?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

// ── 打刻 ──────────────────────────────────

/** 打刻記録 */
export interface PunchRecord {
  id: string;
  punchType: 'check_in' | 'check_out' | 'break_start' | 'break_end';
  punchTime: string;
}

// ── シフト ──────────────────────────────────

/** シフト割当 */
export interface ShiftAssignment {
  id: string;
  tenantId: string;
  userId: string;
  date: string;
  patternId: string;
  attendanceType: 'weekday' | 'prescribed_holiday' | 'legal_holiday';
  memo?: string;
}

/** シフト保存ペイロード */
export interface SaveShiftPayload {
  userId: string;
  date: string;
  patternId: string;
  attendanceType: string;
}

/** シフト自動生成ペイロード */
export interface AutoGenerateShiftsPayload {
  year: number;
  month: number;
  overwrite: boolean;
}

/** シフト取得レスポンス（GET /api/attendance/shifts の data） */
export interface ShiftData {
  shifts: ShiftAssignment[];
  patterns: WorkPattern[];
}

// ── 勤怠レコード ──────────────────────────────────

/** チーム勤怠レコード（GET /api/attendance の data） */
export interface AttendanceRecord {
  [key: string]: unknown;
}
