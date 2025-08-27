import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  getUserById: (id: string) => User | undefined;
  getUsersByUnit: (unitId: string) => User[];
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      isLoading: false,
      error: null,
      
      // デモモードの初期状態（デフォルトで有効）
      isDemoMode: true,
      currentDemoUser: demoUsers.employee,
      
      setCurrentUser: (user) => {
        set({ currentUser: user });
      },
      
      setUsers: (users) => {
        set({ users });
      },
      
      addUser: (user) => {
        set((state) => ({
          users: [...state.users, user],
        }));
      },
      
      updateUser: (id, updates) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, ...updates } : u
          ),
          currentUser:
            state.currentUser?.id === id
              ? { ...state.currentUser, ...updates }
              : state.currentUser,
        }));
      },
      
      removeUser: (id) => {
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
          currentUser:
            state.currentUser?.id === id ? null : state.currentUser,
        }));
      },
      
      getUserById: (id) => {
        return get().users.find((u) => u.id === id);
      },
      
      getUsersByUnit: (unitId) => {
        return get().users.filter((u) => u.unitId === unitId);
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      // デモ役割切り替え機能
      switchDemoRole: (role) => {
        const demoUser = demoUsers[role];
        set({ 
          currentDemoUser: demoUser,
          isDemoMode: true 
        });
      },
      
      setDemoMode: (enabled) => {
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
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isDemoMode: state.isDemoMode,
        currentDemoUser: state.currentDemoUser,
      }),
    }
  )
);