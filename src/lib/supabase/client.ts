import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  // 本番環境の値を直接設定（環境変数が読み込めない場合のフォールバック）
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kwnybcmrwknjihxhhbso.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bnliY21yd2tuamxoeGhoYnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NDk1OTMsImV4cCI6MjA3MTUyNTU5M30.Bpniq-nuEx0hwZ0O86Gw5T8HjDiOiX-C-nesECHHhMY';
  
  return createBrowserClient<Database>(url, key);
}