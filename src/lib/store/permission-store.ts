/**
 * Permission Store - Zustand権限ストア
 *
 * 解決済み権限をキャッシュし、権限チェックを高速化する。
 * デモモードではハードコードにフォールバック。
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ResolvedPermissions,
  can as canCheck,
  canMenu as canMenuCheck,
  canAny as canAnyCheck,
  canAll as canAllCheck,
  canResource as canResourceCheck,
  resolvePermissions,
} from '@/lib/rbac-v2';
import { hasMenuAccess, hasPermission, type UserRole, type MenuKey, type Permission } from '@/lib/rbac';

interface PermissionState {
  // 解決済み権限データ
  resolved: ResolvedPermissions | null;
  // ロード状態
  isLoading: boolean;
  error: string | null;
  // 最終更新時刻
  lastFetchedAt: number | null;
  // デモモードフラグ
  isDemoMode: boolean;
  // デモモード用のユーザーロール
  demoRole: UserRole | null;

  // アクション
  fetchPermissions: (userId: string, tenantId: string) => Promise<void>;
  setDemoMode: (isDemoMode: boolean, role?: UserRole) => void;
  clear: () => void;

  // 権限チェック
  can: (permissionCode: string) => boolean;
  canMenu: (menuKey: string) => boolean;
  canAny: (permissionCodes: string[]) => boolean;
  canAll: (permissionCodes: string[]) => boolean;
  canResource: (resource: string, action: string) => boolean;
}

const CACHE_TTL = 5 * 60 * 1000; // 5分

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      resolved: null,
      isLoading: false,
      error: null,
      lastFetchedAt: null,
      isDemoMode: false,
      demoRole: null,

      fetchPermissions: async (userId: string, tenantId: string) => {
        const state = get();
        // キャッシュが有効ならスキップ
        if (
          state.resolved &&
          state.lastFetchedAt &&
          Date.now() - state.lastFetchedAt < CACHE_TTL &&
          state.resolved.userId === userId
        ) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const resolved = await resolvePermissions(userId, tenantId);
          set({
            resolved,
            isLoading: false,
            lastFetchedAt: Date.now(),
          });
        } catch (e) {
          set({
            isLoading: false,
            error: e instanceof Error ? e.message : '権限取得に失敗しました',
          });
        }
      },

      setDemoMode: (isDemoMode: boolean, role?: UserRole) => {
        set({ isDemoMode, demoRole: role || null });
      },

      clear: () => {
        set({ resolved: null, lastFetchedAt: null, error: null });
      },

      // 権限チェック関数（デモモードフォールバック付き）
      can: (permissionCode: string) => {
        const state = get();
        if (state.isDemoMode && state.demoRole) {
          // デモモード: 旧rbac.tsのPERMISSIONSでチェック
          // permissionCode を旧形式に変換試行
          return hasPermission(state.demoRole, permissionCode as Permission);
        }
        return canCheck(permissionCode, state.resolved);
      },

      canMenu: (menuKey: string) => {
        const state = get();
        if (state.isDemoMode && state.demoRole) {
          return hasMenuAccess(state.demoRole, menuKey as MenuKey);
        }
        return canMenuCheck(menuKey, state.resolved);
      },

      canAny: (permissionCodes: string[]) => {
        const state = get();
        if (state.isDemoMode) return false;
        return canAnyCheck(permissionCodes, state.resolved);
      },

      canAll: (permissionCodes: string[]) => {
        const state = get();
        if (state.isDemoMode) return false;
        return canAllCheck(permissionCodes, state.resolved);
      },

      canResource: (resource: string, action: string) => {
        const state = get();
        if (state.isDemoMode) return false;
        return canResourceCheck(resource, action, state.resolved);
      },
    }),
    {
      name: 'dandori-permissions',
      partialize: (state) => ({
        resolved: state.resolved,
        lastFetchedAt: state.lastFetchedAt,
        isDemoMode: state.isDemoMode,
        demoRole: state.demoRole,
      }),
    }
  )
);
