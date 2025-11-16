# DandoriPortal - AWS デプロイ事前確認チェックリスト

**作成日**: 2025-11-16
**Phase 0（事前準備）**: 完了予定時刻 - 約1時間

---

## ✅ 1. AWSアカウント情報の確認

### AWS環境
- **アカウント名**: aws.dandoli
- **アカウントID**: 307398217374
- **リージョン**: ap-northeast-1（東京）
- **月額コスト**: $17,000〜$19,000

### VPC情報
- **推奨VPC**: dandori-production-vpc (10.1.0.0/16)
- **既存EC2**: 21台稼働中
- **既存RDS**: 27個稼働中

**状態**: ✅ 確認済み

---

## ✅ 2. GitHubリポジトリの確認

- **リポジトリURL**: https://github.com/kosuke-kagatsume/dandori-portal.git
- **ブランチ**: main（推定）
- **アクセス**: Private（推定）

**状態**: ✅ 確認済み

**次のアクション**:
- [ ] GitHubアカウントでログイン可能か確認
- [ ] AWS Amplifyとの連携許可

---

## ✅ 3. Supabase設定の確認

### 現在の設定（開発環境）
- **Supabase URL**: `https://kwnybcmrwknjlhxhhbso.supabase.co`
- **Supabase Anon Key**: あり（107文字）
- **DATABASE_URL**: Transaction Pooler使用中
  ```
  postgresql://postgres.kwnybcmrwknjlhxhhbso:***@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres
  ```

### 本番環境での設定
- **DEMO_MODE**: `false` に変更必須
- **NEXT_PUBLIC_DEMO_MODE**: `false` に変更必須

**状態**: ✅ 確認済み

---

## 🔄 4. デプロイ方法の最終決定

### オプションA: Amplify + Supabase（独立デプロイ）⭐ 推奨（初回）

**メリット**:
- ✅ 既存のSupabaseをそのまま使用（移行不要）
- ✅ 設定が簡単（環境変数コピーのみ）
- ✅ デプロイ時間が短い（3-4時間）
- ✅ 追加コストほぼゼロ（Amplify無料枠 + Supabase継続）

**デメリット**:
- ⚠️ 既存RDSとのデータ統合が困難
- ⚠️ Supabase無料枠の制限（500MB DB、1GB転送/月）

**追加コスト**: 月額$0〜$5程度

---

### オプションB: Amplify + 既存RDS（統合デプロイ）

**メリット**:
- ✅ 既存RDSとのデータ統合が容易
- ✅ 無制限のDB容量
- ✅ VPC内で高速アクセス

**デメリット**:
- ⚠️ データベース移行が必要（Supabase → RDS）
- ⚠️ Cognito User Pool作成が必要
- ⚠️ セットアップ時間が長い（5-6時間）

**追加コスト**: 月額$5〜$10程度

---

## 📋 5. 環境変数リスト（必須項目）

### オプションA選択時（Supabase継続）

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://kwnybcmrwknjlhxhhbso.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（既存の値）
DATABASE_URL=postgresql://postgres.kwnybcmrwknjlhxhhbso:***@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres

# デモモード設定（本番環境）
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false

# Node.js設定
NODE_ENV=production
_NODE_VERSION=20
```

### オプションB選択時（既存RDS統合）

```bash
# 既存RDSのDATABASE_URL（要作成）
DATABASE_URL=postgresql://dandori_portal_user:***@dandori-production-postgresql-v17.xxx.rds.amazonaws.com:5432/dandori_portal

# Cognito設定（要作成）
NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-northeast-1_xxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxx

# デモモード設定（本番環境）
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false

# Node.js設定
NODE_ENV=production
_NODE_VERSION=20
```

---

## 🎯 推奨デプロイ戦略

### フェーズ1: まずはオプションAで本番稼働 ⭐ 推奨

**理由**:
1. 既存Supabaseをそのまま使用できる
2. 設定が簡単で短時間でデプロイ可能
3. 追加コストほぼゼロ
4. 動作確認が容易

**期間**: 3-4時間

---

### フェーズ2: 成長後にオプションBへ移行（将来）

**タイミング**:
- Supabase無料枠を超えたとき
- 既存ダンドリワークとのデータ統合が必要になったとき
- Cognito SSOを実装したいとき

**期間**: 5-6時間（データ移行含む）

---

## ⏭️ 次のステップ

### Phase 0完了後（現在）
- [ ] デプロイ方法の最終決定（オプションA or B）
- [ ] 環境変数の最終確認
- [ ] AWS Amplifyアカウントアクセス確認

### Phase 1開始時
- [ ] AWS Amplifyコンソールにログイン
- [ ] GitHubリポジトリ連携
- [ ] 環境変数設定
- [ ] 初回ビルド・デプロイ
- [ ] 動作確認

---

## 💡 決定事項

**推奨**: まずはオプションA（Amplify + Supabase）で開始

**理由**:
- シンプルで確実
- 短時間でデプロイ完了
- 既存設定を活用
- 追加コストほぼゼロ

**次の質問**: オプションAで進めてよろしいですか？
