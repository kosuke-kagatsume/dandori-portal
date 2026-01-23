import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Theme, Locale, Density, ViewMode } from '@/types';

interface UIState {
  // Theme & Display
  theme: Theme;
  locale: Locale;
  density: Density;
  animationsEnabled: boolean;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;

  // View preferences
  defaultViewMode: ViewMode;
  itemsPerPage: number;

  // Modal & Dialog states
  commandPaletteOpen: boolean;

  // Loading states
  globalLoading: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  setDensity: (density: Density) => void;
  toggleAnimations: () => void;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setItemsPerPage: (count: number) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;

  // Computed
  getThemeClass: () => string;
  getDensityClass: () => string;
}

// SSR対応: サーバーではpersistを無効化
const createUIStore = () => {
  const storeCreator = (set: (partial: Partial<UIState> | ((state: UIState) => Partial<UIState>)) => void, get: () => UIState): UIState => ({
      // Default values
      theme: 'light' as Theme,
      locale: 'ja' as Locale,
      density: 'standard' as Density,
      animationsEnabled: true,
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      defaultViewMode: 'table' as ViewMode,
      itemsPerPage: 10,
      commandPaletteOpen: false,
      globalLoading: false,

      // Actions
      setTheme: (theme: Theme) => {
        set({ theme });
        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      },

      setLocale: (locale: Locale) => {
        set({ locale });
      },

      setDensity: (density: Density) => {
        set({ density });
      },

      toggleAnimations: () => {
        set((state: UIState) => ({ animationsEnabled: !state.animationsEnabled }));
      },

      toggleSidebar: () => {
        set((state: UIState) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      toggleMobileSidebar: () => {
        set((state: UIState) => ({ mobileSidebarOpen: !state.mobileSidebarOpen }));
      },

      setMobileSidebarOpen: (open: boolean) => {
        set({ mobileSidebarOpen: open });
      },

      setViewMode: (mode: ViewMode) => {
        set({ defaultViewMode: mode });
      },

      setItemsPerPage: (count: number) => {
        set({ itemsPerPage: count });
      },

      setCommandPaletteOpen: (open: boolean) => {
        set({ commandPaletteOpen: open });
      },

      setGlobalLoading: (loading: boolean) => {
        set({ globalLoading: loading });
      },

      // Computed
      getThemeClass: () => {
        const { theme } = get();
        return theme === 'dark' ? 'dark' : '';
      },

      getDensityClass: () => {
        const { density } = get();
        return `density-${density}`;
      },
  });

  // SSR時はpersistを使わない
  if (typeof window === 'undefined') {
    return create<UIState>()(storeCreator);
  }

  // クライアントサイドではpersistを使用
  return create<UIState>()(
    persist(storeCreator, {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      // SSR/CSRの状態不一致を防ぐため、自動ハイドレーションを無効化
      // HydrationProviderで明示的にrehydrateを呼び出す
      skipHydration: true,
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
        density: state.density,
        animationsEnabled: state.animationsEnabled,
        sidebarCollapsed: state.sidebarCollapsed,
        defaultViewMode: state.defaultViewMode,
        itemsPerPage: state.itemsPerPage,
      }),
    })
  );
};

export const useUIStore = createUIStore();