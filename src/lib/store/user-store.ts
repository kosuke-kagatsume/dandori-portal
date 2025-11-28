import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, DemoUser, UserRole } from '@/types';
import { demoUsers } from '@/lib/demo-users';
import { APIError } from '@/lib/api/client';
import {
  saveTokenData,
  clearTokenData,
  startTokenRefreshTimer,
  stopTokenRefreshTimer,
} from '@/lib/auth/token-manager';
import { userAudit, authAudit } from '@/lib/audit/audit-logger';
import { IS_DEMO_BUILD } from '@/config/demo';

// REST API helper functions
const API_BASE = '/api/users';
const getTenantId = () => 'default-tenant';

async function apiFetchUsers(tenantId: string): Promise<User[]> {
  const params = new URLSearchParams({ tenantId });
  const response = await fetch(`${API_BASE}?${params}`);
  if (!response.ok) {
    throw new Error('ユーザー一覧の取得に失敗しました');
  }
  const result = await response.json();
  return result.data || [];
}

async function apiCreateUser(user: User, tenantId: string): Promise<User> {
  const params = new URLSearchParams({ tenantId });
  const response = await fetch(`${API_BASE}?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    throw new Error('ユーザーの作成に失敗しました');
  }
  const result = await response.json();
  return result.data;
}

async function apiUpdateUser(id: string, updates: Partial<User>): Promise<User> {
  const params = new URLSearchParams({ tenantId: getTenantId() });
  const response = await fetch(`${API_BASE}/${id}?${params}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('ユーザーの更新に失敗しました');
  }
  const result = await response.json();
  return result.data;
}

async function apiDeleteUser(id: string): Promise<void> {
  const params = new URLSearchParams({ tenantId: getTenantId() });
  const response = await fetch(`${API_BASE}/${id}?${params}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('ユーザーの削除に失敗しました');
  }
}

async function apiRetireUser(id: string, retiredDate: string, reason: string): Promise<User> {
  const params = new URLSearchParams({ tenantId: getTenantId() });
  const response = await fetch(`${API_BASE}/${id}?${params}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'retired',
      retiredDate,
      retirementReason: reason,
    }),
  });
  if (!response.ok) {
    throw new Error('ユーザーの退職処理に失敗しました');
  }
  const result = await response.json();
  return result.data;
}

interface UserState {
  currentUser: User | null;
  users: User[];
  // API統合用
  tenantId: string | null;

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

  // API統合アクション
  fetchUsers: () => Promise<void>;

  // 既存アクション（API統合に更新）
  setCurrentUser: (user: User) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  retireUser: (id: string, retiredDate: string, reason: 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other') => Promise<void>;
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
    tenantId: 'tenant-demo-001',
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
      // 本番モード: null、デモモード: デモユーザー
      // IS_DEMO_BUILDを使用することでSSR/CSRで一貫した値になる
      currentUser: IS_DEMO_BUILD ? initialCurrentUser : null,
      users: [],
      isLoading: false,
      error: null,

      // API統合用（本番では認証後にテナントIDが設定される）
      tenantId: IS_DEMO_BUILD ? 'tenant-demo-001' : null,

      // デモモードの初期状態（ビルド時に確定、localStorageからは読み込まない）
      isDemoMode: IS_DEMO_BUILD,
      currentDemoUser: IS_DEMO_BUILD ? demoUsers.employee : null,

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
          // デモモードチェック（ビルド時定数を使用）
          if (IS_DEMO_BUILD) {
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

            // 監査ログ記録
            authAudit.login();

            return;
          }

          // プロダクションモード: REST API で認証
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || 'ログインに失敗しました');
          }

          const { user: apiUser, accessToken, refreshToken: apiRefreshToken, expiresIn } = result.data;

          // APIユーザー情報からアプリ用Userに変換
          const userRole = (apiUser.role as UserRole) || 'employee';

          const user: User = {
            id: apiUser.id,
            tenantId: apiUser.tenantId || 'tenant-demo-001',
            name: apiUser.name || apiUser.email?.split('@')[0] || 'ユーザー',
            email: apiUser.email || '',
            phone: apiUser.phone || '',
            hireDate: apiUser.hireDate || new Date().toISOString().split('T')[0],
            unitId: apiUser.unitId || '1',
            roles: apiUser.roles || [userRole],
            status: 'active',
            timezone: 'Asia/Tokyo',
            avatar: apiUser.avatar || '',
            position: apiUser.position || '',
            department: apiUser.department || '',
          };

          set({
            currentUser: user,
            accessToken: accessToken,
            refreshToken: apiRefreshToken,
            isDemoMode: false,
            currentDemoUser: null,
            isLoading: false,
            _hasHydrated: true,
          });

          // トークンデータを保存（Cookie含む）
          saveTokenData(accessToken, apiRefreshToken, expiresIn || 3600);

          // ユーザーロールをCookieに保存（middleware用）
          if (typeof window !== 'undefined') {
            const expiresDate = new Date(Date.now() + (expiresIn || 3600) * 1000);
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

          // 監査ログ記録
          authAudit.login();
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
        // ログアウト前に監査ログを記録（ユーザー情報がクリアされる前に）
        authAudit.logout();

        set({ isLoading: true, error: null });

        try {
          // デモモードチェック（ビルド時定数を使用）
          if (!IS_DEMO_BUILD) {
            // プロダクションモード: REST API でログアウト
            await fetch('/api/auth/logout', {
              method: 'POST',
            });
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
          // デモモードチェック（ビルド時定数を使用）
          if (IS_DEMO_BUILD) {
            // デモモード: 既存のユーザーを返す
            set({ isLoading: false });
            return;
          }

          // プロダクションモード: REST API でユーザー情報を取得
          const response = await fetch('/api/auth/me');
          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || 'ユーザー情報の取得に失敗しました');
          }

          const apiUser = result.data.user;
          const userRole = (apiUser.role as UserRole) || 'employee';

          const user: User = {
            id: apiUser.id,
            tenantId: apiUser.tenantId || 'tenant-demo-001',
            name: apiUser.name || apiUser.email?.split('@')[0] || 'ユーザー',
            email: apiUser.email || '',
            phone: apiUser.phone || '',
            hireDate: apiUser.hireDate || new Date().toISOString().split('T')[0],
            unitId: apiUser.unitId || '1',
            roles: apiUser.roles || [userRole],
            status: 'active',
            timezone: 'Asia/Tokyo',
            avatar: apiUser.avatar || '',
            position: apiUser.position || '',
            department: apiUser.department || '',
          };

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

      // API統合: ユーザー一覧取得
      fetchUsers: async () => {
        set({ isLoading: true, error: null });

        try {
          // デモモードチェック（ビルド時定数を使用）
          if (IS_DEMO_BUILD) {
            set({ isLoading: false });
            return;
          }

          const state = get();
          if (!state.tenantId) {
            throw new Error('テナントIDが設定されていません');
          }

          const users = await apiFetchUsers(state.tenantId);
          set({ users, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'ユーザー一覧の取得に失敗しました';

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      setUsers: (users: User[]) => {
        set({ users });
      },

      // API統合: ユーザー作成
      addUser: async (user: User) => {
        set({ isLoading: true, error: null });

        try {
          // デモモードチェック（ビルド時定数を使用）
          if (IS_DEMO_BUILD) {
            set((state: UserState) => ({
              users: [...state.users, user],
              isLoading: false,
            }));
            // 監査ログ記録
            userAudit.create(user.id, user.name);
            return;
          }

          const state = get();
          if (!state.tenantId) {
            throw new Error('テナントIDが設定されていません');
          }

          const createdUser = await apiCreateUser(user, state.tenantId);
          set((state: UserState) => ({
            users: [...state.users, createdUser],
            isLoading: false,
          }));
          // 監査ログ記録
          userAudit.create(createdUser.id, createdUser.name);
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'ユーザーの作成に失敗しました';

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // API統合: ユーザー更新
      updateUser: async (id: string, updates: Partial<User>) => {
        set({ isLoading: true, error: null });

        try {
          // デモモードチェック（ビルド時定数を使用）
          if (IS_DEMO_BUILD) {
            const existingUser = get().users.find(u => u.id === id);
            set((state: UserState) => ({
              users: state.users.map((u) =>
                u.id === id ? { ...u, ...updates } : u
              ),
              currentUser:
                state.currentUser?.id === id
                  ? { ...state.currentUser, ...updates }
                  : state.currentUser,
              isLoading: false,
            }));
            // 監査ログ記録
            const changesDescription = Object.keys(updates).join(', ');
            userAudit.update(id, existingUser?.name || id, changesDescription);
            return;
          }

          const existingUser = get().users.find(u => u.id === id);
          const updatedUser = await apiUpdateUser(id, updates);
          set((state: UserState) => ({
            users: state.users.map((u) =>
              u.id === id ? updatedUser : u
            ),
            currentUser:
              state.currentUser?.id === id
                ? updatedUser
                : state.currentUser,
            isLoading: false,
          }));
          // 監査ログ記録
          const changesDescription = Object.keys(updates).join(', ');
          userAudit.update(id, existingUser?.name || updatedUser.name, changesDescription);
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'ユーザーの更新に失敗しました';

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // API統合: ユーザー削除
      removeUser: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          // デモモードチェック（ビルド時定数を使用）
          if (IS_DEMO_BUILD) {
            set((state: UserState) => ({
              users: state.users.filter((u) => u.id !== id),
              currentUser:
                state.currentUser?.id === id ? null : state.currentUser,
              isLoading: false,
            }));
            return;
          }

          await apiDeleteUser(id);
          set((state: UserState) => ({
            users: state.users.filter((u) => u.id !== id),
            currentUser:
              state.currentUser?.id === id ? null : state.currentUser,
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'ユーザーの削除に失敗しました';

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // API統合: ユーザー退職処理
      retireUser: async (id: string, retiredDate: string, reason: 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other') => {
        set({ isLoading: true, error: null });

        const reasonLabels: Record<string, string> = {
          voluntary: '自己都合退職',
          company: '会社都合退職',
          contract_end: '契約期間満了',
          retirement_age: '定年退職',
          other: 'その他',
        };

        try {
          // デモモードチェック（ビルド時定数を使用）
          if (IS_DEMO_BUILD) {
            const existingUser = get().users.find(u => u.id === id);
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
              isLoading: false,
            }));
            // 監査ログ記録
            userAudit.retire(id, existingUser?.name || id, reasonLabels[reason] || reason);
            return;
          }

          const existingUser = get().users.find(u => u.id === id);
          const updatedUser = await apiRetireUser(id, retiredDate, reason);
          set((state: UserState) => ({
            users: state.users.map((u) =>
              u.id === id ? updatedUser : u
            ),
            currentUser:
              state.currentUser?.id === id
                ? updatedUser
                : state.currentUser,
            isLoading: false,
          }));
          // 監査ログ記録
          userAudit.retire(id, existingUser?.name || updatedUser.name, reasonLabels[reason] || reason);
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'ユーザーの退職処理に失敗しました';

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
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
          tenantId: 'tenant-demo-001',
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

        // 監査ログ記録
        authAudit.switchRole(demoUser.name + ' (' + role + ')');
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
      partialize: (state) => {
        // 本番ビルドの場合はisDemoModeとcurrentDemoUserを永続化しない
        // これにより古いlocalStorageの値でDEMOモードになることを防ぐ
        if (!IS_DEMO_BUILD) {
          return {
            currentUser: state.currentUser,
            users: state.users,
            tenantId: state.tenantId,
            // isDemoModeとcurrentDemoUserは永続化しない
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
          };
        }
        // デモビルドの場合は従来通り
        return {
          currentUser: state.currentUser,
          users: state.users,
          tenantId: state.tenantId,
          isDemoMode: state.isDemoMode,
          currentDemoUser: state.currentDemoUser,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
        };
      },
      onRehydrateStorage: () => (state) => {
        // localStorageからの読み込み完了時に呼ばれる
        if (state) {
          // 本番ビルドの場合、localStorageからisDemoMode=trueが読み込まれていても
          // 強制的にfalseにリセットする（Hydrationエラー防止）
          if (!IS_DEMO_BUILD) {
            state.isDemoMode = false;
            state.currentDemoUser = null;
          }
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