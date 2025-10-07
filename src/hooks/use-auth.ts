'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // デモモードかチェック
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || 
                    !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    const getUser = async () => {
      if (isDemoMode) {
        // デモモードの場合はCookieからのみユーザー取得
        const getDemoUserFromCookie = () => {
          try {
            const value = document.cookie
              .split('; ')
              .find(row => row.startsWith('demo_session='));
            
            if (value) {
              const cookieValue = value.split('=')[1];
              return JSON.parse(decodeURIComponent(cookieValue));
            }
            return null;
          } catch (error) {
            console.error('Failed to parse demo session cookie:', error);
            return null;
          }
        };

        const demoUser = getDemoUserFromCookie();
        if (demoUser && demoUser.user_metadata) {
          setUser({
            id: demoUser.id,
            email: demoUser.email,
            user_metadata: {
              name: demoUser.user_metadata.name,
              department: demoUser.user_metadata.department,
              role: demoUser.user_metadata.role,
            },
          } as any);
        }
      } else {
        // 本番モードの場合のみSupabaseを使用
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // 認証状態の変更を監視
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          
          if (!session?.user) {
            router.push('/auth/login');
          }
        });

        return () => subscription.unsubscribe();
      }
      
      setLoading(false);
    };

    getUser();
  }, [router, isDemoMode]);

  const signOut = async () => {
    if (isDemoMode) {
      // デモモード: Cookieのみクリア
      if (typeof window !== 'undefined') {
        document.cookie = 'demo_session=; path=/; max-age=0';
      }
    } else {
      // 本番モード: Supabaseからサインアウト
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    
    router.push('/auth/login');
  };

  return {
    user,
    loading,
    signOut,
  };
}