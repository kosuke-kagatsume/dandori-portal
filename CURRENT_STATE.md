# Dandori Portal - Current Working State
## 2025年8月24日 更新

## 🚀 本番環境（最新・動作確認済み）
**メインURL: https://dandori-portal-kp86dzxja-kosukes-projects-c6ad92ba.vercel.app**
- ✅ デモログイン機能: 完全動作中
- ✅ ダッシュボード: アクセス可能
- ✅ Supabase認証: 接続済み

## デモログイン情報
- **デモボタン**: ログイン画面下部の「デモアカウントでログイン」をクリック
- **内部認証トークン**: `2b723ccc348073981432fcc0741efcd05c50915144d7d144e16e3cf384a85134`
- **デモユーザー**: 
  - Email: `demo@dandori.local`
  - Password: `demo-demo-demo`

## 環境変数（Vercel設定済み）
```env
NEXT_PUBLIC_SUPABASE_URL=https://kwnybcmrwknjlhxhhbso.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bnliY21yd2tuamxoeGhoYnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NDk1OTMsImV4cCI6MjA3MTUyNTU5M30.Bpniq-nuEx0hwZ0O86Gw5T8HjDiOiX-C-nesECHHhMY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bnliY21yd2tuamxoeGhoYnNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTk0OTU5MywiZXhwIjoyMDcxNTI1NTkzfQ.1iiqqzMRcs0AdTVyH16Z6BuJvRFOoR_xk7bE6MFqXGc
DEMO_LOGIN_TOKEN=2b723ccc348073981432fcc0741efcd05c50915144d7d144e16e3cf384a85134
```

## ローカル開発環境
```bash
# 開発サーバー起動
npm run dev
# http://localhost:3002 でアクセス可能

# ビルド（TypeScriptエラーは一時的にスキップ）
npm run build

# 厳密なビルド（TypeScriptチェック付き）
npm run build:strict
```

## Git状態
- リポジトリ: ローカル（/Users/dw100/dandori-portal）
- 最新コミット: デモログイン機能の完全動作版
- ブランチ: main

## 主要な実装済み機能
1. **認証システム**
   - Supabase Auth統合
   - デモログイン機能
   - セッション管理

2. **ダッシュボード**
   - 従業員数、出勤率、承認待ち、月間稼働率の表示
   - 有給残日数管理
   - システム接続状況モニタリング

3. **管理機能**（サイドバー）
   - ユーザー管理
   - メンバー管理
   - 勤怠管理
   - 休暇管理
   - ワークフロー

## 注意事項
- TypeScriptエラーが約20個残存（一時的にビルド時スキップ）
- 本番環境では必ず環境変数を設定すること
- デモログインは開発・テスト用途のみ

## 古いデプロイメントURL（使用しないこと）
以下のURLは古いバージョンで、使用すべきではありません：
- ❌ https://dandori-portal-eustfo2ol-kosukes-projects-c6ad92ba.vercel.app
- ❌ https://dandori-portal-4p02wr1fb-kosukes-projects-c6ad92ba.vercel.app
- ❌ https://dandori-portal-pb2y6u0eu-kosukes-projects-c6ad92ba.vercel.app
- ❌ https://dandori-portal-lxlxuvjtn-kosukes-projects-c6ad92ba.vercel.app

## 次のステップ（推奨）
1. TypeScriptエラーの修正
2. テストコードの追加
3. CI/CDパイプラインの設定
4. カスタムドメインの設定