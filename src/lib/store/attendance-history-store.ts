import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getTenantIdFromCookie } from '@/lib/utils/tenant';

// REST API helper functions
const API_BASE = '/api/attendance';

async function apiFetchAttendanceRecords(userId: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams({ tenantId: getTenantIdFromCookie(), userId });
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const response = await fetch(`${API_BASE}?${params}`);
  if (!response.ok) {
    throw new Error('勤怠記録の取得に失敗しました');
  }
  const result = await response.json();
  return result.data || [];
}

async function apiUpsertAttendanceRecord(record: Record<string, unknown>) {
  const params = new URLSearchParams({ tenantId: getTenantIdFromCookie() });
  const response = await fetch(`${API_BASE}/upsert?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!response.ok) {
    throw new Error('勤怠記録の保存に失敗しました');
  }
  const result = await response.json();
  return result.data;
}

async function apiDeleteAttendanceRecord(id: string) {
  const params = new URLSearchParams({ tenantId: getTenantIdFromCookie() });
  const response = await fetch(`${API_BASE}/${id}?${params}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('勤怠記録の削除に失敗しました');
  }
  return true;
}

/**
 * ISO日時文字列をHH:mm形式に変換
 * すでにHH:mm形式ならそのまま返す
 */
function formatTimeToHHmm(value: string | null | undefined): string | null {
  if (!value) return null;
  // すでにHH:mm形式の場合はそのまま
  if (/^\d{1,2}:\d{2}$/.test(value)) return value;
  // ISO形式の場合は変換
  try {
    return new Date(value).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

/**
 * ISO日付文字列をYYYY-MM-DD形式に変換
 */
function formatDateToYMD(value: string | null | undefined): string {
  if (!value) return new Date().toISOString().split('T')[0];
  // すでにYYYY-MM-DD形式の場合はそのまま
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  // ISO形式の場合は変換
  return value.split('T')[0];
}

/**
 * APIレスポンスのレコードを正規化（日付・時刻フォーマット統一）
 */
function normalizeApiRecord(record: Record<string, unknown>): Record<string, unknown> {
  return {
    ...record,
    date: formatDateToYMD(record.date as string),
    checkIn: formatTimeToHHmm(record.checkIn as string | null),
    checkOut: formatTimeToHHmm(record.checkOut as string | null),
    breakStart: formatTimeToHHmm(record.breakStart as string | null),
    breakEnd: formatTimeToHHmm(record.breakEnd as string | null),
  };
}

// 打刻種別
export type PunchType = 'check_in' | 'check_out' | 'break_start' | 'break_end';

// 打刻方法
export type PunchMethod = 'manual' | 'web' | 'mobile' | 'ic_card' | 'biometric';

// 打刻履歴レコード（P.2 複数打刻の履歴保存）
export interface PunchRecord {
  id: string;
  type: PunchType;
  time: string; // HH:mm形式
  method: PunchMethod;
  location?: 'office' | 'home' | 'client' | 'other';
  note?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD形式
  checkIn: string | null;
  checkOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  totalBreakMinutes: number;
  workMinutes: number;
  overtimeMinutes: number;
  workLocation: 'office' | 'home' | 'client' | 'other';
  status: 'present' | 'absent' | 'holiday' | 'leave' | 'late' | 'early';
  memo?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalReason?: string;
  // 打刻履歴（P.2 複数打刻の履歴保存）
  punchHistory?: PunchRecord[];
  createdAt: string;
  updatedAt: string;
}

interface AttendanceHistoryState {
  records: AttendanceRecord[];
  currentCheckIn: {
    checkInTime: string | null;
    breakStartTime: string | null;
    workLocation: 'office' | 'home' | 'client' | 'other';
  } | null;
  isLoading: boolean;
  error: string | null;
}

interface AttendanceHistoryActions {
  // APIから勤怠記録を取得
  fetchRecords: (userId: string, startDate?: string, endDate?: string) => Promise<void>;

  // 打刻記録の追加・更新
  addOrUpdateRecord: (record: Partial<AttendanceRecord>) => Promise<void>;

  // 特定日の記録取得
  getRecordByDate: (date: string, userId?: string) => AttendanceRecord | undefined;

  // 期間指定で記録取得
  getRecordsByPeriod: (startDate: string, endDate: string, userId?: string) => AttendanceRecord[];

  // 月次記録取得
  getMonthlyRecords: (year: number, month: number, userId?: string) => AttendanceRecord[];

  // 出勤打刻
  checkIn: (workLocation: 'office' | 'home' | 'client' | 'other', userId: string, userName: string) => Promise<void>;

  // 退勤打刻
  checkOut: (memo?: string, userId?: string) => Promise<void>;

  // 休憩開始
  startBreak: (userId?: string) => Promise<void>;

  // 休憩終了
  endBreak: (userId?: string) => Promise<void>;

  // 今日の状態取得
  getTodayStatus: (userId?: string) => {
    isWorking: boolean;
    isOnBreak: boolean;
    record: AttendanceRecord | undefined;
  };

  // 月次統計取得
  getMonthlyStats: (year: number, month: number, userId?: string) => {
    totalWorkDays: number;
    totalWorkHours: number;
    totalOvertimeHours: number;
    averageWorkHours: number;
    lateCount: number;
    earlyLeaveCount: number;
  };

  // 記録削除
  deleteRecord: (id: string) => Promise<void>;

  // 全記録削除
  clearAllRecords: () => void;
}

type AttendanceHistoryStore = AttendanceHistoryState & AttendanceHistoryActions;

// 現在のユーザーIDを取得（デモ用）
const getCurrentUserId = () => {
  if (typeof window === 'undefined') return 'demo-user-1';

  try {
    const userStore = JSON.parse(localStorage.getItem('user-store') || '{}');
    return userStore?.state?.currentUser?.id || 'demo-user-1';
  } catch {
    return 'demo-user-1';
  }
};

// 現在のユーザー名を取得（デモ用）- 将来的にAPI連携で使用予定
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getCurrentUserName = () => {
  if (typeof window === 'undefined') return 'デモユーザー';

  try {
    const userStore = JSON.parse(localStorage.getItem('user-store') || '{}');
    return userStore?.state?.currentUser?.name || 'デモユーザー';
  } catch {
    return 'デモユーザー';
  }
};

export const useAttendanceHistoryStore = create<AttendanceHistoryStore>()(
  persist(
    (set, get) => ({
      records: [],
      currentCheckIn: null,
      isLoading: false,
      error: null,

      fetchRecords: async (userId, startDate, endDate) => {
        set({ isLoading: true, error: null });
        try {
          const records = await apiFetchAttendanceRecords(userId, startDate, endDate);
          // APIレスポンスの日時フォーマットを正規化
          const normalizedRecords = records.map((r: Record<string, unknown>) => normalizeApiRecord(r));
          set({ records: normalizedRecords, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '勤怠記録の取得に失敗しました';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      addOrUpdateRecord: async (record) => {
        set({ isLoading: true, error: null });
        try {
          const userId = record.userId || getCurrentUserId();
          const date = record.date || new Date().toISOString().split('T')[0];

          // REST APIでupsert
          const existingRecord = get().records.find(
            r => r.userId === userId && r.date === date
          );

          // 打刻履歴のマージ（既存 + 新規）
          const existingPunchHistory = existingRecord?.punchHistory || [];
          const newPunchHistory = record.punchHistory || [];
          const mergedPunchHistory = [...existingPunchHistory, ...newPunchHistory];

          const recordToUpsert = {
            userId,
            date,
            checkIn: record.checkIn !== undefined ? record.checkIn : (existingRecord?.checkIn || null),
            checkOut: record.checkOut !== undefined ? record.checkOut : (existingRecord?.checkOut || null),
            breakStart: record.breakStart !== undefined ? record.breakStart : (existingRecord?.breakStart || null),
            breakEnd: record.breakEnd !== undefined ? record.breakEnd : (existingRecord?.breakEnd || null),
            totalBreakMinutes: record.totalBreakMinutes !== undefined ? record.totalBreakMinutes : (existingRecord?.totalBreakMinutes || 0),
            workMinutes: record.workMinutes !== undefined ? record.workMinutes : (existingRecord?.workMinutes || 0),
            overtimeMinutes: record.overtimeMinutes !== undefined ? record.overtimeMinutes : (existingRecord?.overtimeMinutes || 0),
            workLocation: record.workLocation || existingRecord?.workLocation || 'office',
            status: record.status || existingRecord?.status || 'present',
            memo: record.memo,
            approvalStatus: record.approvalStatus,
            approvalReason: record.approvalReason,
            punchHistory: mergedPunchHistory.length > 0 ? mergedPunchHistory : undefined,
          };

          const upsertedRecord = await apiUpsertAttendanceRecord(recordToUpsert);
          // APIレスポンスの日時フォーマットを正規化
          const normalizedRecord = normalizeApiRecord(upsertedRecord);

          // ローカルステートも更新
          set((state) => {
            const existingIndex = state.records.findIndex(
              r => r.userId === userId && r.date === date
            );

            if (existingIndex >= 0) {
              const updatedRecords = [...state.records];
              updatedRecords[existingIndex] = normalizedRecord as unknown as AttendanceRecord;
              return { records: updatedRecords, isLoading: false };
            } else {
              return { records: [...state.records, normalizedRecord as unknown as AttendanceRecord], isLoading: false };
            }
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '勤怠記録の保存に失敗しました';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      getRecordByDate: (date, userId) => {
        const targetUserId = userId || getCurrentUserId();
        return get().records.find(r => r.userId === targetUserId && r.date === date);
      },

      getRecordsByPeriod: (startDate, endDate, userId) => {
        const targetUserId = userId || getCurrentUserId();
        return get().records.filter(r =>
          r.userId === targetUserId &&
          r.date >= startDate &&
          r.date <= endDate
        ).sort((a, b) => a.date.localeCompare(b.date));
      },

      getMonthlyRecords: (year, month, userId) => {
        const targetUserId = userId || getCurrentUserId();
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

        return get().getRecordsByPeriod(startDate, endDate, targetUserId);
      },

      checkIn: async (workLocation, userId, userName) => {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const timeString = now.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        });

        // 遅刻判定（9:30以降）
        const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);

        // 打刻履歴レコード作成
        const punchRecord: PunchRecord = {
          id: `punch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'check_in',
          time: timeString,
          method: 'web',
          location: workLocation,
          createdAt: now.toISOString(),
        };

        set({
          currentCheckIn: {
            checkInTime: timeString,
            breakStartTime: null,
            workLocation
          }
        });

        await get().addOrUpdateRecord({
          userId,
          userName,
          date,
          checkIn: timeString,
          workLocation,
          status: isLate ? 'late' : 'present',
          approvalStatus: isLate ? 'pending' : undefined,
          approvalReason: isLate ? '遅刻のため承認が必要です' : undefined,
          punchHistory: [punchRecord],
        });
      },

      checkOut: async (memo, userId) => {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const timeString = now.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const targetUserId = userId || getCurrentUserId();
        const todayRecord = get().getRecordByDate(date, targetUserId);

        if (todayRecord && todayRecord.checkIn) {
          // 勤務時間計算
          const checkInTime = new Date(`${date} ${todayRecord.checkIn}`);
          const checkOutTime = new Date(`${date} ${timeString}`);
          const workMinutes = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 60000) - todayRecord.totalBreakMinutes;
          const overtimeMinutes = Math.max(0, workMinutes - 480); // 8時間以上を残業

          // 早退判定（18:00前）
          const isEarly = now.getHours() < 18;

          // 打刻履歴レコード作成
          const punchRecord: PunchRecord = {
            id: `punch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'check_out',
            time: timeString,
            method: 'web',
            location: todayRecord.workLocation,
            note: memo,
            createdAt: now.toISOString(),
          };

          await get().addOrUpdateRecord({
            userId: targetUserId,
            date,
            checkOut: timeString,
            workMinutes,
            overtimeMinutes,
            memo,
            status: isEarly ? 'early' : todayRecord.status,
            approvalStatus: isEarly ? 'pending' : todayRecord.approvalStatus,
            approvalReason: isEarly ? '早退のため承認が必要です' : todayRecord.approvalReason,
            punchHistory: [punchRecord],
          });

          set({ currentCheckIn: null });
        }
      },

      startBreak: async (userId) => {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const timeString = now.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const targetUserId = userId || getCurrentUserId();
        const todayRecord = get().getRecordByDate(date, targetUserId);

        // 打刻履歴レコード作成
        const punchRecord: PunchRecord = {
          id: `punch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'break_start',
          time: timeString,
          method: 'web',
          location: todayRecord?.workLocation,
          createdAt: now.toISOString(),
        };

        set((state) => ({
          currentCheckIn: state.currentCheckIn ? {
            ...state.currentCheckIn,
            breakStartTime: timeString
          } : null
        }));

        await get().addOrUpdateRecord({
          userId: targetUserId,
          date,
          breakStart: timeString,
          punchHistory: [punchRecord],
        });
      },

      endBreak: async (userId) => {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const timeString = now.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const targetUserId = userId || getCurrentUserId();
        const todayRecord = get().getRecordByDate(date, targetUserId);

        if (todayRecord && todayRecord.breakStart) {
          // 休憩時間計算
          const breakStartTime = new Date(`${date} ${todayRecord.breakStart}`);
          const breakEndTime = new Date(`${date} ${timeString}`);
          const breakMinutes = Math.floor((breakEndTime.getTime() - breakStartTime.getTime()) / 60000);

          // 打刻履歴レコード作成
          const punchRecord: PunchRecord = {
            id: `punch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'break_end',
            time: timeString,
            method: 'web',
            location: todayRecord.workLocation,
            createdAt: now.toISOString(),
          };

          set((state) => ({
            currentCheckIn: state.currentCheckIn ? {
              ...state.currentCheckIn,
              breakStartTime: null
            } : null
          }));

          await get().addOrUpdateRecord({
            userId: targetUserId,
            date,
            breakEnd: timeString,
            totalBreakMinutes: (todayRecord.totalBreakMinutes || 0) + breakMinutes,
            punchHistory: [punchRecord],
          });
        }
      },

      getTodayStatus: (userId) => {
        const today = new Date().toISOString().split('T')[0];
        const targetUserId = userId || getCurrentUserId();
        const record = get().getRecordByDate(today, targetUserId);
        const currentCheckIn = get().currentCheckIn;

        return {
          isWorking: !!record?.checkIn && !record?.checkOut,
          isOnBreak: !!currentCheckIn?.breakStartTime,
          record,
        };
      },

      getMonthlyStats: (year, month, userId) => {
        const records = get().getMonthlyRecords(year, month, userId);

        const stats = records.reduce((acc, record) => {
          if (record.status === 'present' || record.status === 'late' || record.status === 'early') {
            acc.totalWorkDays++;
            acc.totalWorkMinutes += record.workMinutes;
            acc.totalOvertimeMinutes += record.overtimeMinutes;
            if (record.status === 'late') acc.lateCount++;
            if (record.status === 'early') acc.earlyLeaveCount++;
          }
          return acc;
        }, {
          totalWorkDays: 0,
          totalWorkMinutes: 0,
          totalOvertimeMinutes: 0,
          lateCount: 0,
          earlyLeaveCount: 0,
        });

        return {
          totalWorkDays: stats.totalWorkDays,
          totalWorkHours: Math.round(stats.totalWorkMinutes / 60 * 10) / 10,
          totalOvertimeHours: Math.round(stats.totalOvertimeMinutes / 60 * 10) / 10,
          averageWorkHours: stats.totalWorkDays > 0
            ? Math.round(stats.totalWorkMinutes / stats.totalWorkDays / 60 * 10) / 10
            : 0,
          lateCount: stats.lateCount,
          earlyLeaveCount: stats.earlyLeaveCount,
        };
      },

      deleteRecord: async (id) => {
        set({ isLoading: true, error: null });
        try {
          // REST APIから削除
          await apiDeleteAttendanceRecord(id);

          // ローカルステートからも削除
          set((state) => ({
            records: state.records.filter(r => r.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '勤怠記録の削除に失敗しました';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      clearAllRecords: () => {
        set({ records: [], currentCheckIn: null });
      },
    }),
    {
      name: 'attendance-history-store',
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
    }
  )
);