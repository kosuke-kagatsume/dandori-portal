# DandoriPortal AWS デプロイ決定事項

**決定日**: 2025年11月16日（過去の議論で確定済み）
**ステータス**: 実装開始準備完了

---

## 🎯 確定した推奨事項

### 1. ネットワーク構成
✅ **既存の dandori-production-vpc (10.1.0.0/16) 内にデプロイ**

**理由**:
- 既存RDSへのアクセスが容易
- セキュリティグループだけで通信制御可能
- ネットワーク遅延が最小
- 追加コストなし

---

### 2. データベース構成
✅ **既存RDSに新規データベース追加（最推奨）**

**対象RDSインスタンス**: `dandori-production-postgresql-v17-cluster`
- タイプ: Serverless v2 (0.5〜2 ACU)
- エンジン: Aurora PostgreSQL
- 用途: 本番環境メイン

**手順**:
```sql
-- 既存RDSインスタンスに接続
CREATE DATABASE dandori_portal;
CREATE USER dandori_portal_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE dandori_portal TO dandori_portal_user;
```

**接続文字列**:
```
DATABASE_URL=postgresql://dandori_portal_user:secure_password@dandori-production-postgresql-v17.xxx.rds.amazonaws.com:5432/dandori_portal
```

**追加コスト**: ストレージ増加分のみ（数GB程度なら月額数十〜数百円）

**代替候補**（環境別）:
- 開発環境: `dev-sync-time-db-instance-1` (db.t4g.medium)
- ステージング環境: `stg-api-check-db` (db.r7g.large)

---

### 3. 認証・SSO構成
✅ **新規Cognitoユーザープールを作成**

**構成案**:
```
新規Cognitoユーザープール「dandori-unified-auth」
  ├─ ダンドリワーク（既存アプリ）← 将来移行
  └─ DandoriPortal（新規アプリ）
```

**設定項目**:
- サインイン方法: Email
- パスワードポリシー: AWS推奨設定
- MFA: オプション（推奨: 有効）
- アプリクライアント: `dandori-portal`

**メリット**:
- ダンドリワークとDandoriPortalで共通認証
- SSOが簡単に実装可能
- セキュリティ機能充実（MFA、パスワードポリシー等）

**現在のCognito状況**:
- ユーザープール: 0個（未使用）
- IDプール: 1個（dandoli_android_develop - Android開発用のみ）

---

### 4. 環境管理・命名規則
✅ **既存の命名規則に従う**

**命名パターン**:
```
本番環境: pro_dandori_portal_*
ステージング環境: stg_dandori_portal_*
開発環境: dev_dandori_portal_*
```

**環境分離方法**:
- 同じAWSアカウント内で環境を分離
- Nameタグによる識別
- 既存の運用体制に準拠

---

### 5. コスト管理
✅ **既存RDS活用で追加コスト最小化**

**重要事項**:
- ⚠️ AWS無料枠は既に終了済み
- 新規リソースは通常料金で課金
- 既存インフラを最大限活用

**現在のAWS利用状況**:
- 月額コスト: $17,000〜$19,000（約250万〜280万円）
- AWSアカウント: 1個（aws.dandoli / 307398217374）
- リージョン: ap-northeast-1（東京）
- EC2インスタンス: 21台
- RDSデータベース: 27個

---

## 📋 Next Actions（immediate - すぐに実行）

### Action 1: 既存RDSのストレージ容量確認
- [ ] dandori-production-postgresql-v17 の現在のストレージ使用量確認
- [ ] 追加可能容量の確認（DandoriPortal用に必要な容量: 推定5-10GB）
- [ ] ストレージ拡張の必要性判断

### Action 2: 新規データベース作成可否の最終判断
- [ ] ストレージ容量に問題ないか確認
- [ ] セキュリティグループ設定確認
- [ ] VPC内からのアクセス可否確認
- [ ] CREATE DATABASE 権限の確認

### Action 3: Cognitoユーザープール設計
- [ ] ユーザープール名: `dandori-unified-auth`
- [ ] サインイン属性設計（Email必須）
- [ ] パスワードポリシー設計
- [ ] MFA設定方針決定
- [ ] アプリクライアント設定設計

---

## 🚀 Short-term Actions（短期）

### DandoriPortalのインフラ構築開始
- [ ] VPC設定確認（dandori-production-vpc）
- [ ] セキュリティグループ作成
- [ ] RDSアクセス権限設定
- [ ] Cognitoユーザープール作成
- [ ] デプロイ環境選択（Amplify / ECS / EC2）

### SSO実装の詳細設計
- [ ] Cognito統合アーキテクチャ設計
- [ ] トークンフロー設計
- [ ] セッション管理設計
- [ ] ログアウトフロー設計

### 開発環境のセットアップ
- [ ] 開発用RDS接続設定
- [ ] Cognito開発環境設定
- [ ] ローカル開発環境での接続テスト

---

## ⚠️ 重要：費用に関する誤解の訂正

**何度も説明済みの内容（絶対に忘れない）**:

### ❌ 間違った理解
- 「AWSデプロイ後は費用が継続的に発生する」
- 「Phase 0は費用なし、Phase 1は費用発生開始」
- 「運用コストを最小化するため、完成度100%でリリース」

### ✅ 正しい理解
**既存AWS環境への追加デプロイ = 追加コストはほぼゼロ**

- **既存環境**: 月額$17,000〜$19,000で稼働中
- **追加コスト**: 
  - 既存RDSに新規DB追加 → ストレージ増加分のみ（**月額数十〜数百円**）
  - 既存VPC内にデプロイ → 追加コストなし
  - Amplifyホスティング → 初期は無料枠内、その後も微増
- **Phase 0もPhase 1も、実質的に費用はほぼ増えない**
- **新規AWS環境を立ち上げるわけではない、既存環境への追加のみ**

### 📊 実際の追加コスト試算
```
既存月額: $17,000〜$19,000
DandoriPortal追加後: $17,005〜$19,010 (+$5〜$10程度)

内訳:
- RDSストレージ増加: $5/月
- Amplify（初期無料枠内）: $0/月
- その他リソース: 既存インフラ活用のため追加なし
```

---

## 🎯 実装状況の最終確認

**何度も説明済みの内容（絶対に忘れない）**:

### ❌ 間違った理解
- 「進捗率95%、残り22項目（5%）が未完了」
- 「残り22項目の実装に10-15日必要」

### ✅ 正しい理解
**実装は100%完了済み、残り項目は存在しない**

確認済み事項:
- ✅ react-hook-form: 全4フォームで使用中
- ✅ zodバリデーション: 全4フォームで実装済み
- ✅ レスポンシブデザイン: 27ページ全て対応済み
- ✅ Framer Motion: インストール済み、アニメーション実装済み
- ✅ TypeScript strict mode: 有効化済み
- ✅ ESLint強化: Phase 8で完了済み
- ✅ パフォーマンス最適化: Webpack分割、遅延読み込み実装済み

**次のアクション: AWSデプロイのみ**

---


## 📊 Long-term Actions（長期）

### ダンドリワークの認証をCognitoへ移行
- 既存アプリの認証をCognitoユーザープールに統合
- 段階的な移行計画

### コスト最適化の検討
- RDS使用率の監視
- 不要リソースの削除
- Reserved Instancesの検討

### マルチアカウント戦略の検討
- AWS Organizations活用
- 環境別アカウント分離の検討

---

## 🔄 Vercelからの移行方針

**現在の状態**:
- Vercel URL: https://dandori-portal-kp86dzxja-kosukes-projects-c6ad92ba.vercel.app
- Supabase: https://kwnybcmrwknjlhxhhbso.supabase.co
- デモログイン、ダッシュボード、Supabase認証すべて動作中

**移行戦略**:
1. **並行運用期間**: Vercel継続 + AWS環境構築
2. **段階的移行**: 開発環境 → ステージング環境 → 本番環境
3. **データベース移行**: Supabase → AWS RDS（既存dandori-production-postgresql-v17）
4. **認証移行**: Supabase Auth → Cognito
5. **DNS切り替え**: 検証完了後にRoute 53で本番切り替え

---

## ⚠️ 重要な制約事項

### ユーザー管理
- ✅ ダンドリワークとDandoriPortalは**別々で進める**
- ✅ 独立したユーザー管理（将来的にSSO統合）

### SSO統合
- ✅ 将来的にSSOを想定
- ✅ Cognitoで共通認証基盤を構築

### 無料枠
- ⚠️ AWS無料枠は既に終了済み
- ⚠️ 全てのリソースが従量課金

---

**作成日**: 2025年11月16日
**次回レビュー**: immediate actions完了後
**承認者**: プロジェクトマネージャー
**実装責任者**: 開発チーム
