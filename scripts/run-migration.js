#!/usr/bin/env node

/**
 * Supabaseマイグレーション実行スクリプト
 * SQLファイルを読み込んで、Supabaseで実行します
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 環境変数から設定を読み込み
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase設定が見つかりません');
  console.error('   NEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYを.env.localに設定してください');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 マイグレーション開始...\n');

    // マイグレーションファイルを読み込み
    const migrationPath = path.join(__dirname, '../supabase/migrations/002_add_hr_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log(`📄 マイグレーションファイル: ${migrationPath}`);
    console.log(`📝 SQLサイズ: ${(sql.length / 1024).toFixed(2)} KB\n`);

    // SQLを複数のステートメントに分割
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 実行するステートメント数: ${statements.length}\n`);

    // PostgreSQL REST APIを使用してSQLを実行
    // 注意: anon keyでは一部の操作が制限されるため、
    // ダッシュボードからの実行を推奨します

    console.log('⚠️  注意: anon keyでは一部のDDL操作が制限されています');
    console.log('   以下の手順でダッシュボードから実行してください:\n');
    console.log('1. https://supabase.com/dashboard/project/kwnybcmrwknjlhxhhbso にアクセス');
    console.log('2. 左サイドバーの "SQL Editor" をクリック');
    console.log('3. "New query" をクリック');
    console.log('4. 以下のファイルの内容をコピー&ペースト:');
    console.log(`   ${migrationPath}`);
    console.log('5. "Run" ボタンをクリック\n');

    // テーブル一覧を確認
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      console.log('⚠️  テーブル一覧の取得に失敗しました（権限制限の可能性）');
      console.log('   ダッシュボードから実行してください');
    } else {
      console.log('📋 既存のテーブル:');
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    }

    console.log('\n✅ 手順書を表示しました');
    console.log('   詳細は docs/supabase-migration-instructions.md を参照してください');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

runMigration();
