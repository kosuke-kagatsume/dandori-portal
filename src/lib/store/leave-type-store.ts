import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 休暇種別の型
export interface LeaveTypeConfig {
  id: string;
  name: string;
  code: string;
  description: string;
  isPaid: boolean;           // 有給かどうか
  allowFullDay: boolean;     // 全休可
  allowHalfDay: boolean;     // 半休可
  allowHourly: boolean;      // 時間休可
  maxDaysPerYear: number | null;  // 年間上限日数（nullは無制限）
  requireAttachment: boolean;     // 添付ファイル必須
  isActive: boolean;         // 有効/無効
  isSystem: boolean;         // システム定義（削除不可）
  sortOrder: number;         // 表示順
  createdAt: string;
  updatedAt: string;
}

// 有給休暇付与履歴
export interface PaidLeaveGrant {
  id: string;
  userId: string;
  grantDate: string;         // 付与日
  grantDays: number;         // 付与日数
  usedDays: number;          // 使用日数
  remainingDays: number;     // 残日数
  expiryDate: string;        // 失効日
  grantReason: string;       // 付与理由（入社時/勤続年数/手動付与等）
  createdAt: string;
}

// 有給休暇自動付与設定
export interface PaidLeaveAutoGrantSettings {
  enabled: boolean;
  baseDate: 'hire_date' | 'fiscal_year';  // 起算日（入社日基準/年度基準）
  grantTiming: 'on_base_date' | 'april_1';  // 付与タイミング
  prorateDays: boolean;      // 比例付与するか
  carryOverLimit: number;    // 繰越上限日数
  expiryYears: number;       // 有効期限（年）
}

// 法定の有給休暇付与日数テーブル（週5日勤務の場合）
export const LEGAL_PAID_LEAVE_DAYS: { yearsOfService: number; days: number }[] = [
  { yearsOfService: 0.5, days: 10 },
  { yearsOfService: 1.5, days: 11 },
  { yearsOfService: 2.5, days: 12 },
  { yearsOfService: 3.5, days: 14 },
  { yearsOfService: 4.5, days: 16 },
  { yearsOfService: 5.5, days: 18 },
  { yearsOfService: 6.5, days: 20 },
];

// 比例付与テーブル（週の所定労働日数に応じた付与日数）
export const PRORATED_PAID_LEAVE_DAYS: { weeklyDays: number; yearsOfService: number; days: number }[] = [
  // 週4日
  { weeklyDays: 4, yearsOfService: 0.5, days: 7 },
  { weeklyDays: 4, yearsOfService: 1.5, days: 8 },
  { weeklyDays: 4, yearsOfService: 2.5, days: 9 },
  { weeklyDays: 4, yearsOfService: 3.5, days: 10 },
  { weeklyDays: 4, yearsOfService: 4.5, days: 12 },
  { weeklyDays: 4, yearsOfService: 5.5, days: 13 },
  { weeklyDays: 4, yearsOfService: 6.5, days: 15 },
  // 週3日
  { weeklyDays: 3, yearsOfService: 0.5, days: 5 },
  { weeklyDays: 3, yearsOfService: 1.5, days: 6 },
  { weeklyDays: 3, yearsOfService: 2.5, days: 6 },
  { weeklyDays: 3, yearsOfService: 3.5, days: 8 },
  { weeklyDays: 3, yearsOfService: 4.5, days: 9 },
  { weeklyDays: 3, yearsOfService: 5.5, days: 10 },
  { weeklyDays: 3, yearsOfService: 6.5, days: 11 },
  // 週2日
  { weeklyDays: 2, yearsOfService: 0.5, days: 3 },
  { weeklyDays: 2, yearsOfService: 1.5, days: 4 },
  { weeklyDays: 2, yearsOfService: 2.5, days: 4 },
  { weeklyDays: 2, yearsOfService: 3.5, days: 5 },
  { weeklyDays: 2, yearsOfService: 4.5, days: 6 },
  { weeklyDays: 2, yearsOfService: 5.5, days: 6 },
  { weeklyDays: 2, yearsOfService: 6.5, days: 7 },
  // 週1日
  { weeklyDays: 1, yearsOfService: 0.5, days: 1 },
  { weeklyDays: 1, yearsOfService: 1.5, days: 2 },
  { weeklyDays: 1, yearsOfService: 2.5, days: 2 },
  { weeklyDays: 1, yearsOfService: 3.5, days: 2 },
  { weeklyDays: 1, yearsOfService: 4.5, days: 3 },
  { weeklyDays: 1, yearsOfService: 5.5, days: 3 },
  { weeklyDays: 1, yearsOfService: 6.5, days: 3 },
];

// デフォルトの休暇種別
const defaultLeaveTypes: LeaveTypeConfig[] = [
  {
    id: 'paid',
    name: '年次有給休暇',
    code: 'PAID',
    description: '労働基準法に基づく年次有給休暇',
    isPaid: true,
    allowFullDay: true,
    allowHalfDay: true,
    allowHourly: true,
    maxDaysPerYear: null,
    requireAttachment: false,
    isActive: true,
    isSystem: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'compensatory',
    name: '代休',
    code: 'COMP',
    description: '休日出勤の代わりに取得する休暇',
    isPaid: true,
    allowFullDay: true,
    allowHalfDay: true,
    allowHourly: false,
    maxDaysPerYear: null,
    requireAttachment: false,
    isActive: true,
    isSystem: true,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'special',
    name: '特別休暇',
    code: 'SPECIAL',
    description: '慶弔休暇等の特別休暇',
    isPaid: true,
    allowFullDay: true,
    allowHalfDay: false,
    allowHourly: false,
    maxDaysPerYear: 5,
    requireAttachment: true,
    isActive: true,
    isSystem: true,
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'childcare',
    name: '子の看護休暇',
    code: 'CHILD',
    description: '子の看護のための休暇（年5日まで）',
    isPaid: false,
    allowFullDay: true,
    allowHalfDay: true,
    allowHourly: true,
    maxDaysPerYear: 5,
    requireAttachment: false,
    isActive: true,
    isSystem: true,
    sortOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'nursing',
    name: '介護休暇',
    code: 'NURSING',
    description: '家族の介護のための休暇（年5日まで）',
    isPaid: false,
    allowFullDay: true,
    allowHalfDay: true,
    allowHourly: true,
    maxDaysPerYear: 5,
    requireAttachment: false,
    isActive: true,
    isSystem: true,
    sortOrder: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface LeaveTypeState {
  leaveTypes: LeaveTypeConfig[];
  paidLeaveGrants: PaidLeaveGrant[];
  autoGrantSettings: PaidLeaveAutoGrantSettings;
}

interface LeaveTypeActions {
  // 休暇種別の管理
  addLeaveType: (leaveType: Omit<LeaveTypeConfig, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>) => string;
  updateLeaveType: (id: string, updates: Partial<LeaveTypeConfig>) => void;
  deleteLeaveType: (id: string) => boolean;
  getActiveLeaveTypes: () => LeaveTypeConfig[];
  getLeaveTypeById: (id: string) => LeaveTypeConfig | undefined;

  // 有給休暇付与管理
  addPaidLeaveGrant: (grant: Omit<PaidLeaveGrant, 'id' | 'createdAt'>) => string;
  updatePaidLeaveGrant: (id: string, updates: Partial<PaidLeaveGrant>) => void;
  getUserPaidLeaveGrants: (userId: string) => PaidLeaveGrant[];
  getActiveGrants: (userId: string) => PaidLeaveGrant[];

  // 自動付与設定
  updateAutoGrantSettings: (settings: Partial<PaidLeaveAutoGrantSettings>) => void;

  // 自動付与計算
  calculatePaidLeaveDays: (hireDate: string, weeklyWorkDays?: number) => number;

  // データリセット
  resetToDefaults: () => void;
}

type LeaveTypeStore = LeaveTypeState & LeaveTypeActions;

const defaultAutoGrantSettings: PaidLeaveAutoGrantSettings = {
  enabled: true,
  baseDate: 'hire_date',
  grantTiming: 'on_base_date',
  prorateDays: true,
  carryOverLimit: 20,
  expiryYears: 2,
};

export const useLeaveTypeStore = create<LeaveTypeStore>()(
  persist(
    (set, get) => ({
      leaveTypes: defaultLeaveTypes,
      paidLeaveGrants: [],
      autoGrantSettings: defaultAutoGrantSettings,

      // 休暇種別追加
      addLeaveType: (leaveType) => {
        const now = new Date().toISOString();
        const id = `leave-type-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newLeaveType: LeaveTypeConfig = {
          ...leaveType,
          id,
          isSystem: false,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          leaveTypes: [...state.leaveTypes, newLeaveType],
        }));

        return id;
      },

      // 休暇種別更新
      updateLeaveType: (id, updates) => {
        const now = new Date().toISOString();

        set((state) => ({
          leaveTypes: state.leaveTypes.map((lt) =>
            lt.id === id
              ? { ...lt, ...updates, updatedAt: now }
              : lt
          ),
        }));
      },

      // 休暇種別削除（システム定義は削除不可）
      deleteLeaveType: (id) => {
        const leaveType = get().leaveTypes.find((lt) => lt.id === id);
        if (!leaveType || leaveType.isSystem) {
          return false;
        }

        set((state) => ({
          leaveTypes: state.leaveTypes.filter((lt) => lt.id !== id),
        }));

        return true;
      },

      // 有効な休暇種別を取得
      getActiveLeaveTypes: () => {
        return get().leaveTypes
          .filter((lt) => lt.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      },

      // IDで休暇種別を取得
      getLeaveTypeById: (id) => {
        return get().leaveTypes.find((lt) => lt.id === id);
      },

      // 有給休暇付与追加
      addPaidLeaveGrant: (grant) => {
        const now = new Date().toISOString();
        const id = `grant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newGrant: PaidLeaveGrant = {
          ...grant,
          id,
          createdAt: now,
        };

        set((state) => ({
          paidLeaveGrants: [...state.paidLeaveGrants, newGrant],
        }));

        return id;
      },

      // 有給休暇付与更新
      updatePaidLeaveGrant: (id, updates) => {
        set((state) => ({
          paidLeaveGrants: state.paidLeaveGrants.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
      },

      // ユーザーの有給休暇付与履歴を取得
      getUserPaidLeaveGrants: (userId) => {
        return get().paidLeaveGrants
          .filter((g) => g.userId === userId)
          .sort((a, b) => b.grantDate.localeCompare(a.grantDate));
      },

      // ユーザーの有効な付与を取得（失効していないもの）
      getActiveGrants: (userId) => {
        const today = new Date().toISOString().split('T')[0];
        return get().paidLeaveGrants
          .filter((g) => g.userId === userId && g.expiryDate >= today && g.remainingDays > 0)
          .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
      },

      // 自動付与設定更新
      updateAutoGrantSettings: (settings) => {
        set((state) => ({
          autoGrantSettings: { ...state.autoGrantSettings, ...settings },
        }));
      },

      // 有給休暇付与日数計算
      calculatePaidLeaveDays: (hireDate, weeklyWorkDays = 5) => {
        const now = new Date();
        const hire = new Date(hireDate);
        const yearsOfService = (now.getTime() - hire.getTime()) / (365 * 24 * 60 * 60 * 1000);

        // 6ヶ月未満は0日
        if (yearsOfService < 0.5) return 0;

        // 週5日以上勤務の場合は法定通り
        if (weeklyWorkDays >= 5) {
          const entry = LEGAL_PAID_LEAVE_DAYS.reverse().find(
            (e) => yearsOfService >= e.yearsOfService
          );
          return entry?.days || 20;
        }

        // 比例付与
        const entry = PRORATED_PAID_LEAVE_DAYS
          .filter((e) => e.weeklyDays === weeklyWorkDays)
          .reverse()
          .find((e) => yearsOfService >= e.yearsOfService);

        return entry?.days || 0;
      },

      // デフォルトにリセット
      resetToDefaults: () => {
        set({
          leaveTypes: defaultLeaveTypes,
          paidLeaveGrants: [],
          autoGrantSettings: defaultAutoGrantSettings,
        });
      },
    }),
    {
      name: 'leave-type-store',
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
