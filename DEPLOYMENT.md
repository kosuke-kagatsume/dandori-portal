# Dandori Portal - デプロイガイド

## 🚀 デプロイ方法

Dandori Portalは複数のプラットフォームにデプロイできます。

---

## 📋 前提条件

- Node.js 18.x以上
- PostgreSQLデータベース（Supabase推奨）
- npm または yarn

---

## 🔧 環境変数の設定

デプロイ前に以下の環境変数を設定してください。

### 必須環境変数

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# PostgreSQL接続設定（Transaction pooler推奨）
DATABASE_URL=postgresql://postgres.xxx:password@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres

# デモモード設定（本番環境では false に設定）
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false
```

### オプション環境変数

```bash
# Sentry（エラー追跡）
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Google Analytics
NEXT_PUBLIC_GA_ID=your-ga-id

# カスタムドメイン
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 🌐 Vercelへのデプロイ（推奨）

### 1. Vercelアカウント準備

1. [Vercel](https://vercel.com/)にサインアップ
2. GitHubリポジトリと連携

### 2. プロジェクトのインポート

```bash
# Vercel CLIのインストール
npm install -g vercel

# プロジェクトディレクトリで実行
vercel
```

### 3. 環境変数の設定

Vercelダッシュボードで以下を設定：
- Settings → Environment Variables
- 上記の必須環境変数を追加

### 4. デプロイ

```bash
# 本番デプロイ
vercel --prod
```

### ビルド設定

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

---

## ☁️ AWS Amplifyへのデプロイ

### 1. Amplify Hostingの設定

1. AWS Amplifyコンソールにアクセス
2. 「New app」→「Host web app」を選択
3. GitHubリポジトリと連携

### 2. ビルド設定（amplify.yml）

プロジェクトルートに `amplify.yml` を作成：

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npx prisma generate
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### 3. 環境変数の設定

Amplifyコンソールで環境変数を追加：
- App settings → Environment variables
- 上記の必須環境変数を追加

### 4. デプロイ

- Gitにプッシュすると自動デプロイ
- または手動でデプロイをトリガー

---

## 🐳 Dockerでのデプロイ

### 1. Dockerfileの作成

```dockerfile
# プロジェクトルートにDockerfileを作成済み
FROM node:18-alpine AS base

# 依存関係のインストール
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ビルド
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# 本番環境
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### 2. .dockerignoreの作成

```
node_modules
.next
.git
.env*.local
```

### 3. ビルドと実行

```bash
# イメージのビルド
docker build -t dandori-portal .

# コンテナの実行
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -e DATABASE_URL=postgresql://... \
  dandori-portal
```

### 4. Docker Composeの使用

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    restart: unless-stopped
```

実行：
```bash
docker-compose up -d
```

---

## 🗄️ データベースのセットアップ

### Supabaseの使用（推奨）

1. [Supabase](https://supabase.com/)でプロジェクト作成
2. Database Settings → Connection Stringを取得
3. Transaction pooler（ポート6543）を使用

```bash
# Prismaマイグレーションの実行
npx prisma migrate deploy

# Prisma Clientの生成
npx prisma generate
```

### PostgreSQLの直接使用

```bash
# データベースの作成
createdb dandori_portal

# マイグレーションの実行
DATABASE_URL=postgresql://user:password@localhost:5432/dandori_portal \
  npx prisma migrate deploy
```

---

## 🔒 セキュリティチェックリスト

### デプロイ前の確認事項

- [ ] `DEMO_MODE=false` に設定
- [ ] `.env.local`がGitにコミットされていないか確認
- [ ] 環境変数が正しく設定されているか確認
- [ ] データベース接続文字列が本番用か確認
- [ ] CORS設定が適切か確認
- [ ] API Rate Limitingが有効か確認

### 本番環境の設定

```bash
# .env.production
NODE_ENV=production
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false
```

---

## 📊 パフォーマンス最適化

### ビルド最適化

```bash
# 本番ビルド
npm run build

# ビルドサイズの確認
du -sh .next
```

### CDN設定（Vercel）

Vercelでは自動的に以下が有効化：
- Edge Network（全世界展開）
- 自動画像最適化
- 静的アセットのキャッシング

### CDN設定（AWS CloudFront）

1. CloudFrontディストリビューションを作成
2. Originを Amplify または EC2 に設定
3. Cache Behaviorの設定：
   - `/_next/static/*`: Cache TTL 1年
   - `/_next/image/*`: Cache TTL 1週間
   - その他: Cache TTL なし

---

## 🔍 トラブルシューティング

### ビルドエラー

```bash
# キャッシュクリア
rm -rf .next node_modules/.cache

# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install

# 再ビルド
npm run build
```

### データベース接続エラー

```bash
# Prisma Clientの再生成
npx prisma generate

# データベース接続のテスト
npx prisma db execute --sql "SELECT 1"
```

### 環境変数が反映されない

- Vercel: Settings → Environment Variables → Redeploy
- AWS Amplify: Environment variables → Redeploy
- Docker: コンテナの再起動

---

## 📈 モニタリング

### Vercel Analytics

```bash
# package.jsonに追加
npm install @vercel/analytics
```

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Sentry（エラー追跡）

```bash
npm install @sentry/nextjs
```

---

## 🚦 ヘルスチェック

デプロイ後、以下のエンドポイントで正常性を確認：

```bash
# ヘルスチェック
curl https://your-domain.com/api/health

# データベース接続確認
curl https://your-domain.com/api/db-check
```

---

## 📞 サポート

デプロイで問題が発生した場合：
1. GitHub Issuesで報告
2. ログファイルを添付
3. 環境情報（OS、Node.jsバージョン等）を記載

---

## 🎉 デプロイ完了後の確認事項

- [ ] すべてのページが正常に表示される
- [ ] ログイン機能が動作する
- [ ] データベース操作が正常
- [ ] CSV/PDFエクスポートが動作する
- [ ] レスポンシブデザインが正常
- [ ] パフォーマンスが許容範囲内（Lighthouse 90+）

---

**Dandori Portal Team**
2025-10-26
