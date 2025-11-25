/**
 * Tenant Context Store
 *
 * 現在アクセスしているテナントのコンテキストを管理するストア
 * サブドメインから自動識別されたテナントIDを保持し、
 * アプリケーション全体で使用可能にする
 */

import { create } from 'zustand';
import { useEffect, useState } from 'react';

interface TenantContextState {
  /** 現在のテナントID */
  currentTenantId: string | null;

  /** 現在のサブドメイン */
  currentSubdomain: string | null;

  /** テナント情報の読み込み状態 */
  isLoading: boolean;

  /** テナント情報を設定 */
  setTenantContext: (tenantId: string, subdomain: string | null) => void;

  /** テナント情報をクリア */
  clearTenantContext: () => void;
}

/**
 * Tenant Context Store
 *
 * Middlewareで設定されたテナント情報（Cookie）を読み取り、
 * アプリケーション全体で利用可能にする
 */
export const useTenantContextStore = create<TenantContextState>((set) => ({
  currentTenantId: null,
  currentSubdomain: null,
  isLoading: true,

  setTenantContext: (tenantId, subdomain) =>
    set({
      currentTenantId: tenantId,
      currentSubdomain: subdomain,
      isLoading: false,
    }),

  clearTenantContext: () =>
    set({
      currentTenantId: null,
      currentSubdomain: null,
      isLoading: false,
    }),
}));

/**
 * Cookieからテナント情報を読み取る
 */
function getTenantFromCookie(): {
  tenantId: string | null;
  subdomain: string | null;
} {
  if (typeof document === 'undefined') {
    return { tenantId: null, subdomain: null };
  }

  try {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    return {
      tenantId: cookies['x-tenant-id'] || null,
      subdomain: cookies['x-subdomain'] || null,
    };
  } catch (error) {
    console.error('[TenantContext] Failed to read tenant from cookie:', error);
    return { tenantId: null, subdomain: null };
  }
}

/**
 * テナントコンテキストを自動初期化するカスタムフック
 *
 * アプリケーション起動時に一度だけ呼び出す
 */
export function useTenantContextInit() {
  const { setTenantContext, clearTenantContext } = useTenantContextStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    const { tenantId, subdomain } = getTenantFromCookie();

    if (tenantId) {
      console.log('[TenantContext] Initialized:', { tenantId, subdomain });
      setTenantContext(tenantId, subdomain);
    } else {
      console.warn('[TenantContext] No tenant info found in cookie');
      clearTenantContext();
    }

    setInitialized(true);
  }, [initialized, setTenantContext, clearTenantContext]);
}

/**
 * 現在のテナントIDを取得するヘルパー関数
 */
export function useCurrentTenantId(): string | null {
  return useTenantContextStore((state) => state.currentTenantId);
}

/**
 * 現在のサブドメインを取得するヘルパー関数
 */
export function useCurrentSubdomain(): string | null {
  return useTenantContextStore((state) => state.currentSubdomain);
}

/**
 * テナント情報の読み込み状態を取得
 */
export function useTenantLoading(): boolean {
  return useTenantContextStore((state) => state.isLoading);
}

/**
 * テナント情報の完全な情報を取得
 */
export function useTenantContext() {
  return useTenantContextStore((state) => ({
    tenantId: state.currentTenantId,
    subdomain: state.currentSubdomain,
    isLoading: state.isLoading,
  }));
}
