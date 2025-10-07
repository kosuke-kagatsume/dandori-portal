import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  // デモモードまたはSupabase設定が無効な場合はダミークライアントを返す
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase not configured, returning demo client');
    // ダミークライアントを返す（デモモード用）
    return {
      auth: {
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Demo mode' } }),
        signUp: () => Promise.resolve({ data: null, error: { message: 'Demo mode' } }),
        signOut: () => Promise.resolve({ error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({
          data: { 
            subscription: {
              unsubscribe: () => {
                console.log('Demo mode: unsubscribe called');
              }
            }
          }
        }),
      },
      from: () => ({
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
      }),
    } as any;
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}