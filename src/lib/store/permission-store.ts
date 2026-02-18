/**
 * Permission Store - Zustand権限ストア
 *
 * 解決済み権限をキャッシュし、権限チェックを高速化する。
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

interface PermissionState {
  // 解決済み権限データ
  resolved: ResolvedPermissions | null;
  // ロード状態
  isLoading: boolean;
  error: string | null;
  // 最終更新時刻
  lastFetchedAt: number | null;

  // アクション
  fetchPermissions: (userId: string, tenantId: string) => Promise<void>;
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

      clear: () => {
        set({ resolved: null, lastFetchedAt: null, error: null });
      },

      // 権限チェック関数
      can: (permissionCode: string) => {
        const state = get();
        return canCheck(permissionCode, state.resolved);
      },

      canMenu: (menuKey: string) => {
        const state = get();
        return canMenuCheck(menuKey, state.resolved);
      },

      canAny: (permissionCodes: string[]) => {
        const state = get();
        return canAnyCheck(permissionCodes, state.resolved);
      },

      canAll: (permissionCodes: string[]) => {
        const state = get();
        return canAllCheck(permissionCodes, state.resolved);
      },

      canResource: (resource: string, action: string) => {
        const state = get();
        return canResourceCheck(resource, action, state.resolved);
      },
    }),
    {
      name: 'dandori-permissions',
      partialize: (state) => ({
        resolved: state.resolved,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
);
