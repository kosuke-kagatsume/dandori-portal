'use client';

/**
 * usePermissions - 権限チェック用Reactフック
 *
 * Zustandストアを利用して解決済み権限をキャッシュし、
 * 権限チェック関数を提供する。
 *
 * 使用例:
 *   const { can, canMenu, isLoading } = usePermissions();
 *   if (can('payroll:read:company')) { ... }
 *   if (canMenu('attendance')) { ... }
 */

import { useEffect } from 'react';
import { usePermissionStore } from '@/lib/store/permission-store';

interface UsePermissionsOptions {
  userId?: string;
  tenantId?: string;
  /** trueの場合、デモモードとして旧rbac.tsを使用 */
  demoMode?: boolean;
  /** デモモードのロール */
  demoRole?: string;
}

export function usePermissions(options?: UsePermissionsOptions) {
  const store = usePermissionStore();

  useEffect(() => {
    if (options?.demoMode) {
      store.setDemoMode(
        true,
        (options.demoRole as Parameters<typeof store.setDemoMode>[1]) || undefined
      );
      return;
    }

    if (options?.userId && options?.tenantId) {
      store.fetchPermissions(options.userId, options.tenantId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.userId, options?.tenantId, options?.demoMode, options?.demoRole]);

  return {
    /** 特定の権限コードを持つかチェック */
    can: store.can,
    /** メニュー表示権限チェック */
    canMenu: store.canMenu,
    /** いずれかの権限があるかチェック */
    canAny: store.canAny,
    /** 全ての権限があるかチェック */
    canAll: store.canAll,
    /** リソース×アクションの権限チェック */
    canResource: store.canResource,
    /** 解決済み権限データ */
    resolved: store.resolved,
    /** ロード中フラグ */
    isLoading: store.isLoading,
    /** エラー */
    error: store.error,
    /** 権限を再取得 */
    refresh: () => {
      store.clear();
      if (options?.userId && options?.tenantId) {
        store.fetchPermissions(options.userId, options.tenantId);
      }
    },
  };
}
