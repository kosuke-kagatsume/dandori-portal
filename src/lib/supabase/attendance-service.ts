import { createClient } from './client';
import type { Database } from '@/types/database.types';
import type { AttendanceRecord } from '@/lib/store/attendance-history-store';

type DbAttendanceRecord = Database['public']['Tables']['attendance_records']['Row'];
type DbAttendanceInsert = Database['public']['Tables']['attendance_records']['Insert'];
type DbAttendanceUpdate = Database['public']['Tables']['attendance_records']['Update'];

/**
 * Supabase attendance_recordsテーブルのRow型からアプリケーションのAttendanceRecord型への変換
 */
export function dbAttendanceToApp(
  dbRecord: DbAttendanceRecord,
  userName: string = '不明'
): AttendanceRecord {
  // DBはwork_hours/overtime_hours（時間単位）、アプリはworkMinutes/overtimeMinutes（分単位）
  const workMinutes = dbRecord.work_hours ? Math.round(dbRecord.work_hours * 60) : 0;
  const overtimeMinutes = dbRecord.overtime_hours ? Math.round(dbRecord.overtime_hours * 60) : 0;

  // DBはlocation (string | null)、アプリはworkLocation (enum)
  const workLocation = (dbRecord.location || 'office') as 'office' | 'home' | 'client' | 'other';

  // DBはstatus (string)、アプリはstatus (enum)
  const status = dbRecord.status as 'present' | 'absent' | 'holiday' | 'leave' | 'late' | 'early';

  // totalBreakMinutesの計算（break_start と break_end から）
  let totalBreakMinutes = 0;
  if (dbRecord.break_start && dbRecord.break_end) {
    const breakStart = new Date(`${dbRecord.date}T${dbRecord.break_start}`);
    const breakEnd = new Date(`${dbRecord.date}T${dbRecord.break_end}`);
    totalBreakMinutes = Math.floor((breakEnd.getTime() - breakStart.getTime()) / 60000);
  }

  return {
    id: dbRecord.id,
    userId: dbRecord.user_id,
    userName,
    date: dbRecord.date,
    checkIn: dbRecord.check_in,
    checkOut: dbRecord.check_out,
    breakStart: dbRecord.break_start,
    breakEnd: dbRecord.break_end,
    totalBreakMinutes,
    workMinutes,
    overtimeMinutes,
    workLocation,
    status,
    memo: dbRecord.notes || undefined,
    // approvalStatus/approvalReasonはDBに保存されていないのでundefined
    approvalStatus: undefined,
    approvalReason: undefined,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
  };
}

/**
 * アプリケーションのAttendanceRecord型からSupabase Insert型への変換
 */
export function appAttendanceToDbInsert(
  record: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt' | 'userName' | 'totalBreakMinutes'>
): DbAttendanceInsert {
  // 分単位→時間単位に変換
  const work_hours = record.workMinutes ? record.workMinutes / 60 : null;
  const overtime_hours = record.overtimeMinutes ? record.overtimeMinutes / 60 : null;

  return {
    user_id: record.userId,
    date: record.date,
    check_in: record.checkIn,
    check_out: record.checkOut,
    break_start: record.breakStart,
    break_end: record.breakEnd,
    work_hours,
    overtime_hours,
    status: record.status,
    location: record.workLocation,
    notes: record.memo || null,
  };
}

/**
 * アプリケーションのPartial<AttendanceRecord>型からSupabase Update型への変換
 */
export function appAttendanceToDbUpdate(updates: Partial<AttendanceRecord>): DbAttendanceUpdate {
  const dbUpdate: DbAttendanceUpdate = {};

  if (updates.userId !== undefined) dbUpdate.user_id = updates.userId;
  if (updates.date !== undefined) dbUpdate.date = updates.date;
  if (updates.checkIn !== undefined) dbUpdate.check_in = updates.checkIn;
  if (updates.checkOut !== undefined) dbUpdate.check_out = updates.checkOut;
  if (updates.breakStart !== undefined) dbUpdate.break_start = updates.breakStart;
  if (updates.breakEnd !== undefined) dbUpdate.break_end = updates.breakEnd;
  if (updates.workMinutes !== undefined) {
    dbUpdate.work_hours = updates.workMinutes / 60;
  }
  if (updates.overtimeMinutes !== undefined) {
    dbUpdate.overtime_hours = updates.overtimeMinutes / 60;
  }
  if (updates.status !== undefined) dbUpdate.status = updates.status;
  if (updates.workLocation !== undefined) dbUpdate.location = updates.workLocation;
  if (updates.memo !== undefined) dbUpdate.notes = updates.memo || null;

  return dbUpdate;
}

/**
 * 勤怠記録を取得（ユーザーID・期間指定）
 */
export async function fetchAttendanceRecords(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceRecord[]> {
  const supabase = createClient();

  let query = supabase
    .from('attendance_records')
    .select('*')
    .eq('user_id', userId);

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query.order('date', { ascending: false });

  if (error) {
    console.error('Failed to fetch attendance records:', error);
    throw new Error(`勤怠記録の取得に失敗しました: ${error.message}`);
  }

  // ユーザー名の取得（簡略化: 後で users テーブルから取得可能）
  return (data || []).map(dbRecord => dbAttendanceToApp(dbRecord, '不明'));
}

/**
 * 今日の勤怠記録を取得
 */
export async function fetchTodayAttendanceRecord(userId: string): Promise<AttendanceRecord | null> {
  const today = new Date().toISOString().split('T')[0];
  const supabase = createClient();

  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Failed to fetch today attendance record:', error);
    throw new Error(`本日の勤怠記録の取得に失敗しました: ${error.message}`);
  }

  return dbAttendanceToApp(data, '不明');
}

/**
 * 特定日の勤怠記録を取得
 */
export async function fetchAttendanceRecordByDate(
  userId: string,
  date: string
): Promise<AttendanceRecord | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Failed to fetch attendance record:', error);
    throw new Error(`勤怠記録の取得に失敗しました: ${error.message}`);
  }

  return dbAttendanceToApp(data, '不明');
}

/**
 * 勤怠記録を作成
 */
export async function createAttendanceRecord(
  record: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt' | 'userName' | 'totalBreakMinutes'>
): Promise<AttendanceRecord> {
  const supabase = createClient();

  const dbRecord = appAttendanceToDbInsert(record);

  const { data, error } = await supabase
    .from('attendance_records')
    .insert(dbRecord)
    .select()
    .single();

  if (error) {
    console.error('Failed to create attendance record:', error);
    throw new Error(`勤怠記録の作成に失敗しました: ${error.message}`);
  }

  return dbAttendanceToApp(data, '不明');
}

/**
 * 勤怠記録を更新
 */
export async function updateAttendanceRecord(
  id: string,
  updates: Partial<AttendanceRecord>
): Promise<AttendanceRecord> {
  const supabase = createClient();

  const dbUpdate = appAttendanceToDbUpdate(updates);

  const { data, error } = await supabase
    .from('attendance_records')
    .update(dbUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update attendance record:', error);
    throw new Error(`勤怠記録の更新に失敗しました: ${error.message}`);
  }

  return dbAttendanceToApp(data, '不明');
}

/**
 * 勤怠記録を削除
 */
export async function deleteAttendanceRecord(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('attendance_records')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete attendance record:', error);
    throw new Error(`勤怠記録の削除に失敗しました: ${error.message}`);
  }
}

/**
 * ユーザーIDと日付で勤怠記録を作成または更新（upsert）
 */
export async function upsertAttendanceRecord(
  record: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt' | 'userName' | 'totalBreakMinutes'>
): Promise<AttendanceRecord> {
  const supabase = createClient();

  const dbRecord = appAttendanceToDbInsert(record);

  const { data, error } = await supabase
    .from('attendance_records')
    .upsert(dbRecord, {
      onConflict: 'user_id,date',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to upsert attendance record:', error);
    throw new Error(`勤怠記録の作成/更新に失敗しました: ${error.message}`);
  }

  return dbAttendanceToApp(data, '不明');
}

/**
 * 月次勤怠記録を取得
 */
export async function fetchMonthlyAttendanceRecords(
  userId: string,
  year: number,
  month: number
): Promise<AttendanceRecord[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  return fetchAttendanceRecords(userId, startDate, endDate);
}
