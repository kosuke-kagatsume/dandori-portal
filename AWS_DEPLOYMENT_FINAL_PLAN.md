# DandoriPortal - AWS 最終デプロイ実行計画書

**作成日**: 2025-11-16
**プロジェクト進捗**: 95% (400/422項目完了)
**ビルド状態**: ✅ 成功（53ページ、エラー0）
**E2Eテスト**: ✅ 30/30 (100%)

---

## 📊 現状サマリー

### ✅ デプロイ準備完了項目
- [x] 本番ビルド成功（53ページ）
- [x] E2Eテスト100%成功（Playwright 30/30）
- [x] amplify.yml 作成済み
- [x] AWS_DEPLOYMENT_STRATEGY.md 作成済み
- [x] DEPLOY_GUIDE.md 作成済み
- [x] 環境変数サンプル（.env.example）
- [x] ローカル開発環境（docker-compose.yml）
- [x] 全14ページ実装完了（HR領域特化）
- [x] データ永続化（18 Zustandストア）
- [x] CSV/PDF出力機能完備

### ⚠️ デプロイ実行タイミングの重要方針

**CLAUDE.mdより**:
> **⚠️ 重要**: AWSへのデプロイは**最後**に実施
> - AWSデプロイ後は費用が継続的に発生する
> - ローカル環境で完成度を最大限高めてからリリースすることで、運用コストを最小化

**現在の進捗**: 95% → **推奨デプロイ実行タイミング**: 100%完成後

**残りタスク（22項目）の完了後にデプロイ実施を推奨**

---

## 🎯 デプロイオプションの選択

### オプションA: AWS Amplify + Supabase（独立デプロイ）⭐ 推奨

#### メリット
✅ **初期コスト0円** - Amplify無料枠 + Supabase無料枠
✅ **最速デプロイ** - 3-4時間で本番稼働
✅ **運用負荷最小** - サーバー管理不要
✅ **自動スケーリング** - トラフィック増加に自動対応
✅ **既存環境に影響なし** - ダンドリワークと完全分離

#### コスト試算
```
【Phase 1: 初期リリース（0-3ヶ月）】
- Amplify: $0/月（無料枠内）
- Supabase: $0/月（無料枠内）
合計: $0/月

【Phase 2: 成長期（3-12ヶ月、100-200人）】
- Amplify: $3.25/月
- Supabase Pro: $25/月
合計: $28.25/月

【Phase 3: 成熟期（12ヶ月以降、500人以上）】
- Amplify: $18.75/月
- RDS db.t3.small Multi-AZ: $76.5/月
合計: $95.25/月
```

#### デプロイ手順
詳細は `DEPLOY_GUIDE.md` を参照。概要：
1. AWSアカウント準備（15分）
2. Amplifyアプリ作成・GitHub連携（10分）
3. 環境変数設定（15分）
4. 初回デプロイ実行（30分）
5. 動作確認（30分）

**合計所要時間: 3-4時間**

---

### オプションB: 既存ダンドリワーク環境統合（将来的な選択肢）

#### 既存ダンドリワーク環境の詳細（2025年調査）

**AWSアカウント情報**:
- アカウント名: aws.dandoli
- アカウントID: 307398217374
- リージョン: ap-northeast-1（東京）
- 月額コスト: 約$17,000〜$19,000（約250万〜280万円）

**VPC構成**:
```
VPC総数: 4個
  ├─ dandori-production-vpc (10.1.0.0/16) ← メインVPC ⭐
  ├─ vpc_main (10.0.0.0/16)
  ├─ vpc_sub (172.30.0.0/16)
  └─ 名前なしVPC (10.0.0.0/16)
```

**データベース（RDS）**:
```
総数: 27個
エンジン:
  ├─ Aurora PostgreSQL（本番環境メイン）
  ├─ Aurora MySQL（大多数）
  └─ MySQL Community（ログ用1個）

主要インスタンス:
  ├─ dandori-production-postgresql-v17 (Serverless v2: 0.5〜2 ACU)
  ├─ pro-dandoli-time-db (db.r5.xlarge)
  ├─ dev-sync-time-db (db.t4g.medium)
  └─ stg-api-check-db (db.r7g.large)

月額コスト: 約$36,946（約540万円）
```

**コンピューティング（EC2）**:
- 総数: 21台
- 環境分離: pro_*, stg_*, dev_* の命名規則

**認証基盤（Cognito）**:
- ユーザープール: 0個（未使用）
- IDプール: 1個（dandoli_android_develop - Android開発用）

#### 統合デプロイの推奨構成

**推奨事項**:
1. **VPC**: dandori-production-vpc 内にデプロイ
   - 既存RDSへのアクセスが容易
   - セキュリティグループだけで通信制御可能
   - ネットワーク遅延が最小

2. **データベース**: 既存RDSに新規データベース追加
   ```sql
   -- 例: dandori-production-postgresql-v17 に追加
   CREATE DATABASE dandori_portal;
   ```
   - 追加コスト: ストレージ増加分のみ（月額数十〜数百円）
   - セットアップ: 簡単（SQL実行のみ）
   - 管理: 既存体制を活用

3. **認証（SSO）**: 新規Cognitoユーザープール作成
   ```
   新規Cognitoユーザープール
     ├─ ダンドリワーク（既存アプリ）← 将来移行
     └─ DandoriPortal（新規アプリ）
   ```
   - メリット: 共通認証、SSOが簡単
   - セキュリティ: MFA、パスワードポリシー充実

4. **環境管理**: 既存の命名規則に従う
   ```
   本番: pro_dandori_portal_*
   ステージング: stg_dandori_portal_*
   開発: dev_dandori_portal_*
   ```

#### 統合デプロイのコスト（試算）

**最小構成（Phase 1）**:
- Amplify: $0/月（無料枠内）
- 既存RDS利用（ストレージ増加）: $5/月
- **合計: $5/月**（独立デプロイより若干高いが、統合メリット大）

**推奨構成（Phase 3）**:
- Amplify: $18.75/月
- 既存RDS利用（追加ストレージ）: $10/月
- **合計: $28.75/月**（独立デプロイの$95.25/月より大幅に安い）

#### 統合デプロイのメリット
✅ **コスト削減** - 既存RDS活用で追加コスト最小
✅ **データ統合** - ダンドリワークとのデータ連携容易
✅ **統一管理** - 単一AWSアカウント、単一VPCで管理
✅ **セキュリティ** - VPC内で安全に通信
✅ **将来のSSO** - Cognitoで共通認証基盤構築

#### 統合デプロイのデメリット
⚠️ **依存関係** - ダンドリワーク環境に依存
⚠️ **リスク** - 既存環境への影響可能性
⚠️ **複雑性** - VPC設定、セキュリティグループ設定が必要
⚠️ **初期セットアップ** - 独立デプロイより時間がかかる（+2-3時間）

#### 統合デプロイの実装タイミング
**推奨**: まずオプションAで独立デプロイ → 成長期にオプションBへ移行

**移行パス**:
```
【Phase 1】Amplify + Supabase無料枠（独立デプロイ）
  ↓ ユーザー数増加、データ量増加
【Phase 2】Amplify + Supabase Pro（独立デプロイ継続）
  ↓ データ統合ニーズ発生、コスト最適化
【Phase 3】Amplify + 既存RDS統合（統合デプロイ）
  ↓ SSO実装
【Phase 4】完全統合（Cognito SSO、データ連携API）
```

---

## 📋 デプロイ実行チェックリスト

### 🔹 Phase 0: 事前準備（費用発生なし）⚠️ 今すぐ実行可能

#### 1. 残りタスク完了確認（重要）
- [ ] 残り22項目の実装完了
- [ ] 全機能の最終動作確認
- [ ] パフォーマンステスト実施
- [ ] セキュリティ監査実施
- [ ] プロジェクト進捗: 100% (422/422項目)

#### 2. AWSアカウント確認（15分）
- [ ] AWSアカウント作成済み（aws.dandoli アカウント利用可能か確認）
- [ ] ルートユーザーでMFA有効化確認
- [ ] IAMユーザー作成確認（推奨）
- [ ] クレジットカード登録確認

#### 3. GitHubリポジトリ確認（5分）
- [ ] GitHubアカウント確認
- [ ] DandoriPortalリポジトリがPrivate/Publicか確認
- [ ] Amplify連携許可準備

#### 4. Supabase準備（10分）
- [ ] Supabaseプロジェクト作成済み確認
- [ ] 接続情報取得（URL、Anon Key）
- [ ] Transaction Pooler接続文字列取得（DATABASE_URL）
- [ ] データベースマイグレーション実行済み確認

#### 5. 環境変数リスト作成（10分）
必須環境変数を準備:
```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.xxx:password@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres

# デモモード設定（本番環境では必ずfalse）
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false
```

#### 6. デプロイ方法の最終決定（5分）
- [ ] オプションA（独立デプロイ）またはオプションB（統合デプロイ）を決定
- [ ] 決定理由を文書化

**Phase 0 合計所要時間: 45分〜1時間（タスク完了除く）**

---

### 🔸 Phase 1: デプロイ実行（費用発生開始）⚠️ プロジェクト100%完成後に実行

#### オプションA選択時（AWS Amplify + Supabase独立デプロイ）

##### Step 1: Amplifyアプリ作成（10分）
- [ ] AWSコンソールにログイン
- [ ] Amplifyサービスに移動
- [ ] 「New app」→「Host web app」を選択
- [ ] GitHubリポジトリ連携
- [ ] リポジトリ選択: dandori-portal
- [ ] ブランチ選択: main/master
- [ ] App name: `dandori-portal`

##### Step 2: ビルド設定確認（5分）
- [ ] amplify.yml 自動検出確認
- [ ] Node.jsバージョン指定（環境変数: _NODE_VERSION=20）
- [ ] ビルドイメージ設定確認

##### Step 3: 環境変数設定（15分）
- [ ] Amplifyコンソール → Environment variables
- [ ] 必須環境変数を追加:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - DATABASE_URL
  - DEMO_MODE=false
  - NEXT_PUBLIC_DEMO_MODE=false
- [ ] スペース・改行なしで正確に入力

##### Step 4: 初回デプロイ実行（30分）
- [ ] 「Save and deploy」クリック
- [ ] ビルドプロセス監視:
  - Phase 1: Provision (1-2分)
  - Phase 2: Build (3-5分)
  - Phase 3: Deploy (1-2分)
  - Phase 4: Verify (1分)
- [ ] ビルドログ確認（エラー時）
- [ ] ステータス「Deployed」確認
- [ ] Amplify URL発行確認

##### Step 5: 動作確認（30分）
- [ ] Amplify URLにアクセス
- [ ] 全14ページ表示確認
- [ ] ログイン機能動作確認
- [ ] CSV/PDF出力確認
- [ ] データベース接続確認
- [ ] LocalStorage永続化確認
- [ ] E2Eテスト実行（オプション）

**Phase 1-A 合計所要時間: 3-4時間**

---

#### オプションB選択時（既存ダンドリワーク環境統合デプロイ）

##### Step 1: VPC・セキュリティグループ設定（30分）
- [ ] dandori-production-vpc 確認
- [ ] Amplify用セキュリティグループ作成
- [ ] RDSセキュリティグループにAmplifyからのアクセス許可追加

##### Step 2: 既存RDSに新規データベース作成（15分）
- [ ] RDSインスタンス選択（dandori-production-postgresql-v17推奨）
- [ ] ストレージ容量確認（追加可能か）
- [ ] データベース作成:
  ```sql
  CREATE DATABASE dandori_portal;
  CREATE USER dandori_portal_user WITH PASSWORD 'secure_password';
  GRANT ALL PRIVILEGES ON DATABASE dandori_portal TO dandori_portal_user;
  ```
- [ ] 接続文字列作成:
  ```
  DATABASE_URL=postgresql://dandori_portal_user:secure_password@dandori-production-postgresql-v17.xxx.rds.amazonaws.com:5432/dandori_portal
  ```

##### Step 3: Cognito新規ユーザープール作成（30分）
- [ ] Cognitoコンソールに移動
- [ ] 「Create user pool」クリック
- [ ] ユーザープール名: `dandori-unified-auth`
- [ ] サインイン方法: Email
- [ ] パスワードポリシー設定
- [ ] MFA設定（推奨: オプション）
- [ ] アプリクライアント作成: `dandori-portal`
- [ ] Cognito設定値を環境変数に追加:
  ```
  NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-northeast-1_xxxxx
  NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxx
  ```

##### Step 4: Amplifyアプリ作成（オプションAと同様）
- [ ] AWSコンソールにログイン
- [ ] Amplifyサービスに移動
- [ ] GitHubリポジトリ連携
- [ ] App name: `dandori-portal`
- [ ] VPC接続設定（dandori-production-vpc）

##### Step 5: 環境変数設定（20分）
- [ ] 既存RDS接続文字列設定（DATABASE_URL）
- [ ] Cognito設定追加
- [ ] その他必須環境変数追加

##### Step 6: 初回デプロイ・動作確認（オプションAと同様）

**Phase 1-B 合計所要時間: 5-6時間**

---

### 🔸 Phase 2: カスタムドメイン設定（オプション、30分）

- [ ] Route 53でドメイン取得（既存ある場合スキップ）
- [ ] Amplifyにカスタムドメイン追加
- [ ] DNS設定（Amplify自動）
- [ ] SSL証明書発行（Let's Encrypt自動）
- [ ] ドメイン確認（https://dandori-portal.com）

---

### 🔸 Phase 3: 監視・アラート設定（20分）

- [ ] CloudWatch Alarms作成:
  - 4xx Error Rate > 5%
  - 5xx Error Rate > 1%
  - Response Time > 3秒
- [ ] SNS通知設定（メール）
- [ ] Cost Explorerで予算アラート設定:
  - $5/月、$10/月の閾値

---

### 🔸 Phase 4: 継続的デプロイ（CI/CD）設定（15分）

- [ ] GitHub mainブランチ → 本番環境 自動デプロイ確認
- [ ] developブランチ追加（プレビュー環境）
- [ ] プルリクエスト連携確認

---

## 📞 次のアクション（優先順位順）

### 🚨 最優先: プロジェクト完成度を100%に
1. [ ] 残り22項目の実装完了（CLAUDE.md参照）
2. [ ] 全機能の最終動作確認
3. [ ] パフォーマンス最適化
4. [ ] セキュリティ監査

**理由**: CLAUDE.mdの方針「AWSデプロイは最後に実施」を遵守し、運用コストを最小化

---

### ⏭️ プロジェクト100%完成後: デプロイ準備
1. [ ] Phase 0の事前準備を全て完了（45分〜1時間）
2. [ ] デプロイ方法の最終決定（オプションA vs オプションB）
3. [ ] 関係者への通知・スケジュール調整

---

### 🚀 デプロイ実行日
1. [ ] Phase 1の実行（3-6時間、選択したオプションによる）
2. [ ] Phase 2のカスタムドメイン設定（オプション、30分）
3. [ ] Phase 3の監視・アラート設定（20分）
4. [ ] Phase 4のCI/CD設定（15分）
5. [ ] チーム全員にURL共有
6. [ ] ユーザー受け入れテスト実施

---

### 📝 デプロイ完了後
1. [ ] README.mdに本番URL追加
2. [ ] CLAUDE.mdにデプロイ日・費用を記録
3. [ ] チーム向けユーザーマニュアル作成
4. [ ] パフォーマンス監視（1週間）
5. [ ] フィードバック収集
6. [ ] 機能追加・改善継続

---

## 💰 コスト予測サマリー

### オプションA（独立デプロイ）
```
Phase 1（0-3ヶ月、20-50人）: $0/月
Phase 2（3-12ヶ月、100-200人）: $28.25/月
Phase 3（12ヶ月以降、500人以上）: $95.25/月

初年度総コスト: $0〜$300/年
```

### オプションB（統合デプロイ）
```
Phase 1（0-3ヶ月、20-50人）: $5/月
Phase 2（3-12ヶ月、100-200人）: $10/月
Phase 3（12ヶ月以降、500人以上）: $28.75/月

初年度総コスト: $60〜$150/年

※ 既存ダンドリワーク環境のコスト（$17,000〜$19,000/月）に追加される形
```

---

## 🎯 最終推奨事項

### 推奨デプロイ戦略
1. **現時点**: プロジェクトを100%完成させる（残り22項目）
2. **Phase 0**: 事前準備を完了（費用発生なし）
3. **Phase 1**: オプションA（独立デプロイ）で本番稼働開始
4. **Phase 2-3**: 成長に応じてSupabase Pro → RDS移行検討
5. **Phase 4**: 将来的にオプションB（統合デプロイ）への移行検討

### 推奨理由
✅ **初期コスト0円** - 予算に優しい
✅ **リスク最小** - 既存環境に影響なし
✅ **最速リリース** - 3-4時間でデプロイ完了
✅ **柔軟な移行** - 将来の統合デプロイも可能
✅ **CLAUDE.md方針遵守** - 完成度を最大化してからデプロイ

---

## 📚 参考ドキュメント

- **詳細な技術戦略**: `AWS_DEPLOYMENT_STRATEGY.md`
- **ステップバイステップ手順**: `DEPLOY_GUIDE.md`
- **プロジェクト進捗**: `CLAUDE.md`
- **機能一覧**: `remaining-22-items` メモリ
- **既存環境調査**: 本ドキュメント「既存ダンドリワーク環境の詳細」セクション

---

**作成日**: 2025-11-16
**次回レビュー**: プロジェクト100%完成時
**承認者**: プロジェクトマネージャー
**実行責任者**: 開発チーム
