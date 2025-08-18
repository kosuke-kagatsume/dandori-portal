import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface UserState {
  currentUser: User | null;
  users: User[];
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
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
      }),
    }
  )
);