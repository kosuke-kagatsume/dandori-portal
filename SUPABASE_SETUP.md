# Supabase Setup Guide

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://app.supabase.com)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクト名: `dandori-portal`
4. データベースパスワードを設定（安全な場所に保存）
5. リージョン: `Northeast Asia (Tokyo)`を選択

## 2. データベースのセットアップ

### SQLエディタで実行

1. Supabaseダッシュボード → SQL Editor
2. `supabase/migrations/001_initial_schema.sql`の内容をコピー&ペースト
3. 実行

### デモデータの投入（オプション）

1. SQL Editorで`supabase/seed.sql`の内容を実行
2. デモユーザーのパスワードは全て`demo1234`

## 3. 環境変数の設定

### ローカル開発用

1. `.env.local.example`を`.env.local`にコピー
```bash
cp .env.local.example .env.local
```

2. Supabaseダッシュボード → Settings → API から以下を取得：
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/Public Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`（オプション）

### Vercel用

1. Vercelダッシュボード → Settings → Environment Variables
2. 同じ環境変数を設定

## 4. 認証の設定

### Email認証を有効化

1. Supabase → Authentication → Providers
2. Email認証を有効化
3. "Confirm email"を無効化（開発用）

### デモユーザーの作成

SQL Editorで実行：
```sql
-- デモユーザーをAuth側に作成
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'tanaka@demo.com', crypt('demo1234', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'sato@demo.com', crypt('demo1234', gen_salt('bf')), NOW(), NOW(), NOW());
```

## 5. Row Level Security (RLS)

データベースのセキュリティ設定：

1. 各テーブルでRLSを有効化済み
2. 基本的なポリシーは設定済み
3. 本番環境では追加のポリシー設定が必要

## 6. ローカルでの動作確認

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動

## 7. Supabase CLIの使用（オプション）

ローカルでSupabaseを動かす場合：

```bash
# Supabase CLIのインストール
npm install -g supabase

# 初期化
supabase init

# ローカルで起動
supabase start

# マイグレーション適用
supabase db push

# 停止
supabase stop
```

## トラブルシューティング

### CORS エラーが出る場合

Supabase → Settings → API → CORS Settings で以下を追加：
- `http://localhost:3000`
- `https://your-vercel-app.vercel.app`

### 認証が機能しない場合

1. 環境変数が正しく設定されているか確認
2. Supabaseプロジェクトが起動しているか確認
3. ブラウザのCookieをクリア

## セキュリティ注意事項

- `.env.local`ファイルは絶対にGitにコミットしない
- Service Role Keyは管理者権限があるため、クライアント側では使用しない
- 本番環境では必ずRLSポリシーを適切に設定する