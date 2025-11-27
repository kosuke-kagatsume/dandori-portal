import { z } from 'zod';

const EnvSchema = z.object({
  // 必須の環境変数
  DATABASE_URL: z.string().url().optional(),

  // オプション（認証用）
  JWT_SECRET: z.string().min(32).optional(),
  DEMO_LOGIN_TOKEN: z.string().min(32).optional(),

  // AWS S3（ファイルストレージ用）
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
});

// 環境変数の検証とエクスポート
export const ENV = EnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  DEMO_LOGIN_TOKEN: process.env.DEMO_LOGIN_TOKEN,
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
});

// 型エクスポート
export type Env = z.infer<typeof EnvSchema>;
