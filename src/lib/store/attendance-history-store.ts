import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
}

interface AttendanceHistoryActions {
  // 打刻記録の追加・更新
  addOrUpdateRecord: (record: Partial<AttendanceRecord>) => void;

  // 特定日の記録取得
  getRecordByDate: (date: string, userId?: string) => AttendanceRecord | undefined;

  // 期間指定で記録取得
  getRecordsByPeriod: (startDate: string, endDate: string, userId?: string) => AttendanceRecord[];

  // 月次記録取得
  getMonthlyRecords: (year: number, month: number, userId?: string) => AttendanceRecord[];

  // 出勤打刻
  checkIn: (workLocation: 'office' | 'home' | 'client' | 'other', userId: string, userName: string) => void;

  // 退勤打刻
  checkOut: (memo?: string, userId?: string) => void;

  // 休憩開始
  startBreak: (userId?: string) => void;

  // 休憩終了
  endBreak: (userId?: string) => void;

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
  deleteRecord: (id: string) => void;

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

// 現在のユーザー名を取得（デモ用）
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

      addOrUpdateRecord: (record) => {
        const now = new Date().toISOString();
        const userId = record.userId || getCurrentUserId();
        const date = record.date || new Date().toISOString().split('T')[0];

        set((state) => {
          const existingIndex = state.records.findIndex(
            r => r.userId === userId && r.date === date
          );

          if (existingIndex >= 0) {
            // 更新
            const updatedRecords = [...state.records];
            updatedRecords[existingIndex] = {
              ...updatedRecords[existingIndex],
              ...record,
              updatedAt: now,
            };
            return { records: updatedRecords };
          } else {
            // 新規追加
            const newRecord: AttendanceRecord = {
              id: `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              userId,
              userName: record.userName || getCurrentUserName(),
              date,
              checkIn: null,
              checkOut: null,
              breakStart: null,
              breakEnd: null,
              totalBreakMinutes: 0,
              workMinutes: 0,
              overtimeMinutes: 0,
              workLocation: 'office',
              status: 'present',
              createdAt: now,
              updatedAt: now,
              ...record,
            };
            return { records: [...state.records, newRecord] };
          }
        });
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

      checkIn: (workLocation, userId, userName) => {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const timeString = now.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        });

        // 遅刻判定（9:30以降）
        const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);

        set({
          currentCheckIn: {
            checkInTime: timeString,
            breakStartTime: null,
            workLocation
          }
        });

        get().addOrUpdateRecord({
          userId,
          userName,
          date,
          checkIn: timeString,
          workLocation,
          status: isLate ? 'late' : 'present',
          approvalStatus: isLate ? 'pending' : undefined,
          approvalReason: isLate ? '遅刻のため承認が必要です' : undefined,
        });
      },

      checkOut: (memo, userId) => {
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

          get().addOrUpdateRecord({
            userId: targetUserId,
            date,
            checkOut: timeString,
            workMinutes,
            overtimeMinutes,
            memo,
            status: isEarly ? 'early' : todayRecord.status,
            approvalStatus: isEarly ? 'pending' : todayRecord.approvalStatus,
            approvalReason: isEarly ? '早退のため承認が必要です' : todayRecord.approvalReason,
          });

          set({ currentCheckIn: null });
        }
      },

      startBreak: (userId) => {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const timeString = now.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const targetUserId = userId || getCurrentUserId();

        set((state) => ({
          currentCheckIn: state.currentCheckIn ? {
            ...state.currentCheckIn,
            breakStartTime: timeString
          } : null
        }));

        get().addOrUpdateRecord({
          userId: targetUserId,
          date,
          breakStart: timeString,
        });
      },

      endBreak: (userId) => {
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

          set((state) => ({
            currentCheckIn: state.currentCheckIn ? {
              ...state.currentCheckIn,
              breakStartTime: null
            } : null
          }));

          get().addOrUpdateRecord({
            userId: targetUserId,
            date,
            breakEnd: timeString,
            totalBreakMinutes: (todayRecord.totalBreakMinutes || 0) + breakMinutes,
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

      deleteRecord: (id) => {
        set((state) => ({
          records: state.records.filter(r => r.id !== id)
        }));
      },

      clearAllRecords: () => {
        set({ records: [], currentCheckIn: null });
      },
    }),
    {
      name: 'attendance-history-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);