'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 現在のユーザーを取得
    const getUser = async () => {
      // まずSupabaseから取得を試みる
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
      } else {
        // Supabaseユーザーがいない場合、デモユーザーをチェック
        const demoUserStr = localStorage.getItem('demo_user');
        if (demoUserStr) {
          // デモユーザーをSupabase User型に変換
          const demoUser = JSON.parse(demoUserStr);
          setUser({
            id: demoUser.id,
            email: demoUser.email,
            user_metadata: {
              name: demoUser.name,
              department: demoUser.department,
              role: demoUser.role,
            },
          } as any);
        }
      }
      setLoading(false);
    };

    getUser();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      // ログアウト時はログインページへ
      if (!session?.user) {
        router.push('/auth/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const signOut = async () => {
    // Supabaseからサインアウト
    await supabase.auth.signOut();
    // デモユーザー情報もクリア
    localStorage.removeItem('demo_user');
    // Cookieもクリア
    if (typeof window !== 'undefined') {
      document.cookie = 'demo_user=; path=/; max-age=0';
    }
    router.push('/auth/login');
  };

  return {
    user,
    loading,
    signOut,
  };
}