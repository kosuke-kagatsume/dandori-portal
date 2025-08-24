# Supabase Setup Guide for Dandori Portal

## 1. Authentication URL Configuration
Supabase Dashboard → Authentication → URL Configuration

### Site URL
```
https://dandori-portal.vercel.app
```

### Redirect URLs (すべて追加してください)
```
# 本番環境
https://dandori-portal.vercel.app/auth/callback
https://dandori-portal.vercel.app/**

# Vercelプレビュー環境
# ワイルドカードが使える場合（推奨）
https://*-kosukes-projects-c6ad92ba.vercel.app/**
https://*-kosukes-projects-c6ad92ba.vercel.app/auth/callback

# ワイルドカードが使えない場合は個別に追加
# 例:
# https://dandori-portal-qbef07372-kosukes-projects-c6ad92ba.vercel.app/**
# https://dandori-portal-ocz37fjx7-kosukes-projects-c6ad92ba.vercel.app/**

# ローカル開発環境
http://localhost:3000/**
http://localhost:3000/auth/callback
http://localhost:3001/**
http://localhost:3001/auth/callback
http://localhost:3002/**
http://localhost:3002/auth/callback
http://localhost:3003/**
http://localhost:3003/auth/callback
http://localhost:3004/**
http://localhost:3004/auth/callback
http://localhost:3005/**
http://localhost:3005/auth/callback
http://localhost:3006/**
http://localhost:3006/auth/callback
```

## 2. Database Setup (SQL Editor で実行)

### Profiles テーブルとRLS設定
```sql
-- profiles テーブル（user_idと1:1）
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  organization_id UUID REFERENCES public.organizations(id),
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールは自分だけ読める
CREATE POLICY "Users can view own profile" 
  ON public.profiles
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 自分のプロフィールは自分だけ作成できる
CREATE POLICY "Users can insert own profile" 
  ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 自分のプロフィールは自分だけ更新できる
CREATE POLICY "Users can update own profile" 
  ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- サインアップ時に自動でプロフィール作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles(
    user_id, 
    full_name, 
    role,
    organization_id,
    department
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Demo User'),
    COALESCE(new.raw_user_meta_data->>'role', 'demo'),
    '11111111-1111-1111-1111-111111111111'::UUID, -- デモ組織ID
    COALESCE(new.raw_user_meta_data->>'department', '営業部')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- トリガーの削除と再作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- デモ組織が存在しない場合は作成
INSERT INTO public.organizations (id, name, slug)
VALUES ('11111111-1111-1111-1111-111111111111', 'デモ組織', 'demo')
ON CONFLICT (id) DO NOTHING;
```

## 3. API Keys の取得場所
Supabase Dashboard → Settings → API

- **anon (public)**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` として使用
- **service_role (secret)**: `SUPABASE_SERVICE_ROLE_KEY` として使用（サーバーサイドのみ）

## 4. Vercel環境変数設定

### 本番環境 (Production)
```
NEXT_PUBLIC_SUPABASE_URL=https://kwnybcmrwknjihxhhbso.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key from Supabase]
SUPABASE_SERVICE_ROLE_KEY=[service role key from Supabase]
DEMO_LOGIN_TOKEN=2b723ccc348073981432fcc0741efcd05c50915144d7d144e16e3cf384a85134
```

### プレビュー環境 (Preview) - 同じ値を設定
上記と同じ値を設定してください。

## 5. デモログインのテスト

### ローカル環境
```bash
# APIエンドポイントの確認
curl -X GET http://localhost:3002/api/auth/demo-login

# デモログイン実行
curl -X POST http://localhost:3002/api/auth/demo-login \
  -H "Authorization: Bearer 2b723ccc348073981432fcc0741efcd05c50915144d7d144e16e3cf384a85134" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@dandori.local","password":"demo-demo-demo"}'
```

### 本番環境
```bash
curl -X POST https://dandori-portal.vercel.app/api/auth/demo-login \
  -H "Authorization: Bearer 2b723ccc348073981432fcc0741efcd05c50915144d7d144e16e3cf384a85134" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@dandori.local","password":"demo-demo-demo"}'
```

## 6. トラブルシューティング

### "fetch failed" エラーの場合
1. SUPABASE_SERVICE_ROLE_KEYが正しく設定されているか確認
2. Supabase URLが正しいか確認
3. Supabaseのネットワーク設定でIPが許可されているか確認

### リダイレクトループの場合
1. Redirect URLsが正しく設定されているか確認
2. middlewareがAPIルートを除外しているか確認

### デモユーザーが作成されない場合
1. Service Role Keyが正しいか確認
2. profilesテーブルとトリガーが作成されているか確認
3. organizationsテーブルにデモ組織が存在するか確認

## 7. セキュリティ注意事項

- `DEMO_LOGIN_TOKEN`は本番環境で変更することを推奨
- `SUPABASE_SERVICE_ROLE_KEY`は絶対にクライアントサイドで使用しない
- 本番環境ではVercel ProtectionまたはIP制限を検討

## 8. プロジェクトIDについて

Vercelプレビュー環境のURLパターン:
- `https://[デプロイメントID]-[プロジェクトID].vercel.app`
- 例: `https://dandori-portal-qbef07372-kosukes-projects-c6ad92ba.vercel.app`

プロジェクトID: `kosukes-projects-c6ad92ba`

このIDを使ってワイルドカードURLを設定できます。