/**
 * UI ストアのテスト
 */

import { useUIStore } from './ui-store';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Theme, Locale, Density, ViewMode } from '@/types'; // 型定義参照用

describe('UIStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    useUIStore.setState({
      theme: 'light',
      locale: 'ja',
      density: 'standard',
      animationsEnabled: true,
      sidebarCollapsed: false,
      defaultViewMode: 'table',
      itemsPerPage: 10,
      commandPaletteOpen: false,
      globalLoading: false,
    });
  });

  describe('setTheme', () => {
    it('テーマを変更できる', () => {
      const { setTheme } = useUIStore.getState();

      expect(useUIStore.getState().theme).toBe('light');

      setTheme('dark');

      expect(useUIStore.getState().theme).toBe('dark');
    });
  });

  describe('setLocale', () => {
    it('ロケールを変更できる', () => {
      const { setLocale } = useUIStore.getState();

      expect(useUIStore.getState().locale).toBe('ja');

      setLocale('en');

      expect(useUIStore.getState().locale).toBe('en');
    });
  });

  describe('setDensity', () => {
    it('密度を変更できる', () => {
      const { setDensity } = useUIStore.getState();

      expect(useUIStore.getState().density).toBe('standard');

      setDensity('compact');

      expect(useUIStore.getState().density).toBe('compact');

      setDensity('standard');

      expect(useUIStore.getState().density).toBe('standard');
    });
  });

  describe('toggleAnimations', () => {
    it('アニメーションの有効/無効を切り替えられる', () => {
      const { toggleAnimations } = useUIStore.getState();

      expect(useUIStore.getState().animationsEnabled).toBe(true);

      toggleAnimations();

      expect(useUIStore.getState().animationsEnabled).toBe(false);

      toggleAnimations();

      expect(useUIStore.getState().animationsEnabled).toBe(true);
    });
  });

  describe('toggleSidebar', () => {
    it('サイドバーの折りたたみ状態を切り替えられる', () => {
      const { toggleSidebar } = useUIStore.getState();

      expect(useUIStore.getState().sidebarCollapsed).toBe(false);

      toggleSidebar();

      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      toggleSidebar();

      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('setViewMode', () => {
    it('表示モードを変更できる', () => {
      const { setViewMode } = useUIStore.getState();

      expect(useUIStore.getState().defaultViewMode).toBe('table');

      setViewMode('card');

      expect(useUIStore.getState().defaultViewMode).toBe('card');

      setViewMode('table');

      expect(useUIStore.getState().defaultViewMode).toBe('table');
    });
  });

  describe('setItemsPerPage', () => {
    it('ページごとの表示件数を変更できる', () => {
      const { setItemsPerPage } = useUIStore.getState();

      expect(useUIStore.getState().itemsPerPage).toBe(10);

      setItemsPerPage(25);

      expect(useUIStore.getState().itemsPerPage).toBe(25);

      setItemsPerPage(50);

      expect(useUIStore.getState().itemsPerPage).toBe(50);
    });
  });

  describe('setCommandPaletteOpen', () => {
    it('コマンドパレットの開閉状態を切り替えられる', () => {
      const { setCommandPaletteOpen } = useUIStore.getState();

      expect(useUIStore.getState().commandPaletteOpen).toBe(false);

      setCommandPaletteOpen(true);

      expect(useUIStore.getState().commandPaletteOpen).toBe(true);

      setCommandPaletteOpen(false);

      expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    });
  });

  describe('setGlobalLoading', () => {
    it('グローバルローディング状態を切り替えられる', () => {
      const { setGlobalLoading } = useUIStore.getState();

      expect(useUIStore.getState().globalLoading).toBe(false);

      setGlobalLoading(true);

      expect(useUIStore.getState().globalLoading).toBe(true);

      setGlobalLoading(false);

      expect(useUIStore.getState().globalLoading).toBe(false);
    });
  });

  describe('getThemeClass', () => {
    it('lightテーマの場合は空文字を返す', () => {
      const { setTheme, getThemeClass } = useUIStore.getState();

      setTheme('light');

      const themeClass = getThemeClass();
      expect(themeClass).toBe('');
    });

    it('darkテーマの場合は"dark"を返す', () => {
      const { setTheme, getThemeClass } = useUIStore.getState();

      setTheme('dark');

      const themeClass = getThemeClass();
      expect(themeClass).toBe('dark');
    });
  });

  describe('getDensityClass', () => {
    it('密度に応じたクラス名を返す', () => {
      const { setDensity, getDensityClass } = useUIStore.getState();

      setDensity('compact');
      expect(getDensityClass()).toBe('density-compact');

      setDensity('standard');
      expect(getDensityClass()).toBe('density-standard');

      setDensity('standard');
      expect(getDensityClass()).toBe('density-comfortable');
    });
  });

  describe('複合的な状態変更', () => {
    it('複数の設定を同時に変更できる', () => {
      const { setTheme, setLocale, setDensity, toggleAnimations, toggleSidebar } =
        useUIStore.getState();

      setTheme('dark');
      setLocale('en');
      setDensity('compact');
      toggleAnimations(); // true → false
      toggleSidebar(); // false → true

      const state = useUIStore.getState();

      expect(state.theme).toBe('dark');
      expect(state.locale).toBe('en');
      expect(state.density).toBe('compact');
      expect(state.animationsEnabled).toBe(false);
      expect(state.sidebarCollapsed).toBe(true);
    });

    it('状態をリセットできる', () => {
      const { setTheme, setLocale, toggleSidebar } = useUIStore.getState();

      // 変更を加える
      setTheme('dark');
      setLocale('en');
      toggleSidebar();

      // 初期状態に戻す
      useUIStore.setState({
        theme: 'light',
        locale: 'ja',
        sidebarCollapsed: false,
      });

      const state = useUIStore.getState();

      expect(state.theme).toBe('light');
      expect(state.locale).toBe('ja');
      expect(state.sidebarCollapsed).toBe(false);
    });
  });
});
