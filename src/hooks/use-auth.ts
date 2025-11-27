'use client';

import { useEffect, useState } from 'react';
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

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        // REST APIからユーザー情報を取得
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.success && data.data?.user) {
          setUser(data.data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to get user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
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