import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getCurrentLocation } from './geolocation';
import { attendanceAudit } from '@/lib/audit/audit-logger';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  dayOfWeek: string;
  checkIn?: string;
  checkInLocation?: LocationData;
  checkOut?: string;
  checkOutLocation?: LocationData;
  breakTime: string;
  workHours: number;
  overtime: number;
  status: 'present' | 'absent' | 'remote' | 'late' | 'early_leave';
  workType: 'office' | 'remote' | 'hybrid';
  workLocation: 'office' | 'home' | 'client' | 'other';
  note?: string;
  needsApproval?: boolean;
  approvalReason?: string;
}

export interface TodayAttendanceStatus {
  status: 'notStarted' | 'working' | 'onBreak' | 'finished';
  checkIn?: string;
  checkInLocation?: LocationData;
  checkOut?: string;
  checkOutLocation?: LocationData;
  breakStart?: string;
  breakEnd?: string;
  totalBreakTime: number;
  workLocation: 'office' | 'home' | 'client' | 'other';
  memo?: string;
  needsApproval?: boolean;
  approvalReason?: string;
  // 日付変更検出用
  recordDate?: string;
  // ユーザー識別用（同一PC複数ユーザー対応）
  userId?: string;
  // APIから取得したレコードID
  attendanceRecordId?: string;
}

interface AttendanceStore {
  // 今日の打刻状況
  todayStatus: TodayAttendanceStatus;

  // 勤怠記録の更新
  updateTodayStatus: (status: Partial<TodayAttendanceStatus>) => void;

  // 出勤打刻
  checkIn: (workLocation: 'office' | 'home' | 'client' | 'other') => Promise<void>;

  // 休憩開始
  startBreak: () => Promise<void>;

  // 休憩終了
  endBreak: () => Promise<void>;

  // 退勤打刻
  checkOut: (memo?: string) => Promise<void>;

  // 今日の勤怠記録を取得
  getTodayRecord: () => AttendanceRecord | null;

  // 日付変更をチェックしてリセット
  checkAndResetForNewDay: () => void;

  // ユーザー変更をチェックしてリセット（同一PC複数ユーザー対応）
  checkAndResetForUserChange: (userId: string) => void;

  // 手動リセット（デバッグ/テスト用）
  resetTodayStatus: () => void;

  // 勤怠記録リストの更新通知
  onAttendanceUpdate: (() => void) | null;
  setOnAttendanceUpdate: (callback: () => void) => void;

  // APIから今日の勤怠を取得してストアを同期
  syncTodayFromApi: (userId: string, tenantId: string) => Promise<void>;
}

// 今日の日付を取得（YYYY-MM-DD形式）
const getTodayDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// 初期状態
const getInitialTodayStatus = (): TodayAttendanceStatus => ({
  status: 'notStarted',
  totalBreakTime: 0,
  workLocation: 'office',
  recordDate: getTodayDateString(),
});

// API呼び出し用ヘルパー
const attendanceApi = {
  // 今日の勤怠を取得
  async getTodayAttendance(userId: string, _tenantId: string) {
    const today = getTodayDateString();
    const response = await fetch(
      `/api/attendance?userId=${userId}&startDate=${today}&endDate=${today}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );
    if (!response.ok) {
      throw new Error('Failed to fetch attendance');
    }
    const result = await response.json();
    return result.data?.[0] || null;
  },

  // 出勤打刻（新規作成）
  async checkIn(params: {
    userId: string;
    tenantId: string;
    date: string;
    checkIn: string;
    workLocation: string;
    status: string;
    approvalStatus?: string;
    approvalReason?: string;
  }) {
    const response = await fetch('/api/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      throw new Error('Failed to check in');
    }
    return response.json();
  },

  // 勤怠更新（休憩開始/終了、退勤）
  async updateAttendance(id: string, data: Record<string, unknown>) {
    const response = await fetch(`/api/attendance/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update attendance');
    }
    return response.json();
  },
};

export const useAttendanceStore = create<AttendanceStore>()(
  persist(
    (set, get) => ({
      todayStatus: getInitialTodayStatus(),

      onAttendanceUpdate: null,

      setOnAttendanceUpdate: (callback) => {
        set({ onAttendanceUpdate: callback });
      },

      // APIから今日の勤怠を取得してストアを同期
      syncTodayFromApi: async (userId: string, tenantId: string) => {
        try {
          const attendance = await attendanceApi.getTodayAttendance(userId, tenantId);
          if (attendance) {
            // APIのデータからストアの状態を復元
            let status: TodayAttendanceStatus['status'] = 'notStarted';
            if (attendance.checkOut) {
              status = 'finished';
            } else if (attendance.breakStart && !attendance.breakEnd) {
              status = 'onBreak';
            } else if (attendance.checkIn) {
              status = 'working';
            }

            set({
              todayStatus: {
                status,
                checkIn: attendance.checkIn
                  ? new Date(attendance.checkIn).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : undefined,
                checkOut: attendance.checkOut
                  ? new Date(attendance.checkOut).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : undefined,
                breakStart: attendance.breakStart
                  ? new Date(attendance.breakStart).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : undefined,
                breakEnd: attendance.breakEnd
                  ? new Date(attendance.breakEnd).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : undefined,
                totalBreakTime: attendance.totalBreakMinutes || 0,
                workLocation: attendance.workLocation || 'office',
                memo: attendance.memo,
                needsApproval: attendance.approvalStatus === 'pending',
                approvalReason: attendance.approvalReason,
                recordDate: getTodayDateString(),
                userId,
                attendanceRecordId: attendance.id,
              },
            });
          } else {
            // 今日のレコードがない場合は初期状態
            set({
              todayStatus: {
                ...getInitialTodayStatus(),
                userId,
              },
            });
          }
        } catch (error) {
          console.error('[AttendanceStore] Failed to sync from API:', error);
        }
      },

      // 日付変更をチェックしてリセット
      checkAndResetForNewDay: () => {
        const { todayStatus } = get();
        const today = getTodayDateString();

        // recordDateが設定されていない、または日付が変わっている場合はリセット
        if (!todayStatus.recordDate || todayStatus.recordDate !== today) {
          console.log('[AttendanceStore] 日付変更を検出。本日の勤怠状況をリセットします。');
          set({ todayStatus: getInitialTodayStatus() });
        }
      },

      // ユーザー変更をチェックしてリセット（同一PC複数ユーザー対応）
      checkAndResetForUserChange: (userId: string) => {
        const { todayStatus } = get();

        // userIdが設定されていない、またはユーザーが変わっている場合はリセット
        if (todayStatus.userId && todayStatus.userId !== userId) {
          console.log('[AttendanceStore] ユーザー変更を検出。勤怠状況をリセットします。');
          set({ todayStatus: { ...getInitialTodayStatus(), userId } });
        } else if (!todayStatus.userId) {
          // userIdが未設定の場合は設定のみ
          set((state) => ({
            todayStatus: { ...state.todayStatus, userId }
          }));
        }
      },

      // 手動リセット
      resetTodayStatus: () => {
        set({ todayStatus: getInitialTodayStatus() });
      },

      updateTodayStatus: (status) => {
        set((state) => ({
          todayStatus: { ...state.todayStatus, ...status }
        }));
      },

      checkIn: async (workLocation) => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        });

        // 遅刻判定（9:30以降を遅刻とする）
        const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);

        // 位置情報を取得（非同期だがエラーは無視）
        let locationData: LocationData | undefined;
        try {
          const locationResult = await getCurrentLocation();
          if (locationResult.success && locationResult.location) {
            locationData = locationResult.location;
          }
        } catch (error) {
          console.warn('Failed to get location for check-in:', error);
        }

        const { todayStatus } = get();
        const userId = todayStatus.userId;
        const tenantId = 'tenant-006'; // TODO: 動的に取得

        // APIに出勤を記録
        let attendanceRecordId: string | undefined;
        if (userId) {
          try {
            const today = getTodayDateString();
            const checkInDateTime = new Date(`${today}T${timeString}:00`);

            const result = await attendanceApi.checkIn({
              userId,
              tenantId,
              date: today,
              checkIn: checkInDateTime.toISOString(),
              workLocation,
              status: isLate ? 'late' : (workLocation === 'home' ? 'remote' : 'present'),
              approvalStatus: isLate ? 'pending' : undefined,
              approvalReason: isLate ? '遅刻のため承認が必要です' : undefined,
            });
            attendanceRecordId = result.data?.id;
          } catch (error) {
            console.error('[AttendanceStore] Failed to check in via API:', error);
            // APIエラーでも状態は更新（オフライン対応のため）
          }
        }

        set((state) => ({
          todayStatus: {
            ...state.todayStatus,
            status: 'working',
            checkIn: timeString,
            checkInLocation: locationData,
            workLocation,
            needsApproval: isLate,
            approvalReason: isLate ? '遅刻のため承認が必要です' : undefined,
            recordDate: getTodayDateString(),
            attendanceRecordId,
          }
        }));

        // 監査ログ記録
        const today = new Date().toLocaleDateString('ja-JP');
        attendanceAudit.checkIn(today);

        // 勤怠一覧の更新を通知
        const { onAttendanceUpdate } = get();
        if (onAttendanceUpdate) {
          onAttendanceUpdate();
        }
      },

      startBreak: async () => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const { todayStatus } = get();
        const attendanceRecordId = todayStatus.attendanceRecordId;

        // APIに休憩開始を記録
        if (attendanceRecordId) {
          try {
            const today = getTodayDateString();
            const breakStartDateTime = new Date(`${today}T${timeString}:00`);
            await attendanceApi.updateAttendance(attendanceRecordId, {
              breakStart: breakStartDateTime.toISOString(),
            });
          } catch (error) {
            console.error('[AttendanceStore] Failed to start break via API:', error);
          }
        }

        set((state) => ({
          todayStatus: {
            ...state.todayStatus,
            status: 'onBreak',
            breakStart: timeString,
          }
        }));
      },

      endBreak: async () => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const state = get();
        let additionalBreakTime = 0;

        if (state.todayStatus.breakStart) {
          const start = new Date(`2024-01-01 ${state.todayStatus.breakStart}`);
          const end = new Date(`2024-01-01 ${timeString}`);
          additionalBreakTime = (end.getTime() - start.getTime()) / 1000 / 60; // minutes
        }

        const totalBreakTime = state.todayStatus.totalBreakTime + additionalBreakTime;
        const attendanceRecordId = state.todayStatus.attendanceRecordId;

        // APIに休憩終了を記録
        if (attendanceRecordId) {
          try {
            const today = getTodayDateString();
            const breakEndDateTime = new Date(`${today}T${timeString}:00`);
            await attendanceApi.updateAttendance(attendanceRecordId, {
              breakEnd: breakEndDateTime.toISOString(),
              totalBreakMinutes: Math.floor(totalBreakTime),
            });
          } catch (error) {
            console.error('[AttendanceStore] Failed to end break via API:', error);
          }
        }

        set((prevState) => ({
          todayStatus: {
            ...prevState.todayStatus,
            status: 'working',
            breakEnd: timeString,
            totalBreakTime,
          }
        }));
      },

      checkOut: async (memo) => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        });

        // 早退判定（17:00前を早退とする）
        const isEarlyLeave = now.getHours() < 17;

        // 位置情報を取得（非同期だがエラーは無視）
        let locationData: LocationData | undefined;
        try {
          const locationResult = await getCurrentLocation();
          if (locationResult.success && locationResult.location) {
            locationData = locationResult.location;
          }
        } catch (error) {
          console.warn('Failed to get location for check-out:', error);
        }

        const state = get();
        const attendanceRecordId = state.todayStatus.attendanceRecordId;

        // 勤務時間計算
        let workMinutes = 0;
        let overtimeMinutes = 0;
        if (state.todayStatus.checkIn) {
          const checkIn = new Date(`2024-01-01 ${state.todayStatus.checkIn}`);
          const checkOut = new Date(`2024-01-01 ${timeString}`);
          const totalMinutes = (checkOut.getTime() - checkIn.getTime()) / 1000 / 60;
          workMinutes = Math.floor(totalMinutes - state.todayStatus.totalBreakTime);
          overtimeMinutes = Math.max(0, workMinutes - 480); // 8時間 = 480分
        }

        // APIに退勤を記録
        if (attendanceRecordId) {
          try {
            const today = getTodayDateString();
            const checkOutDateTime = new Date(`${today}T${timeString}:00`);
            await attendanceApi.updateAttendance(attendanceRecordId, {
              checkOut: checkOutDateTime.toISOString(),
              workMinutes,
              overtimeMinutes,
              memo,
              status: isEarlyLeave ? 'early_leave' : undefined,
              approvalStatus: isEarlyLeave ? 'pending' : undefined,
              approvalReason: isEarlyLeave ? '早退のため承認が必要です' : undefined,
            });
          } catch (error) {
            console.error('[AttendanceStore] Failed to check out via API:', error);
          }
        }

        set((prevState) => ({
          todayStatus: {
            ...prevState.todayStatus,
            status: 'finished',
            checkOut: timeString,
            checkOutLocation: locationData,
            memo,
            needsApproval: prevState.todayStatus.needsApproval || isEarlyLeave,
            approvalReason: isEarlyLeave ? '早退のため承認が必要です' : prevState.todayStatus.approvalReason,
          }
        }));

        // 監査ログ記録
        const today = new Date().toLocaleDateString('ja-JP');
        attendanceAudit.checkOut(today);

        // 勤怠一覧の更新を通知
        const { onAttendanceUpdate } = get();
        if (onAttendanceUpdate) {
          onAttendanceUpdate();
        }
      },

      getTodayRecord: () => {
        const state = get();
        const today = new Date();
        const dateString = `${today.getMonth() + 1}/${today.getDate()}`;
        const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][today.getDay()];

        if (state.todayStatus.status === 'notStarted') {
          return null;
        }

        // 勤務時間計算
        let workHours = 0;
        if (state.todayStatus.checkIn && state.todayStatus.checkOut) {
          const checkIn = new Date(`2024-01-01 ${state.todayStatus.checkIn}`);
          const checkOut = new Date(`2024-01-01 ${state.todayStatus.checkOut}`);
          const totalMinutes = (checkOut.getTime() - checkIn.getTime()) / 1000 / 60;
          workHours = (totalMinutes - state.todayStatus.totalBreakTime) / 60;
        }

        // ステータス判定
        let status: AttendanceRecord['status'] = 'present';
        if (state.todayStatus.workLocation === 'home') {
          status = 'remote';
        } else if (state.todayStatus.needsApproval) {
          const checkInTime = state.todayStatus.checkIn;
          const checkOutTime = state.todayStatus.checkOut;

          // 遅刻判定: 9:30以降の出勤
          const isLate = checkInTime && (() => {
            const [h, m] = checkInTime.split(':').map(Number);
            return h > 9 || (h === 9 && m > 30);
          })();

          // 早退判定: 17:00前の退勤
          const isEarlyLeave = checkOutTime && (() => {
            const [h] = checkOutTime.split(':').map(Number);
            return h < 17;
          })();

          if (isLate && isEarlyLeave) {
            status = 'late'; // 遅刻を優先
          } else if (isLate) {
            status = 'late';
          } else if (isEarlyLeave) {
            status = 'early_leave';
          }
        }

        return {
          id: state.todayStatus.attendanceRecordId || `today-${today.getDate()}`,
          userId: state.todayStatus.userId || '1',
          userName: '田中太郎',
          date: dateString,
          dayOfWeek,
          checkIn: state.todayStatus.checkIn,
          checkOut: state.todayStatus.checkOut,
          breakTime: `${Math.floor(state.todayStatus.totalBreakTime)}分`,
          workHours: Math.max(0, workHours),
          overtime: Math.max(0, workHours - 8),
          status,
          workType: state.todayStatus.workLocation === 'home' ? 'remote' as const : 'office' as const,
          workLocation: state.todayStatus.workLocation,
          note: state.todayStatus.memo,
          needsApproval: state.todayStatus.needsApproval,
          approvalReason: state.todayStatus.approvalReason,
        };
      },
    }),
    {
      name: 'attendance-store',
      skipHydration: true,
      // 今日の日付が変わったらリセット
      partialize: (state) => {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('attendance-store-date');

        if (stored !== today) {
          localStorage.setItem('attendance-store-date', today);
          return {
            todayStatus: {
              status: 'notStarted',
              totalBreakTime: 0,
              workLocation: 'office',
            },
            onAttendanceUpdate: null,
          };
        }

        return state;
      },
    }
  )
);
