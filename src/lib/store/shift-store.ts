import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 勤務パターンの型
export interface WorkPattern {
  id: string;
  name: string;
  code: string;
  startTime: string;      // 開始時刻 (HH:mm)
  endTime: string;        // 終了時刻 (HH:mm)
  breakMinutes: number;   // 休憩時間（分）
  workMinutes: number;    // 所定労働時間（分）
  color: string;          // 表示色
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// シフト割り当ての型
export interface ShiftAssignment {
  id: string;
  userId: string;
  userName: string;
  date: string;           // YYYY-MM-DD
  patternId: string;      // WorkPattern ID
  patternName: string;
  startTime: string;      // 実際の開始時刻
  endTime: string;        // 実際の終了時刻
  workLocation: 'office' | 'home' | 'client' | 'other';
  status: 'scheduled' | 'worked' | 'absent' | 'holiday';
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// 月間シフトサマリー
export interface MonthlyShiftSummary {
  userId: string;
  year: number;
  month: number;
  scheduledDays: number;
  workedDays: number;
  absentDays: number;
  holidayDays: number;
  totalWorkMinutes: number;
  overtimeMinutes: number;
}

// デフォルトの勤務パターン
const defaultWorkPatterns: WorkPattern[] = [
  {
    id: 'normal',
    name: '通常勤務',
    code: 'NORMAL',
    startTime: '09:00',
    endTime: '18:00',
    breakMinutes: 60,
    workMinutes: 480,
    color: '#3B82F6',
    isActive: true,
    isSystem: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'early',
    name: '早番',
    code: 'EARLY',
    startTime: '07:00',
    endTime: '16:00',
    breakMinutes: 60,
    workMinutes: 480,
    color: '#F59E0B',
    isActive: true,
    isSystem: true,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'late',
    name: '遅番',
    code: 'LATE',
    startTime: '11:00',
    endTime: '20:00',
    breakMinutes: 60,
    workMinutes: 480,
    color: '#8B5CF6',
    isActive: true,
    isSystem: true,
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'night',
    name: '夜勤',
    code: 'NIGHT',
    startTime: '22:00',
    endTime: '07:00',
    breakMinutes: 60,
    workMinutes: 480,
    color: '#6366F1',
    isActive: true,
    isSystem: true,
    sortOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'flex',
    name: 'フレックス',
    code: 'FLEX',
    startTime: '10:00',
    endTime: '19:00',
    breakMinutes: 60,
    workMinutes: 480,
    color: '#10B981',
    isActive: true,
    isSystem: true,
    sortOrder: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'half_day_am',
    name: '午前勤務',
    code: 'AM',
    startTime: '09:00',
    endTime: '13:00',
    breakMinutes: 0,
    workMinutes: 240,
    color: '#EC4899',
    isActive: true,
    isSystem: true,
    sortOrder: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'half_day_pm',
    name: '午後勤務',
    code: 'PM',
    startTime: '14:00',
    endTime: '18:00',
    breakMinutes: 0,
    workMinutes: 240,
    color: '#F97316',
    isActive: true,
    isSystem: true,
    sortOrder: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'holiday',
    name: '休日',
    code: 'OFF',
    startTime: '00:00',
    endTime: '00:00',
    breakMinutes: 0,
    workMinutes: 0,
    color: '#EF4444',
    isActive: true,
    isSystem: true,
    sortOrder: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'public_holiday',
    name: '祝日',
    code: 'PH',
    startTime: '00:00',
    endTime: '00:00',
    breakMinutes: 0,
    workMinutes: 0,
    color: '#DC2626',
    isActive: true,
    isSystem: true,
    sortOrder: 9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface ShiftState {
  workPatterns: WorkPattern[];
  shiftAssignments: ShiftAssignment[];
}

interface ShiftActions {
  // 勤務パターン管理
  addWorkPattern: (pattern: Omit<WorkPattern, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>) => string;
  updateWorkPattern: (id: string, updates: Partial<WorkPattern>) => void;
  deleteWorkPattern: (id: string) => boolean;
  getActiveWorkPatterns: () => WorkPattern[];
  getWorkPatternById: (id: string) => WorkPattern | undefined;

  // シフト割り当て管理
  assignShift: (assignment: Omit<ShiftAssignment, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateShiftAssignment: (id: string, updates: Partial<ShiftAssignment>) => void;
  deleteShiftAssignment: (id: string) => void;
  getUserShifts: (userId: string, year: number, month: number) => ShiftAssignment[];
  getTeamShifts: (year: number, month: number) => ShiftAssignment[];
  getShiftsByDate: (date: string) => ShiftAssignment[];

  // 一括操作
  bulkAssignShifts: (assignments: Omit<ShiftAssignment, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  copyWeekShifts: (userId: string, sourceWeekStart: string, targetWeekStart: string) => void;

  // サマリー
  getMonthlyShiftSummary: (userId: string, year: number, month: number) => MonthlyShiftSummary;

  // リセット
  resetToDefaults: () => void;
}

type ShiftStore = ShiftState & ShiftActions;

export const useShiftStore = create<ShiftStore>()(
  persist(
    (set, get) => ({
      workPatterns: defaultWorkPatterns,
      shiftAssignments: [],

      // 勤務パターン追加
      addWorkPattern: (pattern) => {
        const now = new Date().toISOString();
        const id = `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newPattern: WorkPattern = {
          ...pattern,
          id,
          isSystem: false,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          workPatterns: [...state.workPatterns, newPattern],
        }));

        return id;
      },

      // 勤務パターン更新
      updateWorkPattern: (id, updates) => {
        const now = new Date().toISOString();

        set((state) => ({
          workPatterns: state.workPatterns.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: now } : p
          ),
        }));
      },

      // 勤務パターン削除（システム定義は削除不可）
      deleteWorkPattern: (id) => {
        const pattern = get().workPatterns.find((p) => p.id === id);
        if (!pattern || pattern.isSystem) {
          return false;
        }

        set((state) => ({
          workPatterns: state.workPatterns.filter((p) => p.id !== id),
        }));

        return true;
      },

      // 有効な勤務パターンを取得
      getActiveWorkPatterns: () => {
        return get().workPatterns
          .filter((p) => p.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      },

      // IDで勤務パターンを取得
      getWorkPatternById: (id) => {
        return get().workPatterns.find((p) => p.id === id);
      },

      // シフト割り当て
      assignShift: (assignment) => {
        const now = new Date().toISOString();
        const id = `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newAssignment: ShiftAssignment = {
          ...assignment,
          id,
          createdAt: now,
          updatedAt: now,
        };

        // 同じユーザー・同じ日付の既存割り当てを削除して新規追加
        set((state) => ({
          shiftAssignments: [
            ...state.shiftAssignments.filter(
              (s) => !(s.userId === assignment.userId && s.date === assignment.date)
            ),
            newAssignment,
          ],
        }));

        return id;
      },

      // シフト割り当て更新
      updateShiftAssignment: (id, updates) => {
        const now = new Date().toISOString();

        set((state) => ({
          shiftAssignments: state.shiftAssignments.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: now } : s
          ),
        }));
      },

      // シフト割り当て削除
      deleteShiftAssignment: (id) => {
        set((state) => ({
          shiftAssignments: state.shiftAssignments.filter((s) => s.id !== id),
        }));
      },

      // ユーザーの月間シフト取得
      getUserShifts: (userId, year, month) => {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

        return get().shiftAssignments
          .filter((s) => s.userId === userId && s.date >= startDate && s.date <= endDate)
          .sort((a, b) => a.date.localeCompare(b.date));
      },

      // チーム全体の月間シフト取得
      getTeamShifts: (year, month) => {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

        return get().shiftAssignments
          .filter((s) => s.date >= startDate && s.date <= endDate)
          .sort((a, b) => a.date.localeCompare(b.date) || a.userName.localeCompare(b.userName));
      },

      // 特定日のシフト取得
      getShiftsByDate: (date) => {
        return get().shiftAssignments
          .filter((s) => s.date === date)
          .sort((a, b) => a.userName.localeCompare(b.userName));
      },

      // 一括シフト割り当て
      bulkAssignShifts: (assignments) => {
        const now = new Date().toISOString();

        const newAssignments = assignments.map((assignment) => ({
          ...assignment,
          id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now,
        }));

        // 既存の同じユーザー・日付の組み合わせを除外して追加
        set((state) => {
          const existingKeys = new Set(
            assignments.map((a) => `${a.userId}-${a.date}`)
          );

          return {
            shiftAssignments: [
              ...state.shiftAssignments.filter(
                (s) => !existingKeys.has(`${s.userId}-${s.date}`)
              ),
              ...newAssignments,
            ],
          };
        });
      },

      // 週間シフトのコピー
      copyWeekShifts: (userId, sourceWeekStart, targetWeekStart) => {
        const sourceDate = new Date(sourceWeekStart);
        const targetDate = new Date(targetWeekStart);
        const diffDays = Math.floor(
          (targetDate.getTime() - sourceDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        const sourceShifts = get().shiftAssignments.filter((s) => {
          const shiftDate = new Date(s.date);
          return (
            s.userId === userId &&
            shiftDate >= sourceDate &&
            shiftDate < new Date(sourceDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          );
        });

        const newAssignments = sourceShifts.map((shift) => {
          const shiftDate = new Date(shift.date);
          shiftDate.setDate(shiftDate.getDate() + diffDays);
          const newDate = shiftDate.toISOString().split('T')[0];

          return {
            userId: shift.userId,
            userName: shift.userName,
            date: newDate,
            patternId: shift.patternId,
            patternName: shift.patternName,
            startTime: shift.startTime,
            endTime: shift.endTime,
            workLocation: shift.workLocation,
            status: 'scheduled' as const,
            note: shift.note,
          };
        });

        get().bulkAssignShifts(newAssignments);
      },

      // 月間サマリー取得
      getMonthlyShiftSummary: (userId, year, month) => {
        const shifts = get().getUserShifts(userId, year, month);
        const patterns = get().workPatterns;

        let scheduledDays = 0;
        let workedDays = 0;
        let absentDays = 0;
        let holidayDays = 0;
        let totalWorkMinutes = 0;
        let overtimeMinutes = 0;

        shifts.forEach((shift) => {
          const pattern = patterns.find((p) => p.id === shift.patternId);

          switch (shift.status) {
            case 'scheduled':
              scheduledDays++;
              if (pattern) totalWorkMinutes += pattern.workMinutes;
              break;
            case 'worked':
              workedDays++;
              if (pattern) {
                totalWorkMinutes += pattern.workMinutes;
                // 実際の勤務時間から残業時間を計算（簡易版）
                const actualMinutes = calculateMinutesBetween(shift.startTime, shift.endTime);
                if (actualMinutes > pattern.workMinutes + pattern.breakMinutes) {
                  overtimeMinutes += actualMinutes - pattern.workMinutes - pattern.breakMinutes;
                }
              }
              break;
            case 'absent':
              absentDays++;
              break;
            case 'holiday':
              holidayDays++;
              break;
          }
        });

        return {
          userId,
          year,
          month,
          scheduledDays,
          workedDays,
          absentDays,
          holidayDays,
          totalWorkMinutes,
          overtimeMinutes,
        };
      },

      // リセット
      resetToDefaults: () => {
        set({
          workPatterns: defaultWorkPatterns,
          shiftAssignments: [],
        });
      },
    }),
    {
      name: 'shift-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ヘルパー関数：時間間隔を分単位で計算
function calculateMinutesBetween(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;

  // 日をまたぐ場合（夜勤など）
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  return endMinutes - startMinutes;
}
