import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, DemoUser, UserRole } from '@/types';
import { demoUsers } from '@/lib/demo-users';
import {
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser as apiGetCurrentUser,
} from '@/lib/api/auth';
import { apiClient, APIError } from '@/lib/api/client';
import {
  saveTokenData,
  clearTokenData,
  startTokenRefreshTimer,
  stopTokenRefreshTimer,
} from '@/lib/auth/token-manager';

interface UserState {
  currentUser: User | null;
  users: User[];
  // デモ用の役割管理
  isDemoMode: boolean;
  currentDemoUser: DemoUser | null;
  switchDemoRole: (role: UserRole) => void;
  setDemoMode: (enabled: boolean) => void;

  // 認証トークン管理
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;

  // 認証アクション
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  isAuthenticated: () => boolean;

  setCurrentUser: (user: User) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  removeUser: (id: string) => void;
  retireUser: (id: string, retiredDate: string, reason: 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other') => void;
  getUserById: (id: string) => User | undefined;
  getUsersByUnit: (unitId: string) => User[];
  getActiveUsers: () => User[];
  getRetiredUsers: () => User[];
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // localStorageからの読み込み完了フラグ
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

// SSR対応: サーバーではpersistを無効化
const createUserStore = () => {
  // 初期デモユーザー（employee）のcurrentUser形式を作成
  const initialDemoUser = demoUsers.employee;
  const initialCurrentUser: User = {
    id: initialDemoUser.id,
    name: initialDemoUser.name,
    email: initialDemoUser.email,
    phone: '090-1234-5678',
    hireDate: '2020-04-01',
    unitId: '1',
    roles: ['employee'],
    status: 'active',
    timezone: 'Asia/Tokyo',
    avatar: initialDemoUser.avatar || '',
    position: 'スタッフ',
    department: initialDemoUser.department,
  };

  const storeCreator = (set: (partial: Partial<UserState> | ((state: UserState) => Partial<UserState>)) => void, get: () => UserState): UserState => ({
      currentUser: initialCurrentUser,
      users: [],
      isLoading: false,
      error: null,

      // デモモードの初期状態（デフォルトで有効）
      isDemoMode: true,
      currentDemoUser: demoUsers.employee,

      // 認証トークン
      accessToken: null,
      refreshToken: null,

      // ハイドレーション状態（初期はfalse）
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      // トークン設定
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        // apiClientにもトークンを設定
        apiClient.setToken(accessToken);
      },

      // ログイン
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // デモモードチェック
          if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
            // デモモード: ハードコードされたユーザーを使用
            set({
              currentUser: initialCurrentUser,
              isDemoMode: true,
              currentDemoUser: demoUsers.employee,
              isLoading: false,
            });

            // デモモード用のCookie保存（middleware用）
            if (typeof window !== 'undefined') {
              const userRole = initialCurrentUser.roles[0] || 'employee';
              document.cookie = `user_role=${userRole}; path=/; SameSite=Lax`;
            }

            return;
          }

          // プロダクションモード: API呼び出し
          const { user, accessToken, refreshToken: refreshTokenValue, expiresIn } = await apiLogin({ email, password });

          set({
            currentUser: user,
            accessToken,
            refreshToken: refreshTokenValue,
            isDemoMode: false,
            currentDemoUser: null,
            isLoading: false,
          });

          // apiClientにトークンを設定
          apiClient.setToken(accessToken);

          // トークンデータを保存（Cookie含む）
          saveTokenData(accessToken, refreshTokenValue, expiresIn);

          // ユーザーロールをCookieに保存（middleware用）
          if (typeof window !== 'undefined' && user.roles.length > 0) {
            const userRole = user.roles[0];
            const expiresDate = new Date(Date.now() + expiresIn * 1000);
            document.cookie = `user_role=${userRole}; path=/; expires=${expiresDate.toUTCString()}; SameSite=Lax; Secure`;
          }

          // トークンリフレッシュタイマーを開始
          startTokenRefreshTimer(
            (newAccessToken, newRefreshToken) => {
              // リフレッシュ成功時: ストアを更新
              set({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
              });
            },
            () => {
              // リフレッシュ失敗時: ログアウト
              const logoutFn = get().logout;
              logoutFn();
            }
          );
        } catch (error) {
          const errorMessage = error instanceof APIError
            ? error.message
            : error instanceof Error
            ? error.message
            : 'ログインに失敗しました';

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // ログアウト
      logout: async () => {
        set({ isLoading: true, error: null });

        try {
          // デモモードチェック
          if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
            // プロダクションモード: API呼び出し
            await apiLogout();
          }

          // トークンリフレッシュタイマーを停止
          stopTokenRefreshTimer();

          // トークンデータをクリア
          clearTokenData();

          // ユーザーロールCookieもクリア
          if (typeof window !== 'undefined') {
            document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }

          // トークンとユーザー情報をクリア
          set({
            currentUser: null,
            accessToken: null,
            refreshToken: null,
            isDemoMode: false,
            currentDemoUser: null,
            isLoading: false,
          });

          // apiClientのトークンもクリア
          apiClient.setToken(null);
        } catch (error) {
          const errorMessage = error instanceof APIError
            ? error.message
            : error instanceof Error
            ? error.message
            : 'ログアウトに失敗しました';

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // 現在のユーザー情報を取得
      fetchCurrentUser: async () => {
        set({ isLoading: true, error: null });

        try {
          // デモモードチェック
          if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
            // デモモード: 既存のユーザーを返す
            set({ isLoading: false });
            return;
          }

          // プロダクションモード: API呼び出し
          const user = await apiGetCurrentUser();

          set({
            currentUser: user,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof APIError
            ? error.message
            : error instanceof Error
            ? error.message
            : 'ユーザー情報の取得に失敗しました';

          set({
            error: errorMessage,
            isLoading: false,
            currentUser: null,
            accessToken: null,
            refreshToken: null,
          });
          throw error;
        }
      },

      // 認証状態チェック
      isAuthenticated: () => {
        const state = get();
        return state.isDemoMode || (state.currentUser !== null && state.accessToken !== null);
      },

      setCurrentUser: (user: User) => {
        set({ currentUser: user });
      },

      setUsers: (users: User[]) => {
        set({ users });
      },

      addUser: (user: User) => {
        set((state: UserState) => ({
          users: [...state.users, user],
        }));
      },

      updateUser: (id: string, updates: Partial<User>) => {
        set((state: UserState) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, ...updates } : u
          ),
          currentUser:
            state.currentUser?.id === id
              ? { ...state.currentUser, ...updates }
              : state.currentUser,
        }));
      },

      removeUser: (id: string) => {
        set((state: UserState) => ({
          users: state.users.filter((u) => u.id !== id),
          currentUser:
            state.currentUser?.id === id ? null : state.currentUser,
        }));
      },

      retireUser: (id: string, retiredDate: string, reason: 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other') => {
        set((state: UserState) => ({
          users: state.users.map((u) =>
            u.id === id
              ? {
                  ...u,
                  status: 'retired' as const,
                  retiredDate,
                  retirementReason: reason,
                }
              : u
          ),
          currentUser:
            state.currentUser?.id === id
              ? {
                  ...state.currentUser,
                  status: 'retired' as const,
                  retiredDate,
                  retirementReason: reason,
                }
              : state.currentUser,
        }));
      },

      getUserById: (id: string) => {
        return get().users.find((u) => u.id === id);
      },

      getUsersByUnit: (unitId: string) => {
        return get().users.filter((u) => u.unitId === unitId);
      },

      getActiveUsers: () => {
        return get().users.filter((u) => u.status === 'active');
      },

      getRetiredUsers: () => {
        return get().users.filter((u) => u.status === 'retired');
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      // デモ役割切り替え機能
      switchDemoRole: (role: UserRole) => {
        const demoUser = demoUsers[role];
        // currentUserも同時に更新（サイドバーのRBACチェック用）
        const currentUser: User = {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          phone: '090-1234-5678',
          hireDate: '2020-04-01',
          unitId: '1',
          roles: [role], // ロールを配列で設定
          status: 'active',
          timezone: 'Asia/Tokyo',
          avatar: demoUser.avatar || '',
          position: demoUser.role === 'admin' ? 'システム管理者' :
                    demoUser.role === 'manager' ? 'マネージャー' :
                    demoUser.role === 'executive' ? '社長' :
                    demoUser.role === 'hr' ? '人事担当' :
                    demoUser.role === 'applicant' ? '新入社員' : 'スタッフ',
          department: demoUser.department,
        };

        // ロールCookieも更新（middleware用）
        if (typeof window !== 'undefined') {
          document.cookie = `user_role=${role}; path=/; SameSite=Lax`;
        }

        set({
          currentDemoUser: demoUser,
          currentUser,
          isDemoMode: true
        });
      },

      setDemoMode: (enabled: boolean) => {
        if (enabled) {
          // デモモード有効化時、デフォルトで一般社員
          set({
            isDemoMode: true,
            currentDemoUser: demoUsers.employee
          });
        } else {
          set({
            isDemoMode: false,
            currentDemoUser: null
          });
        }
      },
  });

  // SSR時はpersistを使わない（ハイドレーション完了扱いにする）
  if (typeof window === 'undefined') {
    const store = create<UserState>()(storeCreator);
    // SSR時は即座にハイドレーション完了にする
    store.getState().setHasHydrated(true);
    return store;
  }

  // クライアントサイドではpersistを使用
  return create<UserState>()(
    persist(storeCreator, {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users, // ユーザー配列も永続化
        isDemoMode: state.isDemoMode,
        currentDemoUser: state.currentDemoUser,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        // localStorageからの読み込み完了時に呼ばれる
        if (state) {
          state.setHasHydrated(true);
          // トークンがある場合、apiClientにも設定
          if (state.accessToken) {
            apiClient.setToken(state.accessToken);
          }
        }
      },
    })
  );
};

export const useUserStore = createUserStore();