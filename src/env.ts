import { z } from 'zod';

const EnvSchema = z.object({
  // 必須の環境変数
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
  
  // オプション（サーバーサイドのみ）
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),
  DEMO_LOGIN_TOKEN: z.string().min(32).optional(),
});

// 環境変数の検証とエクスポート
export const ENV = EnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DEMO_LOGIN_TOKEN: process.env.DEMO_LOGIN_TOKEN,
});

// 型エクスポート
export type Env = z.infer<typeof EnvSchema>;