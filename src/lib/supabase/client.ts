import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Supabaseクライアントを作成
 * デモモードの場合はダミークライアントを返す
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // デモモードの場合はダミークライアントを返す
  if (isDemoMode) {
    console.log('🎭 Demo mode: Returning dummy Supabase client');
    return createDemoClient();
  }

  // Supabase設定がない場合はエラー
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase configuration missing');
    throw new Error('Supabase URL and Key are required');
  }

  // 本番モード: 実際のSupabaseクライアントを返す
  console.log('🚀 Production mode: Creating real Supabase client');
  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}

/**
 * デモモード用のダミークライアント
 */
function createDemoClient() {
  return {
    auth: {
      signInWithPassword: () => Promise.resolve({
        data: null,
        error: { message: 'Demo mode - use demo authentication' }
      }),
      signUp: () => Promise.resolve({
        data: null,
        error: { message: 'Demo mode - use demo authentication' }
      }),
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
      refreshSession: () => Promise.resolve({ data: { session: null }, error: null }),
      updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
        order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
      }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: 'Demo mode' } }),
        download: () => Promise.resolve({ data: null, error: { message: 'Demo mode' } }),
        remove: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => Promise.resolve({ data: null, error: null }) }),
      subscribe: () => Promise.resolve({ data: null, error: null }),
      unsubscribe: () => Promise.resolve({ data: null, error: null }),
    }),
  } as any;
}