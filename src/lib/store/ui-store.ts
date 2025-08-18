import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, Locale, Density, ViewMode } from '@/types';

interface UIState {
  // Theme & Display
  theme: Theme;
  locale: Locale;
  density: Density;
  animationsEnabled: boolean;
  sidebarCollapsed: boolean;
  
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
  setViewMode: (mode: ViewMode) => void;
  setItemsPerPage: (count: number) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  
  // Computed
  getThemeClass: () => string;
  getDensityClass: () => string;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Default values
      theme: 'light',
      locale: 'ja',
      density: 'standard',
      animationsEnabled: true,
      sidebarCollapsed: false,
      defaultViewMode: 'table',
      itemsPerPage: 10,
      commandPaletteOpen: false,
      globalLoading: false,
      
      // Actions
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      },
      
      setLocale: (locale) => {
        set({ locale });
      },
      
      setDensity: (density) => {
        set({ density });
      },
      
      toggleAnimations: () => {
        set((state) => ({ animationsEnabled: !state.animationsEnabled }));
      },
      
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      
      setViewMode: (mode) => {
        set({ defaultViewMode: mode });
      },
      
      setItemsPerPage: (count) => {
        set({ itemsPerPage: count });
      },
      
      setCommandPaletteOpen: (open) => {
        set({ commandPaletteOpen: open });
      },
      
      setGlobalLoading: (loading) => {
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
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
        density: state.density,
        animationsEnabled: state.animationsEnabled,
        sidebarCollapsed: state.sidebarCollapsed,
        defaultViewMode: state.defaultViewMode,
        itemsPerPage: state.itemsPerPage,
      }),
    }
  )
);