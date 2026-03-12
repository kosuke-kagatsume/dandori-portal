/**
 * B1: 勤怠時間計算ユーティリティ
 * 就業ルール（開始/終了時刻、所定分数）と打刻データから各種時間を算出
 */

interface WorkPatternInfo {
  workingMinutes: number;       // 所定労働時間（分）
  workStartTime: string;        // 始業時刻 "09:00"
  workEndTime: string;          // 終業時刻 "18:00"
  breakStartTime?: string | null;  // 休憩開始 "12:00"
  breakEndTime?: string | null;    // 休憩終了 "13:00"
  breakDurationMinutes?: number;   // 休憩時間（分）
  isNightShift?: boolean;
}

interface PunchData {
  checkIn: string | null;   // HH:mm
  checkOut: string | null;  // HH:mm
  totalBreakMinutes: number;
}

export interface AttendanceCalculationResult {
  /** 総労働時間（分） */
  totalWorkMinutes: number;
  /** 所定内労働時間（分） */
  scheduledWorkMinutes: number;
  /** 所定外労働時間（分） */
  scheduledOvertimeMinutes: number;
  /** 法定外労働時間（分）8h超 */
  legalOvertimeMinutes: number;
  /** 遅刻（分） */
  lateMinutes: number;
  /** 早退（分） */
  earlyLeaveMinutes: number;
  /** 深夜所定（分）22:00-5:00内の所定内 */
  nightScheduledMinutes: number;
  /** 深夜所定外（分） */
  nightOvertimeMinutes: number;
  /** 深夜法定外（分） */
  nightLegalOvertimeMinutes: number;
  /** 休憩（分） */
  breakMinutes: number;
  /** みなし所定（分） - 裁量労働制用 */
  deemedScheduledMinutes: number;
  /** みなし所定外（分） */
  deemedOvertimeMinutes: number;
  /** みなし法定外（分） */
  deemedLegalOvertimeMinutes: number;
}

/** HH:mm → 0:00からの分数 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}

/** 深夜帯（22:00-5:00）と重なる分数を計算 */
function calcNightMinutes(startMin: number, endMin: number): number {
  // 深夜帯: 22:00(1320分) ~ 翌5:00
  const NIGHT_START = 22 * 60; // 1320

  let nightMinutes = 0;

  // 日中の22:00-24:00
  if (endMin > NIGHT_START) {
    const ns = Math.max(startMin, NIGHT_START);
    const ne = Math.min(endMin, 24 * 60);
    if (ne > ns) nightMinutes += ne - ns;
  }

  // 翌0:00-5:00（endMinが24:00を超える場合）
  if (endMin > 24 * 60) {
    const ns = Math.max(startMin - 24 * 60, 0);
    const ne = Math.min(endMin - 24 * 60, 5 * 60);
    if (ne > ns) nightMinutes += ne - ns;
  }

  // 0:00-5:00に勤務開始する場合
  if (startMin < 5 * 60) {
    const ns = startMin;
    const ne = Math.min(endMin, 5 * 60);
    if (ne > ns) nightMinutes += ne - ns;
  }

  return nightMinutes;
}

/**
 * 勤怠の詳細時間を計算
 */
export function calculateAttendanceDetails(
  pattern: WorkPatternInfo,
  punch: PunchData
): AttendanceCalculationResult {
  const result: AttendanceCalculationResult = {
    totalWorkMinutes: 0,
    scheduledWorkMinutes: 0,
    scheduledOvertimeMinutes: 0,
    legalOvertimeMinutes: 0,
    lateMinutes: 0,
    earlyLeaveMinutes: 0,
    nightScheduledMinutes: 0,
    nightOvertimeMinutes: 0,
    nightLegalOvertimeMinutes: 0,
    breakMinutes: punch.totalBreakMinutes || 0,
    deemedScheduledMinutes: 0,
    deemedOvertimeMinutes: 0,
    deemedLegalOvertimeMinutes: 0,
  };

  if (!punch.checkIn || !punch.checkOut) {
    return result;
  }

  const checkInMin = timeToMinutes(punch.checkIn);
  const checkOutMin = timeToMinutes(punch.checkOut);
  const workStartMin = timeToMinutes(pattern.workStartTime);
  const workEndMin = timeToMinutes(pattern.workEndTime);
  const scheduledMinutes = pattern.workingMinutes || 480;
  const legalLimit = 480; // 法定8時間

  // 総労働時間 = 退勤 - 出勤 - 休憩
  const grossMinutes = checkOutMin - checkInMin;
  result.totalWorkMinutes = Math.max(0, grossMinutes - result.breakMinutes);

  // 遅刻: 出勤が始業より後
  if (checkInMin > workStartMin) {
    result.lateMinutes = checkInMin - workStartMin;
  }

  // 早退: 退勤が終業より前（出勤済みの場合のみ）
  if (checkOutMin < workEndMin) {
    result.earlyLeaveMinutes = workEndMin - checkOutMin;
  }

  // 所定内: min(総労働, 所定労働時間)
  result.scheduledWorkMinutes = Math.min(result.totalWorkMinutes, scheduledMinutes);

  // 所定外: 総労働 - 所定内
  result.scheduledOvertimeMinutes = Math.max(0, result.totalWorkMinutes - scheduledMinutes);

  // 法定外: 総労働 - 法定8時間（法定8時間を超えた分）
  result.legalOvertimeMinutes = Math.max(0, result.totalWorkMinutes - legalLimit);

  // 深夜時間帯の計算
  const actualStartMin = checkInMin;
  const actualEndMin = checkOutMin;
  const totalNight = calcNightMinutes(actualStartMin, actualEndMin);

  // 休憩が深夜帯にかかる場合の補正（簡易: 休憩時間分を比例按分）
  let nightBreak = 0;
  if (pattern.breakStartTime && pattern.breakEndTime) {
    nightBreak = calcNightMinutes(
      timeToMinutes(pattern.breakStartTime),
      timeToMinutes(pattern.breakEndTime)
    );
  }
  const netNightMinutes = Math.max(0, totalNight - nightBreak);

  // 深夜のうち所定内
  result.nightScheduledMinutes = Math.min(netNightMinutes, result.scheduledWorkMinutes);
  // 深夜のうち所定外
  result.nightOvertimeMinutes = Math.max(0, netNightMinutes - result.nightScheduledMinutes);
  // 深夜のうち法定外
  result.nightLegalOvertimeMinutes = Math.min(result.nightOvertimeMinutes, result.legalOvertimeMinutes);

  return result;
}
