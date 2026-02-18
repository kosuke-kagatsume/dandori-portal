'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  roles?: string[];
  department?: string;
  tenantId?: string;
}

// 認証状態のグローバルキャッシュ（ページ遷移時の重複リクエストを防止）
let authCache: { user: AuthUser | null; checked: boolean; timestamp: number } = {
  user: null,
  checked: false,
  timestamp: 0,
};
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5分間キャッシュ

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(authCache.user);
  const [loading, setLoading] = useState(!authCache.checked);
  const router = useRouter();
  const fetchingRef = useRef(false);

  useEffect(() => {
    const getUser = async () => {
      // キャッシュが有効な場合はAPIを呼ばない
      const now = Date.now();
      if (authCache.checked && (now - authCache.timestamp) < AUTH_CACHE_TTL) {
        setUser(authCache.user);
        setLoading(false);
        return;
      }

      // 既にフェッチ中の場合はスキップ
      if (fetchingRef.current) {
        return;
      }
      fetchingRef.current = true;

      try {
        // REST APIからユーザー情報を取得
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // クッキーを送信
        });

        // 401エラーは静かに処理（コンソールにも出力しない）
        if (response.status === 401) {
          authCache = { user: null, checked: true, timestamp: Date.now() };
          setUser(null);
          return;
        }

        const data = await response.json();

        if (data.success && data.data?.user) {
          authCache = { user: data.data.user, checked: true, timestamp: Date.now() };
          setUser(data.data.user);
        } else {
          authCache = { user: null, checked: true, timestamp: Date.now() };
          setUser(null);
        }
      } catch {
        // ネットワークエラーは静かに処理
        authCache = { user: null, checked: true, timestamp: Date.now() };
        setUser(null);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    getUser();
  }, []);

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    // 現在のロケールを動的に取得
    const currentLocale = typeof window !== 'undefined'
      ? window.location.pathname.split('/')[1] || 'ja'
      : 'ja';
    router.push(`/${currentLocale}/auth/login`);
  };

  return {
    user,
    loading,
    signOut,
  };
}