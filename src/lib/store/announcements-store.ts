import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// API呼び出し関数
const API_BASE = '/api/announcements';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// アナウンスの優先度
export type AnnouncementPriority =
  | 'urgent'    // 緊急
  | 'high'      // 高
  | 'normal'    // 通常
  | 'low';      // 低

// アナウンスの種別
export type AnnouncementType =
  | 'general'           // 一般告知
  | 'deadline'          // 締切・期限
  | 'system'            // システム関連
  | 'event'             // イベント
  | 'policy'            // 規程・ポリシー
  | 'emergency';        // 緊急連絡

// 対象ユーザー
export type AnnouncementTarget =
  | 'all'               // 全社員
  | 'employee'          // 一般社員のみ
  | 'manager'           // マネージャーのみ
  | 'hr'                // 人事のみ
  | 'executive'         // 経営層のみ
  | 'custom';           // カスタム（部門指定など）

// ユーザーごとのアナウンス状態
export type UserAnnouncementStatus =
  | 'unread'      // 未読
  | 'read'        // 既読
  | 'completed';  // 対応完了

// ユーザーごとの状態管理
export interface UserAnnouncementState {
  userId: string;
  status: UserAnnouncementStatus;
  readAt?: string;        // 既読日時
  completedAt?: string;   // 完了日時
}

// アナウンス
export interface Announcement {
  id: string;
  title: string;                    // タイトル
  content: string;                  // 内容（マークダウン対応）
  type: AnnouncementType;           // 種別
  priority: AnnouncementPriority;   // 優先度

  // 表示設定
  target: AnnouncementTarget;       // 対象ユーザー
  targetDepartments?: string[];     // 対象部門（customの場合）
  targetRoles?: string[];           // 対象ロール（customの場合）

  // 期限・日時
  startDate: string;                // 掲載開始日（YYYY-MM-DD）
  endDate?: string;                 // 掲載終了日（YYYY-MM-DD）
  actionDeadline?: string;          // 対応期限（YYYY-MM-DD）

  // アクション設定
  requiresAction: boolean;          // 対応が必要か（確認だけか、アクションが必要か）
  actionLabel?: string;             // アクションボタンのラベル（例: 「提出する」「回答する」）
  actionUrl?: string;               // アクションリンク先

  // 状態管理
  userStates: UserAnnouncementState[];  // ユーザーごとの状態

  // メタ情報
  createdBy: string;                // 作成者ID
  createdByName: string;            // 作成者名
  createdAt: string;
  updatedAt: string;
  published: boolean;               // 公開済みか
  publishedAt?: string;             // 公開日時
}

interface AnnouncementsState {
  announcements: Announcement[];
  isLoading: boolean;
  error: string | null;

  // API統合
  fetchAnnouncements: () => Promise<void>;

  // CRUD操作（HR・管理者のみ）
  createAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'userStates'>) => Promise<void>;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  publishAnnouncement: (id: string) => Promise<void>;
  unpublishAnnouncement: (id: string) => Promise<void>;

  // ユーザー操作
  markAsRead: (announcementId: string, userId: string) => Promise<void>;
  markAsCompleted: (announcementId: string, userId: string) => void;

  // クエリ操作
  getAnnouncements: () => Announcement[];
  getAnnouncementById: (id: string) => Announcement | undefined;
  getActiveAnnouncements: (userId: string, userRoles: string[]) => Announcement[];
  getUnreadAnnouncements: (userId: string, userRoles: string[]) => Announcement[];
  getPendingAnnouncements: (userId: string, userRoles: string[]) => Announcement[];
  getAnnouncementsByType: (type: AnnouncementType) => Announcement[];
  getAnnouncementsByPriority: (priority: AnnouncementPriority) => Announcement[];

  // ユーザーごとのステータス取得
  getUserStatus: (announcementId: string, userId: string) => UserAnnouncementStatus;

  // 統計
  getStats: (userId: string, userRoles: string[]) => {
    total: number;
    unread: number;
    pending: number;
    completed: number;
    byPriority: Record<AnnouncementPriority, number>;
    byType: Record<AnnouncementType, number>;
  };
}

export const useAnnouncementsStore = create<AnnouncementsState>()(
  persist(
    (set, get) => ({
      announcements: [],
      isLoading: false,
      error: null,

      // API統合: お知らせ一覧取得
      fetchAnnouncements: async () => {
        set({ isLoading: true, error: null });

        try {
          // デモモードチェック
          if (process.env.NEXT_PUBLIC_ENV === 'demo' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
            set({ isLoading: false });
            return;
          }

          // 既存のuserStatesを保持（ローカル既読状態をマージするため）
          const existingAnnouncements = get().announcements;
          const existingUserStatesMap = new Map<string, UserAnnouncementState[]>(
            existingAnnouncements.map((a) => [a.id, a.userStates])
          );

          const response = await apiFetch<{
            success: boolean;
            data: Announcement[];
          }>(`${API_BASE}?tenantId=demo`);

          // APIレスポンスをストア形式に変換（既存のuserStatesとマージ）
          const announcements = response.data.map((item) => {
            // APIから取得したuserStates
            const apiUserStates: UserAnnouncementState[] = (item as unknown as { reads?: Array<{ userId: string; readAt: string; actionCompleted: boolean; actionCompletedAt?: string }> }).reads?.map((read) => ({
              userId: read.userId,
              status: read.actionCompleted ? 'completed' as UserAnnouncementStatus : 'read' as UserAnnouncementStatus,
              readAt: read.readAt,
              completedAt: read.actionCompletedAt,
            })) || [];

            // 既存のローカルuserStatesを取得
            const existingUserStates = existingUserStatesMap.get(item.id) || [];

            // マージ: APIのデータを優先しつつ、ローカルのみにある既読情報も保持
            const mergedUserStates = [...apiUserStates];
            existingUserStates.forEach((localState) => {
              const existsInApi = apiUserStates.some((apiState) => apiState.userId === localState.userId);
              if (!existsInApi) {
                mergedUserStates.push(localState);
              }
            });

            return {
              ...item,
              userStates: mergedUserStates,
            };
          });

          set({ announcements, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'お知らせ一覧の取得に失敗しました';

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // API統合: アナウンスを作成
      createAnnouncement: async (announcement) => {
        set({ isLoading: true, error: null });

        try {
          // デモモードチェック
          if (process.env.NEXT_PUBLIC_ENV === 'demo' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
            const newAnnouncement: Announcement = {
              ...announcement,
              id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              userStates: [],
            };

            set((state) => ({
              announcements: [...state.announcements, newAnnouncement],
              isLoading: false,
            }));
            return;
          }

          const response = await apiFetch<{ success: boolean; data: Announcement }>(`${API_BASE}?tenantId=demo`, {
            method: 'POST',
            body: JSON.stringify(announcement),
          });

          const createdAnnouncement: Announcement = {
            ...response.data,
            userStates: [],
          };

          set((state) => ({
            announcements: [...state.announcements, createdAnnouncement],
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'お知らせの作成に失敗しました';

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // API統合: アナウンスを更新
      updateAnnouncement: async (id, updates) => {
        set({ isLoading: true, error: null });

        try {
          // デモモードチェック
          if (process.env.NEXT_PUBLIC_ENV === 'demo' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
            set((state) => ({
              announcements: state.announcements.map((announcement) =>
                announcement.id === id
                  ? {
                      ...announcement,
                      ...updates,
                      updatedAt: new Date().toISOString(),
                    }
                  : announcement
              ),
              isLoading: false,
            }));
            return;
          }

          const response = await apiFetch<{ success: boolean; data: Announcement }>(`${API_BASE}/${id}?tenantId=demo`, {
            method: 'PUT',
            body: JSON.stringify(updates),
          });

          const existingAnnouncement = get().announcements.find((a) => a.id === id);
          const updatedAnnouncement: Announcement = {
            ...response.data,
            userStates: existingAnnouncement?.userStates || [],
          };

          set((state) => ({
            announcements: state.announcements.map((announcement) =>
              announcement.id === id ? updatedAnnouncement : announcement
            ),
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'お知らせの更新に失敗しました';

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // API統合: アナウンスを削除
      deleteAnnouncement: async (id) => {
        set({ isLoading: true, error: null });

        try {
          // デモモードチェック
          if (process.env.NEXT_PUBLIC_ENV === 'demo' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
            set((state) => ({
              announcements: state.announcements.filter((announcement) => announcement.id !== id),
              isLoading: false,
            }));
            return;
          }

          await apiFetch<{ success: boolean }>(`${API_BASE}/${id}?tenantId=demo`, {
            method: 'DELETE',
          });

          set((state) => ({
            announcements: state.announcements.filter((announcement) => announcement.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'お知らせの削除に失敗しました';

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // API統合: アナウンスを公開
      publishAnnouncement: async (id) => {
        set({ isLoading: true, error: null });

        try {
          // デモモードチェック
          if (process.env.NEXT_PUBLIC_ENV === 'demo' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
            set((state) => ({
              announcements: state.announcements.map((announcement) =>
                announcement.id === id
                  ? {
                      ...announcement,
                      published: true,
                      publishedAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    }
                  : announcement
              ),
              isLoading: false,
            }));
            return;
          }

          const response = await apiFetch<{ success: boolean; data: Announcement }>(`${API_BASE}/${id}?tenantId=demo`, {
            method: 'PUT',
            body: JSON.stringify({ published: true }),
          });

          const existingAnnouncement = get().announcements.find((a) => a.id === id);
          const updatedAnnouncement: Announcement = {
            ...response.data,
            userStates: existingAnnouncement?.userStates || [],
          };

          set((state) => ({
            announcements: state.announcements.map((announcement) =>
              announcement.id === id ? updatedAnnouncement : announcement
            ),
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'お知らせの公開に失敗しました';

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // API統合: アナウンスを非公開に
      unpublishAnnouncement: async (id) => {
        set({ isLoading: true, error: null });

        try {
          // デモモードチェック
          if (process.env.NEXT_PUBLIC_ENV === 'demo' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
            set((state) => ({
              announcements: state.announcements.map((announcement) =>
                announcement.id === id
                  ? {
                      ...announcement,
                      published: false,
                      updatedAt: new Date().toISOString(),
                    }
                  : announcement
              ),
              isLoading: false,
            }));
            return;
          }

          const response = await apiFetch<{ success: boolean; data: Announcement }>(`${API_BASE}/${id}?tenantId=demo`, {
            method: 'PUT',
            body: JSON.stringify({ published: false }),
          });

          const existingAnnouncement = get().announcements.find((a) => a.id === id);
          const updatedAnnouncement: Announcement = {
            ...response.data,
            userStates: existingAnnouncement?.userStates || [],
          };

          set((state) => ({
            announcements: state.announcements.map((announcement) =>
              announcement.id === id ? updatedAnnouncement : announcement
            ),
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'お知らせの非公開化に失敗しました';

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // API統合: 既読にする
      markAsRead: async (announcementId, userId) => {
        try {
          // デモモードチェック
          if (process.env.NEXT_PUBLIC_ENV === 'demo' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
            set((state) => ({
              announcements: state.announcements.map((announcement) => {
                if (announcement.id !== announcementId) return announcement;

                const existingState = announcement.userStates.find((s) => s.userId === userId);

                if (existingState) {
                  return {
                    ...announcement,
                    userStates: announcement.userStates.map((s) =>
                      s.userId === userId && s.status === 'unread'
                        ? {
                            ...s,
                            status: 'read' as UserAnnouncementStatus,
                            readAt: new Date().toISOString(),
                          }
                        : s
                    ),
                  };
                } else {
                  return {
                    ...announcement,
                    userStates: [
                      ...announcement.userStates,
                      {
                        userId,
                        status: 'read' as UserAnnouncementStatus,
                        readAt: new Date().toISOString(),
                      },
                    ],
                  };
                }
              }),
            }));
            return;
          }

          await apiFetch<{ success: boolean }>(`${API_BASE}/${announcementId}/read?tenantId=demo`, {
            method: 'POST',
            body: JSON.stringify({ userId }),
          });

          // ローカル状態を更新（オプティミスティックアップデート）
          set((state) => ({
            announcements: state.announcements.map((announcement) => {
              if (announcement.id !== announcementId) return announcement;

              const existingState = announcement.userStates.find((s) => s.userId === userId);

              if (existingState) {
                return {
                  ...announcement,
                  userStates: announcement.userStates.map((s) =>
                    s.userId === userId && s.status === 'unread'
                      ? {
                          ...s,
                          status: 'read' as UserAnnouncementStatus,
                          readAt: new Date().toISOString(),
                        }
                      : s
                  ),
                };
              } else {
                return {
                  ...announcement,
                  userStates: [
                    ...announcement.userStates,
                    {
                      userId,
                      status: 'read' as UserAnnouncementStatus,
                      readAt: new Date().toISOString(),
                    },
                  ],
                };
              }
            }),
          }));
        } catch (error) {
          console.error('Failed to mark as read:', error);
          throw error;
        }
      },

      // 完了にする
      markAsCompleted: (announcementId, userId) => {
        set((state) => ({
          announcements: state.announcements.map((announcement) => {
            if (announcement.id !== announcementId) return announcement;

            const existingState = announcement.userStates.find((s) => s.userId === userId);
            const now = new Date().toISOString();

            if (existingState) {
              // 既存の状態を更新
              return {
                ...announcement,
                userStates: announcement.userStates.map((s) =>
                  s.userId === userId
                    ? {
                        ...s,
                        status: 'completed' as UserAnnouncementStatus,
                        readAt: s.readAt || now,
                        completedAt: now,
                      }
                    : s
                ),
              };
            } else {
              // 新しい状態を追加
              return {
                ...announcement,
                userStates: [
                  ...announcement.userStates,
                  {
                    userId,
                    status: 'completed' as UserAnnouncementStatus,
                    readAt: now,
                    completedAt: now,
                  },
                ],
              };
            }
          }),
        }));
      },

      // 全アナウンスを取得
      getAnnouncements: () => {
        return get().announcements;
      },

      // IDで取得
      getAnnouncementById: (id) => {
        return get().announcements.find((announcement) => announcement.id === id);
      },

      // 対象ユーザーのアクティブなアナウンスを取得
      getActiveAnnouncements: (userId, userRoles) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return get().announcements.filter((announcement) => {
          // 公開済みかチェック
          if (!announcement.published) return false;

          // 掲載期間チェック
          const startDate = new Date(announcement.startDate);
          startDate.setHours(0, 0, 0, 0);
          if (startDate > now) return false;

          if (announcement.endDate) {
            const endDate = new Date(announcement.endDate);
            endDate.setHours(0, 0, 0, 0);
            if (endDate < now) return false;
          }

          // 対象ユーザーチェック
          if (announcement.target === 'all') return true;
          if (announcement.target === 'custom') {
            // カスタム対象の場合、ロールチェック
            if (announcement.targetRoles && announcement.targetRoles.length > 0) {
              return announcement.targetRoles.some((role) => userRoles.includes(role));
            }
            return false;
          }
          return userRoles.includes(announcement.target);
        });
      },

      // 未読のアナウンスを取得
      getUnreadAnnouncements: (userId, userRoles) => {
        const activeAnnouncements = get().getActiveAnnouncements(userId, userRoles);

        return activeAnnouncements.filter((announcement) => {
          const userState = announcement.userStates.find((s) => s.userId === userId);
          return !userState || userState.status === 'unread';
        });
      },

      // 対応待ちのアナウンスを取得（requiresAction=trueで未完了）
      getPendingAnnouncements: (userId, userRoles) => {
        const activeAnnouncements = get().getActiveAnnouncements(userId, userRoles);

        return activeAnnouncements.filter((announcement) => {
          if (!announcement.requiresAction) return false;

          const userState = announcement.userStates.find((s) => s.userId === userId);
          return !userState || userState.status !== 'completed';
        });
      },

      // 種別別取得
      getAnnouncementsByType: (type) => {
        return get().announcements.filter((announcement) => announcement.type === type);
      },

      // 優先度別取得
      getAnnouncementsByPriority: (priority) => {
        return get().announcements.filter((announcement) => announcement.priority === priority);
      },

      // ユーザーごとのステータス取得
      getUserStatus: (announcementId, userId) => {
        const announcement = get().announcements.find((a) => a.id === announcementId);
        if (!announcement) return 'unread';

        const userState = announcement.userStates.find((s) => s.userId === userId);
        return userState ? userState.status : 'unread';
      },

      // 統計を取得
      getStats: (userId, userRoles) => {
        const activeAnnouncements = get().getActiveAnnouncements(userId, userRoles);
        const unreadAnnouncements = get().getUnreadAnnouncements(userId, userRoles);
        const pendingAnnouncements = get().getPendingAnnouncements(userId, userRoles);

        const completed = activeAnnouncements.filter((announcement) => {
          const userState = announcement.userStates.find((s) => s.userId === userId);
          return userState && userState.status === 'completed';
        }).length;

        const byPriority = {
          urgent: activeAnnouncements.filter((a) => a.priority === 'urgent').length,
          high: activeAnnouncements.filter((a) => a.priority === 'high').length,
          normal: activeAnnouncements.filter((a) => a.priority === 'normal').length,
          low: activeAnnouncements.filter((a) => a.priority === 'low').length,
        };

        const byType = {
          general: activeAnnouncements.filter((a) => a.type === 'general').length,
          deadline: activeAnnouncements.filter((a) => a.type === 'deadline').length,
          system: activeAnnouncements.filter((a) => a.type === 'system').length,
          event: activeAnnouncements.filter((a) => a.type === 'event').length,
          policy: activeAnnouncements.filter((a) => a.type === 'policy').length,
          emergency: activeAnnouncements.filter((a) => a.type === 'emergency').length,
        };

        return {
          total: activeAnnouncements.length,
          unread: unreadAnnouncements.length,
          pending: pendingAnnouncements.length,
          completed,
          byPriority,
          byType,
        };
      },
    }),
    {
      name: 'announcements-storage',
    }
  )
);

// ラベルマッピング
export const priorityLabels: Record<AnnouncementPriority, string> = {
  urgent: '緊急',
  high: '重要',
  normal: '通常',
  low: '参考',
};

export const typeLabels: Record<AnnouncementType, string> = {
  general: '一般告知',
  deadline: '締切・期限',
  system: 'システム',
  event: 'イベント',
  policy: '規程',
  emergency: '緊急連絡',
};

export const targetLabels: Record<AnnouncementTarget, string> = {
  all: '全社員',
  employee: '一般社員',
  manager: 'マネージャー',
  hr: '人事担当',
  executive: '経営層',
  custom: 'カスタム',
};

// 優先度別カラー
export const priorityColors: Record<AnnouncementPriority, string> = {
  urgent: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950 dark:text-red-300',
  high: 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-950 dark:text-orange-300',
  normal: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  low: 'text-gray-700 bg-gray-50 border-gray-200 dark:bg-gray-950 dark:text-gray-300',
};

// 種別別カラー
export const typeColors: Record<AnnouncementType, string> = {
  general: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  deadline: 'text-orange-600 bg-orange-50 dark:bg-orange-950',
  system: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
  event: 'text-green-600 bg-green-50 dark:bg-green-950',
  policy: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950',
  emergency: 'text-red-600 bg-red-50 dark:bg-red-950',
};
