import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 法令変更のカテゴリ
export type LegalUpdateCategory =
  | 'tax'              // 税務（年末調整、所得税、住民税等）
  | 'labor'            // 労務（労働基準法、労働契約法等）
  | 'social_insurance' // 社会保険（健康保険、厚生年金、雇用保険等）
  | 'payroll'          // 給与計算（最低賃金、割増率等）
  | 'attendance'       // 勤怠管理（労働時間、有給休暇等）
  | 'safety'           // 安全衛生（労働安全衛生法等）
  | 'other';           // その他

// 法令変更のステータス
export type LegalUpdateStatus =
  | 'applied'    // 適用済み
  | 'scheduled'  // 適用予定
  | 'preparing'; // 準備中

// 重要度
export type LegalUpdateImportance =
  | 'critical'  // 最重要（対応必須）
  | 'high'      // 高（早急な対応推奨）
  | 'medium'    // 中（通常対応）
  | 'low';      // 低（情報共有レベル）

// 法令変更
export interface LegalUpdate {
  id: string;
  title: string;                           // タイトル
  category: LegalUpdateCategory;           // カテゴリ
  effectiveDate: string;                   // 施行日（YYYY-MM-DD）
  status: LegalUpdateStatus;               // ステータス
  importance: LegalUpdateImportance;       // 重要度

  // 詳細情報
  description: string;                     // 概要説明
  beforeContent?: string;                  // 変更前の内容
  afterContent?: string;                   // 変更後の内容
  affectedAreas: string[];                 // 影響範囲（例: 給与計算、年末調整、勤怠管理）

  // 関連情報
  lawName: string;                         // 法令名
  referenceUrl?: string;                   // 参考URL（官公庁サイト等）

  // システム対応状況
  systemUpdated: boolean;                  // システム対応済みか
  systemUpdateDetails?: string;            // システム対応内容

  // メタ情報
  createdAt: string;
  updatedAt: string;
  createdBy: string;                       // 登録者（運営側の担当者名）
}

// APIステータスからLegalUpdateStatusへの変換
function mapTenantStatusToLegalStatus(status?: string): LegalUpdateStatus {
  switch (status) {
    case 'completed':
      return 'applied';
    case 'in_progress':
      return 'preparing';
    default:
      return 'scheduled';
  }
}

// APIの優先度から重要度への変換
function mapPriorityToImportance(priority?: string): LegalUpdateImportance {
  switch (priority) {
    case 'critical':
      return 'critical';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
      return 'low';
    default:
      return 'medium';
  }
}

interface LegalUpdatesState {
  updates: LegalUpdate[];
  isLoading: boolean;
  error: string | null;

  // API取得
  fetchLegalUpdates: () => Promise<void>;

  // CRUD操作
  addUpdate: (update: Omit<LegalUpdate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLegalUpdate: (id: string, updates: Partial<LegalUpdate>) => void;
  deleteLegalUpdate: (id: string) => void;

  // クエリ操作
  getLegalUpdates: () => LegalUpdate[];
  getUpdateById: (id: string) => LegalUpdate | undefined;
  getUpdatesByCategory: (category: LegalUpdateCategory) => LegalUpdate[];
  getUpdatesByStatus: (status: LegalUpdateStatus) => LegalUpdate[];
  getUpdatesByYear: (year: number) => LegalUpdate[];
  getUpcomingUpdates: (daysAhead: number) => LegalUpdate[];
  searchUpdates: (keyword: string) => LegalUpdate[];

  // 統計
  getStats: () => {
    total: number;
    byCategory: Record<LegalUpdateCategory, number>;
    byStatus: Record<LegalUpdateStatus, number>;
    byImportance: Record<LegalUpdateImportance, number>;
    systemUpdatedCount: number;
  };
}

export const useLegalUpdatesStore = create<LegalUpdatesState>()(
  persist(
    (set, get) => ({
      updates: [],
      isLoading: false,
      error: null,

      // APIから法令変更を取得
      fetchLegalUpdates: async () => {
        // 既にデータがあれば再取得しない
        if (get().updates.length > 0) return;

        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/legal-updates');
          if (!response.ok) {
            throw new Error('法令情報の取得に失敗しました');
          }
          const result = await response.json();

          // APIレスポンスをストア形式に変換
          const updates: LegalUpdate[] = (result.data || []).map((item: {
            id: string;
            title: string;
            description: string;
            category: string;
            effectiveDate: string;
            relatedLaws?: string[];
            affectedAreas?: string[];
            priority?: string;
            referenceUrl?: string;
            tenantStatus?: {
              status: string;
              notes?: string;
              completedAt?: string;
              completedBy?: string;
            };
            publishedAt?: string;
          }) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category as LegalUpdateCategory,
            effectiveDate: item.effectiveDate,
            status: mapTenantStatusToLegalStatus(item.tenantStatus?.status),
            importance: mapPriorityToImportance(item.priority),
            affectedAreas: item.affectedAreas || [],
            lawName: item.relatedLaws?.join(', ') || '',
            referenceUrl: item.referenceUrl,
            systemUpdated: item.tenantStatus?.status === 'completed',
            systemUpdateDetails: item.tenantStatus?.notes || undefined,
            createdAt: item.publishedAt || new Date().toISOString(),
            updatedAt: item.tenantStatus?.completedAt || new Date().toISOString(),
            createdBy: item.tenantStatus?.completedBy || 'システム',
          }));

          set({ updates, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '不明なエラー',
            isLoading: false
          });
        }
      },

      // 法令変更を追加
      addUpdate: (update) => {
        const newUpdate: LegalUpdate = {
          ...update,
          id: `legal-update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          updates: [...state.updates, newUpdate],
        }));
      },

      // 法令変更を更新
      updateLegalUpdate: (id, updates) => {
        set((state) => ({
          updates: state.updates.map((update) =>
            update.id === id
              ? {
                  ...update,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : update
          ),
        }));
      },

      // 法令変更を削除
      deleteLegalUpdate: (id) => {
        set((state) => ({
          updates: state.updates.filter((update) => update.id !== id),
        }));
      },

      // 全法令変更を取得
      getLegalUpdates: () => {
        return get().updates;
      },

      // IDで取得
      getUpdateById: (id) => {
        return get().updates.find((update) => update.id === id);
      },

      // カテゴリ別取得
      getUpdatesByCategory: (category) => {
        return get().updates.filter((update) => update.category === category);
      },

      // ステータス別取得
      getUpdatesByStatus: (status) => {
        return get().updates.filter((update) => update.status === status);
      },

      // 年度別取得
      getUpdatesByYear: (year) => {
        return get().updates.filter((update) => {
          const effectiveYear = new Date(update.effectiveDate).getFullYear();
          return effectiveYear === year;
        });
      },

      // 近日施行予定の変更を取得
      getUpcomingUpdates: (daysAhead) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + daysAhead);

        return get().updates.filter((update) => {
          if (update.status === 'applied') return false;

          const effectiveDate = new Date(update.effectiveDate);
          effectiveDate.setHours(0, 0, 0, 0);

          return effectiveDate >= today && effectiveDate <= futureDate;
        });
      },

      // キーワード検索
      searchUpdates: (keyword) => {
        const lowerKeyword = keyword.toLowerCase();
        return get().updates.filter((update) => {
          return (
            update.title.toLowerCase().includes(lowerKeyword) ||
            update.description.toLowerCase().includes(lowerKeyword) ||
            update.lawName.toLowerCase().includes(lowerKeyword) ||
            update.affectedAreas.some((area) => area.toLowerCase().includes(lowerKeyword))
          );
        });
      },

      // 統計を取得
      getStats: () => {
        const updates = get().updates;

        const byCategory = {
          tax: updates.filter((u) => u.category === 'tax').length,
          labor: updates.filter((u) => u.category === 'labor').length,
          social_insurance: updates.filter((u) => u.category === 'social_insurance').length,
          payroll: updates.filter((u) => u.category === 'payroll').length,
          attendance: updates.filter((u) => u.category === 'attendance').length,
          safety: updates.filter((u) => u.category === 'safety').length,
          other: updates.filter((u) => u.category === 'other').length,
        };

        const byStatus = {
          applied: updates.filter((u) => u.status === 'applied').length,
          scheduled: updates.filter((u) => u.status === 'scheduled').length,
          preparing: updates.filter((u) => u.status === 'preparing').length,
        };

        const byImportance = {
          critical: updates.filter((u) => u.importance === 'critical').length,
          high: updates.filter((u) => u.importance === 'high').length,
          medium: updates.filter((u) => u.importance === 'medium').length,
          low: updates.filter((u) => u.importance === 'low').length,
        };

        return {
          total: updates.length,
          byCategory,
          byStatus,
          byImportance,
          systemUpdatedCount: updates.filter((u) => u.systemUpdated).length,
        };
      },
    }),
    {
      name: 'legal-updates-storage',
      skipHydration: true,
    }
  )
);

// カテゴリ別ラベル
export const categoryLabels: Record<LegalUpdateCategory, string> = {
  tax: '税務',
  labor: '労務',
  social_insurance: '社会保険',
  payroll: '給与計算',
  attendance: '勤怠管理',
  safety: '安全衛生',
  other: 'その他',
};

// ステータス別ラベル
export const statusLabels: Record<LegalUpdateStatus, string> = {
  applied: '適用済み',
  scheduled: '適用予定',
  preparing: '準備中',
};

// 重要度別ラベル
export const importanceLabels: Record<LegalUpdateImportance, string> = {
  critical: '最重要',
  high: '高',
  medium: '中',
  low: '低',
};

// カテゴリ別カラー
export const categoryColors: Record<LegalUpdateCategory, string> = {
  tax: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
  labor: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  social_insurance: 'text-green-600 bg-green-50 dark:bg-green-950',
  payroll: 'text-orange-600 bg-orange-50 dark:bg-orange-950',
  attendance: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950',
  safety: 'text-red-600 bg-red-50 dark:bg-red-950',
  other: 'text-gray-600 bg-gray-50 dark:bg-gray-950',
};

// 重要度別カラー
export const importanceColors: Record<LegalUpdateImportance, string> = {
  critical: 'text-red-600 bg-red-50 dark:bg-red-950 border-red-200',
  high: 'text-orange-600 bg-orange-50 dark:bg-orange-950 border-orange-200',
  medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 border-yellow-200',
  low: 'text-gray-600 bg-gray-50 dark:bg-gray-950 border-gray-200',
};
