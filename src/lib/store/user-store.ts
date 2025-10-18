import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, DemoUser, UserRole } from '@/types';
import { demoUsers } from '@/lib/demo-users';

interface UserState {
  currentUser: User | null;
  users: User[];
  // デモ用の役割管理
  isDemoMode: boolean;
  currentDemoUser: DemoUser | null;
  switchDemoRole: (role: UserRole) => void;
  setDemoMode: (enabled: boolean) => void;

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

      // ハイドレーション状態（初期はfalse）
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
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
      }),
      onRehydrateStorage: () => (state) => {
        // localStorageからの読み込み完了時に呼ばれる
        state?.setHasHydrated(true);
      },
    })
  );
};

export const useUserStore = createUserStore();