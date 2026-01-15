import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// アラートレベル
export type AlertLevel = 'none' | 'warning' | 'error';

// アラート種別
export interface AlertType {
  id: string;
  code: string;
  name: string;
  description: string;
  level: AlertLevel;
  isEditable: boolean;        // レベル変更可能か
  isSystem: boolean;          // システム定義（削除不可）
  category: 'punch' | 'schedule' | 'overtime' | 'leave' | 'other';
  isActive: boolean;
  sortOrder: number;
}

// アラート発生履歴
export interface AlertOccurrence {
  id: string;
  alertTypeId: string;
  alertTypeName: string;
  level: AlertLevel;
  userId: string;
  userName: string;
  date: string;             // YYYY-MM-DD
  message: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

// 36協定設定
export interface Agreement36Settings {
  enabled: boolean;
  monthlyLimit: number;       // 月の上限時間
  yearlyLimit: number;        // 年の上限時間
  specialMonthlyLimit: number; // 特別条項の月上限
  specialYearlyLimit: number;  // 特別条項の年上限
  specialMonthsLimit: number;  // 特別条項の適用可能月数
  warningThreshold: number;    // 警告閾値（%）
}

// デフォルトのアラート種別
const defaultAlertTypes: AlertType[] = [
  // 打刻関連エラー（編集不可）
  {
    id: 'not_employed',
    code: 'E001',
    name: '在籍中でない社員が打刻している',
    description: '退職済みまたは休職中の社員による打刻',
    level: 'error',
    isEditable: false,
    isSystem: true,
    category: 'punch',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'unpaired_punch',
    code: 'E002',
    name: '出退勤のペアが揃っていない',
    description: '出勤または退勤の打刻が欠けている',
    level: 'error',
    isEditable: false,
    isSystem: true,
    category: 'punch',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'duplicate_punch',
    code: 'E003',
    name: '打刻時間が重複している',
    description: '同じ時間帯に複数の打刻がある',
    level: 'error',
    isEditable: false,
    isSystem: true,
    category: 'punch',
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'break_outside_work',
    code: 'E004',
    name: '休憩開始〜休憩終了が、出勤〜退勤の範囲外',
    description: '休憩時間が勤務時間外に設定されている',
    level: 'error',
    isEditable: false,
    isSystem: true,
    category: 'punch',
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'invalid_break',
    code: 'E005',
    name: '許可されていない休憩打刻がある',
    description: '設定外の休憩打刻が存在する',
    level: 'error',
    isEditable: false,
    isSystem: true,
    category: 'punch',
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'invalid_punch_order',
    code: 'E006',
    name: '無効な順番で打刻している',
    description: '出勤→休憩開始→休憩終了→退勤の順序違反',
    level: 'error',
    isEditable: false,
    isSystem: true,
    category: 'punch',
    isActive: true,
    sortOrder: 6,
  },
  // スケジュール関連エラー（編集不可）
  {
    id: 'invalid_pattern',
    code: 'E007',
    name: 'スケジュールに利用できない勤務パターンを適用している',
    description: '無効な勤務パターンが割り当てられている',
    level: 'error',
    isEditable: false,
    isSystem: true,
    category: 'schedule',
    isActive: true,
    sortOrder: 7,
  },
  // 休暇関連エラー（編集不可）
  {
    id: 'invalid_leave_pattern',
    code: 'E008',
    name: '利用している休暇の休暇パターンを設定していない',
    description: '休暇種別が正しく設定されていない',
    level: 'error',
    isEditable: false,
    isSystem: true,
    category: 'leave',
    isActive: true,
    sortOrder: 8,
  },
  {
    id: 'leave_on_holiday',
    code: 'E009',
    name: '休日に休暇を取得している',
    description: '所定休日に休暇申請がある',
    level: 'error',
    isEditable: false,
    isSystem: true,
    category: 'leave',
    isActive: true,
    sortOrder: 9,
  },
  // 警告（編集可能）
  {
    id: 'punch_on_holiday',
    code: 'W001',
    name: '休日に打刻されている',
    description: '所定休日に出勤打刻がある',
    level: 'warning',
    isEditable: true,
    isSystem: true,
    category: 'punch',
    isActive: true,
    sortOrder: 10,
  },
  {
    id: 'punch_on_leave',
    code: 'W002',
    name: '休暇日に打刻されている',
    description: '休暇取得日に出勤打刻がある',
    level: 'warning',
    isEditable: true,
    isSystem: true,
    category: 'leave',
    isActive: true,
    sortOrder: 11,
  },
  {
    id: 'no_punch_on_workday',
    code: 'W003',
    name: '勤務スケジュールが割り当てられている日に打刻がない',
    description: '予定勤務日に打刻がない',
    level: 'warning',
    isEditable: true,
    isSystem: true,
    category: 'schedule',
    isActive: true,
    sortOrder: 12,
  },
  // 編集可能（なし～警告）
  {
    id: 'early_check_in',
    code: 'I001',
    name: '労働開始予定時刻より前に出勤している',
    description: '早出勤',
    level: 'none',
    isEditable: true,
    isSystem: true,
    category: 'punch',
    isActive: true,
    sortOrder: 13,
  },
  {
    id: 'late_check_in',
    code: 'I002',
    name: '労働開始予定時刻より後に出勤している',
    description: '遅刻',
    level: 'none',
    isEditable: true,
    isSystem: true,
    category: 'punch',
    isActive: true,
    sortOrder: 14,
  },
  {
    id: 'early_check_out',
    code: 'I003',
    name: '労働終了予定時刻より前に退勤している',
    description: '早退',
    level: 'none',
    isEditable: true,
    isSystem: true,
    category: 'punch',
    isActive: true,
    sortOrder: 15,
  },
  {
    id: 'late_check_out',
    code: 'I004',
    name: '労働終了予定時刻より後に退勤している',
    description: '残業',
    level: 'none',
    isEditable: true,
    isSystem: true,
    category: 'punch',
    isActive: true,
    sortOrder: 16,
  },
  // 残業・36協定関連
  {
    id: 'overtime_excess',
    code: 'W004',
    name: '残業超過',
    description: '月の残業時間が上限に近づいている',
    level: 'warning',
    isEditable: true,
    isSystem: true,
    category: 'overtime',
    isActive: true,
    sortOrder: 17,
  },
  {
    id: 'agreement36_violation',
    code: 'E010',
    name: '36協定超過',
    description: '36協定で定められた上限を超過',
    level: 'error',
    isEditable: true,
    isSystem: true,
    category: 'overtime',
    isActive: true,
    sortOrder: 18,
  },
];

const defaultAgreement36Settings: Agreement36Settings = {
  enabled: true,
  monthlyLimit: 45,
  yearlyLimit: 360,
  specialMonthlyLimit: 100,
  specialYearlyLimit: 720,
  specialMonthsLimit: 6,
  warningThreshold: 80,
};

interface AlertState {
  alertTypes: AlertType[];
  alertOccurrences: AlertOccurrence[];
  agreement36Settings: Agreement36Settings;
}

interface AlertActions {
  // アラート種別管理
  updateAlertType: (id: string, updates: Partial<AlertType>) => void;
  getActiveAlertTypes: () => AlertType[];
  getAlertTypeById: (id: string) => AlertType | undefined;
  getAlertTypesByCategory: (category: AlertType['category']) => AlertType[];

  // アラート発生管理
  createAlert: (alert: Omit<AlertOccurrence, 'id' | 'createdAt'>) => string;
  resolveAlert: (id: string, resolvedBy: string) => void;
  getUserAlerts: (userId: string, startDate: string, endDate: string) => AlertOccurrence[];
  getUnresolvedAlerts: () => AlertOccurrence[];
  getAlertsByDate: (date: string) => AlertOccurrence[];

  // 36協定設定
  updateAgreement36Settings: (settings: Partial<Agreement36Settings>) => void;

  // 残業チェック
  checkOvertimeAlert: (userId: string, currentMonthHours: number, currentYearHours: number) => AlertOccurrence | null;

  // リセット
  resetToDefaults: () => void;
}

type AlertStore = AlertState & AlertActions;

export const useAttendanceAlertStore = create<AlertStore>()(
  persist(
    (set, get) => ({
      alertTypes: defaultAlertTypes,
      alertOccurrences: [],
      agreement36Settings: defaultAgreement36Settings,

      // アラート種別更新
      updateAlertType: (id, updates) => {
        const alertType = get().alertTypes.find((a) => a.id === id);
        if (!alertType) return;

        // 編集不可のアラートはレベル変更不可
        if (!alertType.isEditable && updates.level !== undefined) {
          return;
        }

        set((state) => ({
          alertTypes: state.alertTypes.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      // 有効なアラート種別取得
      getActiveAlertTypes: () => {
        return get().alertTypes
          .filter((a) => a.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      },

      // IDでアラート種別取得
      getAlertTypeById: (id) => {
        return get().alertTypes.find((a) => a.id === id);
      },

      // カテゴリでアラート種別取得
      getAlertTypesByCategory: (category) => {
        return get().alertTypes
          .filter((a) => a.category === category && a.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      },

      // アラート発生作成
      createAlert: (alert) => {
        const now = new Date().toISOString();
        const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newAlert: AlertOccurrence = {
          ...alert,
          id,
          createdAt: now,
        };

        set((state) => ({
          alertOccurrences: [...state.alertOccurrences, newAlert],
        }));

        return id;
      },

      // アラート解決
      resolveAlert: (id, resolvedBy) => {
        const now = new Date().toISOString();

        set((state) => ({
          alertOccurrences: state.alertOccurrences.map((a) =>
            a.id === id
              ? { ...a, isResolved: true, resolvedAt: now, resolvedBy }
              : a
          ),
        }));
      },

      // ユーザーのアラート取得
      getUserAlerts: (userId, startDate, endDate) => {
        return get().alertOccurrences
          .filter(
            (a) =>
              a.userId === userId &&
              a.date >= startDate &&
              a.date <= endDate
          )
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },

      // 未解決のアラート取得
      getUnresolvedAlerts: () => {
        return get().alertOccurrences
          .filter((a) => !a.isResolved)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },

      // 日付でアラート取得
      getAlertsByDate: (date) => {
        return get().alertOccurrences
          .filter((a) => a.date === date)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },

      // 36協定設定更新
      updateAgreement36Settings: (settings) => {
        set((state) => ({
          agreement36Settings: { ...state.agreement36Settings, ...settings },
        }));
      },

      // 残業チェック
      checkOvertimeAlert: (userId, currentMonthHours, currentYearHours) => {
        const settings = get().agreement36Settings;
        if (!settings.enabled) return null;

        const overtimeType = get().getAlertTypeById('overtime_excess');
        const violationType = get().getAlertTypeById('agreement36_violation');

        // 36協定違反チェック
        if (currentMonthHours > settings.monthlyLimit) {
          if (violationType && violationType.level !== 'none') {
            return {
              id: '',
              alertTypeId: 'agreement36_violation',
              alertTypeName: violationType.name,
              level: violationType.level,
              userId,
              userName: '',
              date: new Date().toISOString().split('T')[0],
              message: `月間残業時間が36協定の上限（${settings.monthlyLimit}時間）を超過しています。現在: ${currentMonthHours}時間`,
              isResolved: false,
              createdAt: '',
            };
          }
        }

        if (currentYearHours > settings.yearlyLimit) {
          if (violationType && violationType.level !== 'none') {
            return {
              id: '',
              alertTypeId: 'agreement36_violation',
              alertTypeName: violationType.name,
              level: violationType.level,
              userId,
              userName: '',
              date: new Date().toISOString().split('T')[0],
              message: `年間残業時間が36協定の上限（${settings.yearlyLimit}時間）を超過しています。現在: ${currentYearHours}時間`,
              isResolved: false,
              createdAt: '',
            };
          }
        }

        // 警告チェック
        const warningThresholdMonth = settings.monthlyLimit * (settings.warningThreshold / 100);
        if (currentMonthHours > warningThresholdMonth) {
          if (overtimeType && overtimeType.level !== 'none') {
            return {
              id: '',
              alertTypeId: 'overtime_excess',
              alertTypeName: overtimeType.name,
              level: overtimeType.level,
              userId,
              userName: '',
              date: new Date().toISOString().split('T')[0],
              message: `月間残業時間が警告閾値（${warningThresholdMonth}時間）を超えています。現在: ${currentMonthHours}時間`,
              isResolved: false,
              createdAt: '',
            };
          }
        }

        return null;
      },

      // リセット
      resetToDefaults: () => {
        set({
          alertTypes: defaultAlertTypes,
          alertOccurrences: [],
          agreement36Settings: defaultAgreement36Settings,
        });
      },
    }),
    {
      name: 'attendance-alert-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
