import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  // 本番環境の値を直接設定（環境変数が読み込めない場合のフォールバック）
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kwnybcmrwknjihxhhbso.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bnliY21yd2tuamxoeGhoYnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NDk1OTMsImV4cCI6MjA3MTUyNTU5M30.Bpniq-nuEx0hwZ0O86Gw5T8HjDiOiX-C-nesECHHhMY';

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}