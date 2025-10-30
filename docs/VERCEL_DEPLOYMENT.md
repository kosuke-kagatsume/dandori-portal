# Vercel デプロイガイド

Dandori Portal を Vercel にデプロイする手順を説明します。

## 📋 前提条件

- ✅ Vercel アカウント（https://vercel.com/signup）
- ✅ GitHub リポジトリ（プロジェクトがプッシュされている）
- ✅ Supabase プロジェクト（データベース用）

---

## 🚀 デプロイ手順

### 1. Vercel プロジェクト作成

#### オプションA: Vercel CLI を使用（推奨）

```bash
# Vercel CLI のインストール
npm i -g vercel

# プロジェクトルートでログイン
vercel login

# デプロイ実行
vercel

# プロンプトに従って設定
# - Set up and deploy? Yes
# - Which scope? [あなたのアカウント]
# - Link to existing project? No
# - Project name? dandori-portal
# - In which directory is your code located? ./
```

#### オプションB: Vercel ダッシュボードを使用

1. https://vercel.com/dashboard にアクセス
2. 「Add New...」→「Project」をクリック
3. GitHub リポジトリを選択
4. 「Import」をクリック

---

### 2. 環境変数の設定

Vercel ダッシュボードで以下の環境変数を設定：

#### 必須環境変数

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres.kwnybcmrwknjlhxhhbso:DandoriPortal2025%21@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres

# Supabase Settings
NEXT_PUBLIC_SUPABASE_URL=https://kwnybcmrwknjlhxhhbso.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Node Environment
NODE_ENV=production

# Next.js Settings
NEXT_PUBLIC_APP_URL=https://dandori-portal.vercel.app
```

#### 環境変数の設定方法

1. Vercel ダッシュボード → プロジェクト → Settings → Environment Variables
2. 各変数を追加：
   - **Name**: 変数名（例: `DATABASE_URL`）
   - **Value**: 変数の値
   - **Environment**: Production, Preview, Development を選択

---

### 3. ビルド設定

Vercel は自動的に Next.js プロジェクトを検出しますが、以下を確認：

#### ビルドコマンド（自動検出）
```bash
npm run build
```

#### 出力ディレクトリ（自動検出）
```
.next
```

#### Node.js バージョン
```
20.x
```

`package.json` に以下を追加（推奨）:
```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

---

### 4. Prisma 設定

Vercel では Prisma Client を自動生成する必要があります。

#### `package.json` の `build` スクリプト確認

```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

✅ **既に設定済み** - このプロジェクトでは正しく設定されています。

---

### 5. データベースマイグレーション

#### ローカルでマイグレーション実行

```bash
# .env ファイルを一時的に Direct connection に変更
DATABASE_URL=postgresql://postgres:DandoriPortal2025%21@db.kwnybcmrwknjlhxhhbso.supabase.co:5432/postgres

# マイグレーション実行
npx prisma migrate deploy

# .env を元に戻す（Transaction pooler）
DATABASE_URL=postgresql://postgres.kwnybcmrwknjlhxhhbso:DandoriPortal2025%21@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres
```

#### または Supabase ダッシュボードで SQL 実行

Supabase ダッシュボード → SQL Editor で以下を実行：

```sql
-- prisma/migrations フォルダ内の migration.sql の内容を貼り付け
```

---

## 🔧 デプロイ後の設定

### 1. カスタムドメイン設定（オプション）

1. Vercel ダッシュボード → Settings → Domains
2. 「Add Domain」をクリック
3. ドメイン名を入力（例: `dandori.example.com`）
4. DNS レコードを設定

### 2. 環境変数の更新

本番環境の URL を環境変数に反映：

```bash
NEXT_PUBLIC_APP_URL=https://your-custom-domain.com
```

### 3. デプロイ確認

デプロイ後、以下を確認：

- ✅ トップページが表示される
- ✅ ログイン機能が動作する
- ✅ API エンドポイントが正常に動作する
- ✅ データベース接続が正常

---

## 📊 デプロイステータス確認

### Vercel ダッシュボード

- **Deployments**: デプロイ履歴とステータス
- **Logs**: ビルドログとランタイムログ
- **Analytics**: アクセス解析

### ログの確認

```bash
# Vercel CLI でログ確認
vercel logs [deployment-url]
```

---

## 🐛 トラブルシューティング

### ビルドエラー: Prisma Client が見つからない

**原因**: `prisma generate` が実行されていない

**解決策**:
```bash
# package.json の build スクリプトを確認
"build": "prisma generate && next build"
```

### データベース接続エラー

**原因**: 環境変数が正しく設定されていない

**解決策**:
1. Vercel ダッシュボードで `DATABASE_URL` を確認
2. Transaction pooler URL（ポート6543）を使用しているか確認
3. パスワードが URL エンコードされているか確認（`%21` など）

### ページが404エラー

**原因**: ビルド時に静的生成されていない

**解決策**:
```bash
# ローカルでビルド確認
npm run build

# 問題がなければ Vercel で再デプロイ
vercel --prod
```

### TypeScript エラー

**原因**: 型チェックでエラー

**解決策**:
```bash
# ローカルで型チェック
npm run build

# エラーを修正後、コミット＆プッシュ
git add .
git commit -m "Fix TypeScript errors"
git push
```

---

## 🔄 継続的デプロイ (CI/CD)

### 自動デプロイ設定

Vercel は GitHub と連携すると、以下のタイミングで自動デプロイ：

- ✅ `main` ブランチへのプッシュ → 本番環境デプロイ
- ✅ Pull Request 作成 → プレビュー環境デプロイ

### プレビューデプロイ

```bash
# プレビューデプロイ作成
vercel

# 本番デプロイ
vercel --prod
```

---

## 📈 パフォーマンス最適化

### 画像最適化

Next.js の Image Optimization は Vercel で自動有効化。

### エッジ関数

API Routes は自動的に Vercel Edge Network で配信。

### キャッシング

静的ファイルは自動的に CDN でキャッシュ。

---

## 🔐 セキュリティ

### 環境変数の保護

- ✅ `.env` ファイルは `.gitignore` に追加済み
- ✅ 本番環境の環境変数は Vercel ダッシュボードで管理
- ✅ API キーなどの秘密情報は絶対にコミットしない

### HTTPS

Vercel は全てのデプロイで自動的に HTTPS を有効化。

---

## 📞 サポート

- Vercel ドキュメント: https://vercel.com/docs
- Vercel サポート: https://vercel.com/support
- Next.js ドキュメント: https://nextjs.org/docs

---

## ✅ チェックリスト

デプロイ前に以下を確認：

- [ ] Vercel アカウント作成済み
- [ ] GitHub リポジトリにプッシュ済み
- [ ] `.env` ファイルを `.gitignore` に追加済み
- [ ] Supabase プロジェクト作成済み
- [ ] 環境変数を Vercel に設定予定
- [ ] データベースマイグレーション実行済み
- [ ] ローカルで `npm run build` が成功

---

**準備完了！Vercel へデプロイしましょう！** 🚀
