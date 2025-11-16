# DandoriPortal - AWS Amplify デプロイ実行手順書

**作成日**: 2025-11-16
**デプロイ方法**: オプションA（Amplify + Supabase）
**所要時間**: 約3-4時間
**追加コスト**: 月額$0〜$5程度

---

## 📋 事前準備（完了済み）

- ✅ AWSアカウント確認（aws.dandoli）
- ✅ GitHubリポジトリ確認（https://github.com/kosuke-kagatsume/dandori-portal.git）
- ✅ Supabase設定確認
- ✅ `amplify.yml` 作成済み
- ✅ `.env.production` 作成済み
- ✅ 環境変数リスト準備完了

---

## 🚀 Phase 1: AWS Amplifyアプリ作成（30分）

### Step 1: AWSコンソールにログイン（5分）

1. https://console.aws.amazon.com/ にアクセス
2. **アカウントID**: `307398217374` でログイン
3. **リージョン**: `ap-northeast-1`（東京）を選択
4. サービス検索で「Amplify」と入力

---

### Step 2: Amplifyアプリ作成（10分）

1. **「New app」** → **「Host web app」** をクリック

2. **リポジトリ選択**:
   - **GitHub** を選択
   - **「Connect to GitHub」** をクリック
   - GitHub認証を許可

3. **リポジトリとブランチ選択**:
   - **Repository**: `kosuke-kagatsume/dandori-portal`
   - **Branch**: `main`
   - **「Next」** をクリック

4. **App名設定**:
   - **App name**: `dandori-portal`（または `dandori-portal-prod`）
   - **「Next」** をクリック

---

### Step 3: ビルド設定確認（5分）

1. **amplify.yml 自動検出確認**:
   - Amplifyが自動的に `amplify.yml` を検出します
   - 以下の内容が表示されることを確認:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - node --version
        - npm --version
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

2. **「Next」** をクリック

---

### Step 4: 環境変数設定（15分）⭐ 重要

1. **「Advanced settings」** を展開

2. **Environment variables** セクションで以下を追加:

| Variable (key) | Value |
|----------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kwnybcmrwknjlhxhhbso.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bnliY21yd2tuamxoeGhoYnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NDk1OTMsImV4cCI6MjA3MTUyNTU5M30.Bpniq-nuEx0hwZ0O86Gw5T8HjDiOiX-C-nesECHHhMY` |
| `DATABASE_URL` | `postgresql://postgres.kwnybcmrwknjlhxhhbso:DandoriPortal2025%21@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres` |
| `DEMO_MODE` | `false` |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |
| `NODE_ENV` | `production` |
| `_NODE_VERSION` | `20` |

**⚠️ 注意**:
- コピー&ペースト時にスペースや改行が入らないように注意
- 値の前後にダブルクォートは不要

3. **「Save and deploy」** をクリック

---

## 🔨 Phase 2: 初回デプロイ実行（30-40分）

### ビルドプロセスの監視

デプロイが開始されると、以下のフェーズが順次実行されます：

1. **Provision（1-2分）**
   - ビルド環境のプロビジョニング

2. **Build（3-5分）**
   - 依存関係のインストール（npm ci）
   - Prisma Client生成
   - Next.jsビルド（npm run build）

3. **Deploy（1-2分）**
   - ビルド成果物のデプロイ

4. **Verify（1分）**
   - デプロイメント検証

**合計**: 約6-10分

---

### エラー発生時の対処

**よくあるエラー**:

#### 1. ビルドエラー（TypeScript/ESLint）
```
Error: Command failed with exit code 1: npm run build
```

**対処**:
- `next.config.js` の設定を確認:
  ```javascript
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  ```

#### 2. 環境変数の問題
```
Error: DATABASE_URL is not defined
```

**対処**:
- Amplifyコンソール → Environment variables で値を再確認
- スペースや改行が入っていないか確認

#### 3. Prisma Clientエラー
```
Error: Prisma Client could not be generated
```

**対処**:
- `amplify.yml` の `preBuild` に `npx prisma generate` があることを確認

---

## ✅ Phase 3: デプロイ成功確認（10分）

### Step 1: デプロイステータス確認

1. Amplifyコンソールで **「Deployed」** が緑色で表示されることを確認

2. **Amplify URL** をコピー:
   - 例: `https://main.d1a2b3c4d5e6f7.amplifyapp.com`

---

### Step 2: 動作確認

1. **Amplify URLにアクセス**
   - ブラウザで上記URLを開く

2. **ログイン画面の表示確認**
   - ログイン画面が正しく表示されることを確認

3. **デモログイン機能の確認**
   - DEMO_MODE=falseのため、デモログインボタンは表示されないはず
   - ✅ 正常: デモログインボタンが**表示されない**

4. **Supabase認証の動作確認**
   - 実際のユーザー認証が機能することを確認
   - （Supabaseに登録されたユーザーでログイン）

5. **主要ページの表示確認**
   - `/ja/dashboard` - ダッシュボード
   - `/ja/users` - ユーザー管理
   - `/ja/attendance` - 勤怠管理
   - `/ja/workflow` - ワークフロー

---

## 🎯 Phase 4: カスタムドメイン設定（オプション、30分）

### カスタムドメインを使用する場合

1. **Amplifyコンソール** → **Domain management**

2. **「Add domain」** をクリック

3. **ドメイン設定**:
   - ドメイン名を入力（例: `dandori-portal.com`）
   - Route 53でDNS設定を自動で行う

4. **SSL証明書の発行**:
   - Let's Encrypt証明書が自動で発行される
   - 所要時間: 5-10分

5. **DNS伝播待ち**:
   - 最大24時間（通常は1-2時間）

---

## 📊 Phase 5: 継続的デプロイの確認（5分）

### 自動デプロイの動作確認

1. **GitHubでコミット＆プッシュ**:
   ```bash
   git add .
   git commit -m "Test auto-deploy"
   git push origin main
   ```

2. **Amplifyで自動ビルド開始を確認**:
   - Amplifyコンソールで新しいビルドが自動的に開始される

3. **ビルド完了後、変更が反映されることを確認**

---

## 🔍 Phase 6: 監視・アラート設定（20分）

### CloudWatch Alarms作成

1. **AWSコンソール** → **CloudWatch**

2. **Alarms** → **Create alarm**

3. **推奨アラーム**:
   - **4xx Error Rate > 5%**
   - **5xx Error Rate > 1%**
   - **Response Time > 3秒**

4. **SNS通知設定**:
   - メールアドレスを登録
   - アラート通知を受け取る

---

## 💰 コスト管理

### AWS Cost Explorerでの予算設定

1. **AWSコンソール** → **Billing**

2. **Budgets** → **Create budget**

3. **予算設定**:
   - **Monthly budget**: $10
   - **Alert threshold**: 80%（$8）

---

## 📝 デプロイ完了後のチェックリスト

- [ ] Amplify URLにアクセス可能
- [ ] ログイン画面が正しく表示される
- [ ] DEMO_MODEが無効（デモログインボタンが表示されない）
- [ ] Supabase認証が正常動作
- [ ] 全ページが正しく表示される
- [ ] データベース接続が正常
- [ ] 自動デプロイが機能する
- [ ] CloudWatchアラームが設定済み
- [ ] コスト予算が設定済み

---

## 🚨 トラブルシューティング

### よくある問題と対処法

#### 1. ビルドが失敗する
- **原因**: 環境変数の設定ミス
- **対処**: Amplifyコンソールで環境変数を再確認

#### 2. ページが表示されない（404エラー）
- **原因**: ルーティング設定の問題
- **対処**: `next.config.js` の設定を確認

#### 3. データベース接続エラー
- **原因**: DATABASE_URLの形式が間違っている
- **対処**: Supabaseダッシュボードで正しいURLを再取得

#### 4. デモモードが有効になっている
- **原因**: DEMO_MODE環境変数が `true`
- **対処**: Amplifyコンソールで `DEMO_MODE=false` に変更

---

## 📞 サポート

問題が解決しない場合:
1. Amplifyコンソールのビルドログを確認
2. CloudWatchログを確認
3. AWS Supportに問い合わせ

---

## 🎉 デプロイ完了！

デプロイが成功したら:
1. ✅ Amplify URLをチームに共有
2. ✅ カスタムドメイン設定（オプション）
3. ✅ ユーザー受け入れテスト実施
4. ✅ パフォーマンス監視開始

---

**追加コスト**: 月額$0〜$5程度のみ
**次のステップ**: 将来的にオプションB（既存RDS統合）への移行を検討
