# Supabase マイグレーション実行手順

## ステップ1: Supabaseダッシュボードにアクセス

1. https://supabase.com/dashboard にアクセス
2. プロジェクト `dandori-portal` (`kwnybcmrwknjlhxhhbso`) を選択

## ステップ2: SQL Editorを開く

1. 左サイドバーの **SQL Editor** をクリック
2. **New query** をクリック

## ステップ3: マイグレーションSQLを実行

### 3-1. 既存のテーブルを確認

まず、既存のテーブルを確認します：

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

実行ボタンをクリック。以下のテーブルが表示されるはずです：
- organizations
- users
- workflow_requests
- approval_steps
- attachments
- request_timeline
- delegate_approvers
- notifications

### 3-2. 新しいテーブルを追加

`supabase/migrations/002_add_hr_tables.sql` の内容を全てコピーして、SQL Editorに貼り付けます。

**⚠️ 重要**: 長いSQLなので、エラーが出た場合は以下のセクションごとに分けて実行してください：

#### セクション1: お知らせテーブル

```sql
-- お知らせ（Announcements）
CREATE TABLE IF NOT EXISTS announcements ( ... );
CREATE INDEX idx_announcements_published ON announcements(published);
...
CREATE TABLE IF NOT EXISTS announcement_reads ( ... );
CREATE INDEX idx_announcement_reads_user ON announcement_reads(user_id);
...
```

#### セクション2: 勤怠・休暇テーブル

```sql
-- 勤怠記録（Attendance Records）
CREATE TABLE IF NOT EXISTS attendance_records ( ... );
...
-- 休暇申請（Leave Requests）
CREATE TABLE IF NOT EXISTS leave_requests ( ... );
...
```

#### セクション3: 給与・賞与テーブル

```sql
-- 給与記録（Payroll Records）
CREATE TABLE IF NOT EXISTS payroll_records ( ... );
...
-- 賞与記録（Bonus Records）
CREATE TABLE IF NOT EXISTS bonus_records ( ... );
...
```

#### セクション4: 入社手続きテーブル

```sql
-- 入社手続き申請（Onboarding Applications）
CREATE TABLE IF NOT EXISTS onboarding_applications ( ... );
...
```

#### セクション5: 資産管理テーブル

```sql
-- PC資産（PC Assets）
CREATE TABLE IF NOT EXISTS pc_assets ( ... );
...
-- 車両（Vehicles）
CREATE TABLE IF NOT EXISTS vehicles ( ... );
...
```

#### セクション6: RLSポリシー

```sql
-- =========================================
-- RLS (Row Level Security) ポリシー
-- =========================================
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
...
```

#### セクション7: トリガー

```sql
-- =========================================
-- トリガー設定
-- =========================================
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
...
```

各セクション実行後、**✓ Success** が表示されることを確認してください。

## ステップ4: テーブル作成の確認

全てのセクションを実行したら、再度テーブル一覧を確認：

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

以下のテーブルが追加されているはずです：
- announcements
- announcement_reads
- attendance_records
- leave_requests
- leave_balances
- payroll_records
- bonus_records
- onboarding_applications
- onboarding_forms
- pc_assets
- vehicles

## ステップ5: RLSポリシーの確認

RLSが有効になっているか確認：

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

`rowsecurity` 列が全て `true` になっていればOKです。

## ステップ6: 開発サーバーの再起動

ターミナルで開発サーバーを再起動：

```bash
# 既存のプロセスを停止
pkill -f "next dev"

# 開発サーバーを起動
cd /Users/dw100/dandori-portal
PORT=3001 npm run dev
```

## トラブルシューティング

### エラー: "relation already exists"

既にテーブルが存在する場合は、`CREATE TABLE IF NOT EXISTS` により自動的にスキップされます。

### エラー: "column does not exist"

`update_updated_at_column()` 関数が存在しない場合、以下を実行：

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### エラー: "permission denied"

RLSポリシーでエラーが出る場合、一時的に以下で無効化してテスト：

```sql
ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;
```

## 次のステップ

✅ マイグレーション完了！

次は：
1. Database型定義の更新（`src/types/database.ts`）
2. 認証システムの実装
3. 各ストアのSupabase対応
