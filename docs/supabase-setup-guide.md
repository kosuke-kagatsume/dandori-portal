# Supabase セットアップガイド

このガイドでは、Dandori PortalのバックエンドとしてSupabaseをセットアップする手順を説明します。

## 1. Supabaseプロジェクトの作成

### 1-1. Supabaseアカウントの作成

1. [Supabase](https://supabase.com/)にアクセス
2. "Start your project"をクリック
3. GitHubアカウントでサインイン

### 1-2. 新規プロジェクトの作成

1. ダッシュボードで"New Project"をクリック
2. 以下の情報を入力:
   - **Project Name**: `dandori-portal`
   - **Database Password**: 強力なパスワードを設定（必ずメモ！）
   - **Region**: `Northeast Asia (Tokyo)` を選択（日本のユーザー向け）
   - **Pricing Plan**: 開発段階では"Free"でOK
3. "Create new project"をクリック
4. プロジェクトの初期化を待つ（2-3分）

### 1-3. プロジェクトの設定情報を取得

プロジェクトが作成されたら、以下の情報をメモしてください：

1. 左サイドバーの "Settings" (歯車アイコン) をクリック
2. "API" タブを選択
3. 以下の情報をコピー:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` （長いトークン）
   - **service_role key**: `eyJhbGc...` （秘密鍵、絶対に公開しない）

## 2. データベーススキーマの作成

### 2-1. SQL Editorを開く

1. 左サイドバーの "SQL Editor" をクリック
2. "New query" をクリック

### 2-2. スキーマを実行

`docs/database-schema.md` からSQLスクリプトをコピーして実行します。

#### ステップ1: usersテーブルの作成

```sql
-- usersテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_kana TEXT,
  department TEXT,
  position TEXT,
  roles TEXT[] DEFAULT ARRAY['employee']::TEXT[],
  avatar_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'retired')),
  retired_date DATE,
  retirement_reason TEXT,
  hired_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_department ON users(department);

-- RLSポリシー
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

実行ボタンをクリックして、エラーがないことを確認してください。

#### ステップ2: 残りのテーブルを順次作成

`database-schema.md`に記載されている順序で、以下のテーブルを作成します：
1. user_profiles
2. organizations
3. attendance_records
4. leave_requests, leave_balances
5. workflow_requests, approval_steps
6. payroll_records, bonus_records
7. announcements, announcement_reads
8. onboarding_applications, onboarding_forms
9. pc_assets, vehicles
10. notifications

各テーブル作成後、"Run"をクリックして実行し、エラーがないことを確認してください。

## 3. 環境変数の設定

### 3-1. `.env.local` ファイルの作成

プロジェクトルートに `.env.local` ファイルを作成します：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...（anon public key）

# サーバーサイド用（秘密鍵、絶対にコミットしない）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...（service_role key）

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**重要**: `.env.local` は `.gitignore` に含まれているため、Gitにコミットされません。

### 3-2. `.env.example` の作成

チーム開発のために、`.env.example` ファイルを作成します：

```bash
# Supabase設定（実際の値は.env.localに記載）
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# サーバーサイド用
SUPABASE_SERVICE_ROLE_KEY=

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 4. Supabaseクライアントライブラリのインストール

```bash
npm install @supabase/supabase-js
```

## 5. Supabaseクライアントの設定

### 5-1. クライアント作成

`src/lib/supabase/client.ts` ファイルを作成（既存のdemo clientを置き換え）：

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// 型安全のためのDatabase型を後で追加
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          // ... 他のフィールド
        };
        Insert: {
          // ...
        };
        Update: {
          // ...
        };
      };
      // ... 他のテーブル
    };
  };
};
```

### 5-2. サーバーサイドクライアント

`src/lib/supabase/server.ts` ファイルを作成：

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// サーバーサイド専用（RLSをバイパス）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

## 6. 認証システムの設定

### 6-1. Supabase Authの有効化

1. Supabaseダッシュボードの"Authentication"タブを開く
2. "Providers"タブを選択
3. "Email"プロバイダーを有効化
4. "Email confirmation"を無効化（開発時のみ）

### 6-2. 認証ヘルパーの作成

`src/lib/auth/supabase-auth.ts` ファイルを作成：

```typescript
import { supabase } from '@/lib/supabase/client';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, userData: any) {
  // 1. Supabase Authでユーザー作成
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  // 2. usersテーブルにプロフィール作成
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user!.id,
      email,
      ...userData,
    });

  if (profileError) throw profileError;

  return authData;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

## 7. 動作確認

### 7-1. 開発サーバーの起動

```bash
npm run dev
```

### 7-2. Supabase接続テスト

ブラウザのコンソールで以下を実行：

```javascript
// Supabaseクライアントのテスト
const { data, error } = await supabase.from('users').select('*').limit(1);
console.log('Supabase connection test:', { data, error });
```

エラーがなければ接続成功です。

## 8. トラブルシューティング

### エラー: "Invalid API key"

- `.env.local` のキーが正しいか確認
- 開発サーバーを再起動（環境変数の再読み込み）

### エラー: "relation 'users' does not exist"

- SQL Editorでテーブルが作成されているか確認
- スキーマ名が `public` になっているか確認

### エラー: "Row Level Security policy violation"

- RLSポリシーが正しく設定されているか確認
- テスト時は一時的にRLSを無効化：`ALTER TABLE users DISABLE ROW LEVEL SECURITY;`

## 9. 次のステップ

✅ Supabaseプロジェクト作成完了
✅ データベーススキーマ作成完了
✅ 環境変数設定完了
✅ Supabaseクライアント設定完了

次は各ストアの段階的な移行を行います：
1. user-storeから移行開始
2. localStorage → Supabase Database への切り替え
3. 認証フローの実装
4. 他のストアの順次移行

## 参考リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase + Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
