# DandoriPortal - AWS Amplify デプロイ完全ガイド

**所要時間**: 3-4時間（初回）、30分（2回目以降）

---

## 📋 事前準備チェックリスト

### 1. アカウント準備（15分）

#### AWSアカウント
- [ ] AWSアカウント作成済み
- [ ] ルートユーザーでMFA有効化
- [ ] IAMユーザー作成（推奨）
- [ ] クレジットカード登録済み

**手順**:
```
1. https://aws.amazon.com/ にアクセス
2. 「無料アカウントを作成」をクリック
3. メールアドレス・パスワード設定
4. クレジットカード情報入力（初年度無料枠あり）
5. 電話番号認証
6. サポートプラン選択（無料プランでOK）
```

#### GitHubリポジトリ
- [ ] GitHubアカウント作成済み
- [ ] DandoriPortalリポジトリ確認
- [ ] リポジトリがPrivateの場合、Amplify連携許可

#### Supabase
- [ ] Supabaseプロジェクト作成済み
- [ ] 接続情報（URL、Anon Key）取得済み
- [ ] データベースマイグレーション実行済み

---

## 🔑 環境変数の準備（10分）

以下の環境変数を準備してください：

### 必須環境変数
```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# PostgreSQL接続設定（Transaction pooler推奨）
DATABASE_URL=postgresql://postgres.xxx:password@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres

# デモモード設定（本番環境では必ずfalse）
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false
```

### オプション環境変数
```bash
# カスタムドメイン（設定する場合）
NEXT_PUBLIC_APP_URL=https://your-domain.com

# アナリティクス（Vercel Analytics使用の場合）
NEXT_PUBLIC_VERCEL_ANALYTICS=true

# エラートラッキング（Sentry使用の場合）
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

**取得方法**:
```
Supabase:
1. Supabaseダッシュボード → Project Settings
2. API → Project URL をコピー（NEXT_PUBLIC_SUPABASE_URL）
3. API → Project API keys → anon/public をコピー（NEXT_PUBLIC_SUPABASE_ANON_KEY）
4. Database → Connection Pooling → Transaction → Connection string をコピー（DATABASE_URL）
```

---

## 🚀 AWS Amplify デプロイ手順

### Step 1: Amplifyアプリ作成（10分）

1. **AWSコンソールにログイン**
   ```
   https://console.aws.amazon.com/
   ```

2. **Amplifyサービスに移動**
   - 検索バーに「Amplify」と入力
   - 「AWS Amplify」をクリック

3. **新規アプリ作成**
   - 「New app」ボタンをクリック
   - 「Host web app」を選択

4. **GitHubリポジトリ連携**
   - 「GitHub」を選択
   - 「Authorize AWS Amplify」をクリック
   - GitHubで認証許可
   - リポジトリ一覧から「dandori-portal」を選択
   - ブランチ: `main` または `master` を選択

5. **アプリ名設定**
   - App name: `dandori-portal`
   - Environment: `production`

---

### Step 2: ビルド設定（5分）

1. **amplify.ymlの確認**
   - プロジェクトルートに`amplify.yml`が既に存在
   - Amplifyが自動検出します

2. **ビルド設定の編集（必要に応じて）**
   ```yaml
   # amplify.yml の内容確認
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

3. **Node.jsバージョン指定（重要）**
   - Amplifyコンソール → App settings → Build settings
   - Build image settings → Add environment variable
   ```
   Key: _CUSTOM_IMAGE
   Value: amplify:al2023
   ```
   または
   ```
   Key: _NODE_VERSION
   Value: 20
   ```

---

### Step 3: 環境変数設定（15分）⚠️ 重要

1. **環境変数画面に移動**
   - Amplifyコンソール → App settings → Environment variables

2. **必須環境変数を追加**
   ```
   Key: NEXT_PUBLIC_SUPABASE_URL
   Value: https://your-project.supabase.co

   Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   Key: DATABASE_URL
   Value: postgresql://postgres.xxx:password@...

   Key: DEMO_MODE
   Value: false

   Key: NEXT_PUBLIC_DEMO_MODE
   Value: false
   ```

3. **環境変数の確認**
   - すべてのキーと値が正確に入力されているか確認
   - スペースや改行が含まれていないか確認

---

### Step 4: 初回デプロイ実行（30分）

1. **デプロイ開始**
   - 「Save and deploy」ボタンをクリック
   - ビルドプロセスが自動的に開始されます

2. **ビルドプロセスの監視**
   ```
   Phase 1: Provision (1-2分)
     - インスタンス起動
     - Node.js環境構築

   Phase 2: Build (3-5分)
     - npm ci実行
     - Prisma generate実行
     - Next.js build実行

   Phase 3: Deploy (1-2分)
     - ビルド成果物のアップロード
     - CloudFront配信設定

   Phase 4: Verify (1分)
     - デプロイ検証
     - ヘルスチェック
   ```

3. **ビルドログの確認**
   - エラーが発生した場合、ログを確認
   - 一般的なエラーと解決方法は後述

4. **デプロイ完了確認**
   - ビルドステータスが「Deployed」になることを確認
   - Amplify URLが発行される（例: `https://main.d1234567890.amplifyapp.com`）

---

### Step 5: 動作確認（30分）

1. **URLアクセス**
   - Amplify URLにアクセス
   - ページが正常に表示されることを確認

2. **全ページ確認チェックリスト**
   - [ ] ログインページ（`/ja/login`）
   - [ ] ダッシュボード（`/ja/dashboard`）
   - [ ] ユーザー管理（`/ja/users`）
   - [ ] 勤怠管理（`/ja/attendance`）
   - [ ] 休暇管理（`/ja/leave`）
   - [ ] ワークフロー（`/ja/workflow`）
   - [ ] 給与管理（`/ja/payroll`）
   - [ ] 組織管理（`/ja/organization`）
   - [ ] 設定（`/ja/settings`）

3. **機能確認チェックリスト**
   - [ ] デモログイン機能
   - [ ] ダッシュボード統計表示
   - [ ] ユーザー一覧表示
   - [ ] CSV出力（勤怠、給与など）
   - [ ] PDF出力（給与明細、休暇申請）
   - [ ] データベース接続（ユーザー情報取得）
   - [ ] LocalStorage永続化（リロード後も状態維持）

4. **E2Eテスト実行（オプション）**
   ```bash
   # ローカルで実行
   cd /Users/dw100/dandori-portal
   BASE_URL=https://main.d1234567890.amplifyapp.com npm run test:e2e
   ```

---

## 🌐 カスタムドメイン設定（オプション、30分）

### Step 1: Route 53でドメイン取得（既存ドメインある場合はスキップ）

1. **Route 53コンソールに移動**
   ```
   https://console.aws.amazon.com/route53/
   ```

2. **ドメイン登録**
   - 「ドメインの登録」をクリック
   - 希望ドメイン名を検索（例: `dandori-portal.com`）
   - 価格確認（.com: $12/年、.jp: $35/年）
   - カートに追加・支払い

3. **ドメイン確認**
   - 登録完了まで10-60分
   - メールアドレス確認が必要

---

### Step 2: Amplifyにカスタムドメイン追加

1. **カスタムドメイン設定画面**
   - Amplifyコンソール → App settings → Domain management
   - 「Add domain」をクリック

2. **ドメイン入力**
   ```
   Domain: dandori-portal.com
   Subdomain: www (オプション)
   ```

3. **DNS設定**
   - Amplifyが自動的にRoute 53レコードを作成
   - 「Configure domain」をクリック

4. **SSL証明書発行**
   - Amplifyが自動的にLet's Encrypt証明書を発行
   - 発行完了まで5-10分

5. **ドメイン確認**
   - ステータスが「Available」になることを確認
   - `https://dandori-portal.com` にアクセス

---

## 🔧 トラブルシューティング

### エラー1: ビルドエラー「Prisma Client not found」

**症状**:
```
Error: @prisma/client did not initialize yet
```

**解決方法**:
```yaml
# amplify.yml の preBuild に以下を追加
preBuild:
  commands:
    - npm ci
    - npx prisma generate  # ← これを追加
```

---

### エラー2: ビルドエラー「Node.js version mismatch」

**症状**:
```
Error: The engine "node" is incompatible with this module
```

**解決方法**:
1. Amplifyコンソール → App settings → Build settings
2. Build image settings → Edit
3. Node.js version → 20を選択
4. Save

または環境変数で指定:
```
Key: _NODE_VERSION
Value: 20
```

---

### エラー3: ビルドタイムアウト

**症状**:
```
Build timed out after 30 minutes
```

**解決方法**:
1. `package.json` の依存関係を確認
2. 不要なdevDependenciesを削除
3. ビルドタイムアウト時間を延長（Amplifyサポートに連絡）

---

### エラー4: 環境変数が反映されない

**症状**:
- ページは表示されるが、データベース接続エラー
- `NEXT_PUBLIC_*` が undefined

**解決方法**:
1. Amplifyコンソール → Environment variables を確認
2. キーと値が正確か確認（スペース、改行なし）
3. 再デプロイ実行
   - Deployments → Redeploy this version

---

### エラー5: ページが404エラー

**症状**:
```
404 - This page could not be found
```

**解決方法**:
1. `next.config.js` の設定確認
   ```js
   module.exports = {
     output: 'standalone', // ← これを削除
   }
   ```

2. `amplify.yml` のartifacts確認
   ```yaml
   artifacts:
     baseDirectory: .next  # ← 正しい
     # baseDirectory: out  # ← 誤り
   ```

---

### エラー6: Supabase接続エラー

**症状**:
```
Error: Could not connect to Supabase
```

**解決方法**:
1. Supabase接続情報の確認
   ```bash
   # 正しい形式
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   DATABASE_URL=postgresql://postgres.xxx:password@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```

2. Supabaseプロジェクトのステータス確認
   - Supabaseダッシュボードで「Active」になっているか

3. データベースマイグレーション実行
   ```bash
   # ローカルで実行
   npx prisma migrate deploy
   ```

---

## 📊 デプロイ後の監視設定（20分）

### CloudWatch Alarms設定

1. **CloudWatchコンソールに移動**
   ```
   https://console.aws.amazon.com/cloudwatch/
   ```

2. **アラーム作成**
   - 「Alarms」→「Create alarm」
   - メトリクスを選択（例: 4xx/5xxエラー率）
   - 閾値を設定（例: エラー率 > 1%）
   - アクション: SNS通知（メール送信）

3. **推奨アラーム**
   ```
   - 4xx Error Rate > 5%（10分間）
   - 5xx Error Rate > 1%（5分間）
   - Request Count < 10（30分間）← サイトダウン検知
   - Response Time > 3秒（10分間）
   ```

---

### ログ確認方法

1. **Amplifyログ**
   - Amplifyコンソール → Monitoring → Logs
   - リアルタイムログ、ビルドログ、アクセスログ

2. **CloudWatch Logs**
   - CloudWatchコンソール → Logs → Log groups
   - `/aws/amplify/dandori-portal` を検索
   - ログストリーム確認

---

## 🔄 継続的デプロイ（CI/CD）

### 自動デプロイの仕組み

```
1. コード変更
   ↓
2. GitHubにプッシュ（git push origin main）
   ↓
3. Amplifyが自動検知
   ↓
4. ビルド開始（3-5分）
   ↓
5. デプロイ完了
   ↓
6. 自動的に本番反映
```

### プレビュー環境（開発ブランチ）

1. **ブランチ追加**
   - Amplifyコンソール → App settings → Branches
   - 「Connect branch」をクリック
   - ブランチ選択（例: `develop`）

2. **プレビューURL発行**
   ```
   本番: https://main.d1234567890.amplifyapp.com
   開発: https://develop.d1234567890.amplifyapp.com
   ```

3. **プルリクエスト連携**
   - GitHub PR作成時に自動的にプレビュー環境作成
   - PRコメントにプレビューURLが自動投稿

---

## 💰 コスト管理

### Cost Explorerの設定

1. **Cost Explorerに移動**
   ```
   https://console.aws.amazon.com/cost-management/
   ```

2. **予算アラート設定**
   - 「Budgets」→「Create budget」
   - テンプレート: Zero spend budget（初期）
   - アラート閾値: $5/月、$10/月
   - 通知先メールアドレス設定

3. **毎日の確認**
   - 「Cost Explorer」→「Daily costs」
   - Amplify、Supabase、データ転送の内訳確認

---

## ✅ デプロイ完了チェックリスト

### 機能確認
- [ ] 全ページ正常表示（14ページ）
- [ ] ログイン機能動作
- [ ] データベース操作正常
- [ ] CSV出力動作（10種類）
- [ ] PDF出力動作（給与明細、休暇申請）
- [ ] レスポンシブデザイン正常（モバイル確認）

### パフォーマンス確認
- [ ] Lighthouseスコア 90+（目標）
- [ ] First Contentful Paint < 1.5秒
- [ ] Time to Interactive < 3.0秒
- [ ] Largest Contentful Paint < 2.5秒

### セキュリティ確認
- [ ] HTTPS接続（SSL証明書有効）
- [ ] DEMO_MODE=false に設定
- [ ] 環境変数が正しく設定
- [ ] データベース接続が暗号化

### 監視設定
- [ ] CloudWatch Alarms設定
- [ ] 予算アラート設定
- [ ] ログ保存設定

---

## 📞 サポート・ヘルプ

### AWSサポート
- **無料サポート**: ドキュメント、フォーラム
- **Developerプラン**: $29/月、営業時間内サポート
- **Businessプラン**: $100/月、24時間サポート

### コミュニティサポート
- [AWS re:Post](https://repost.aws/)
- [Next.js Discord](https://discord.gg/nextjs)
- [Supabase Discord](https://discord.supabase.com/)

### プロジェクト固有の問題
- GitHubリポジトリのIssues
- プロジェクトドキュメント（CLAUDE.md）

---

## 🎉 デプロイ完了後

### 次のステップ
1. [ ] チーム全員にURLを共有
2. [ ] ユーザー受け入れテスト実施
3. [ ] フィードバック収集
4. [ ] パフォーマンス改善
5. [ ] 機能追加（残り22項目）

### ドキュメント更新
- [ ] README.mdに本番URLを追加
- [ ] CLAUDE.mdにデプロイ日を記録
- [ ] チーム向けユーザーマニュアル作成

---

**作成日**: 2025-11-15
**最終更新**: 2025-11-15
**推定所要時間**: 初回 3-4時間、2回目以降 30分
**推定初期コスト**: $0/月（無料枠内）
