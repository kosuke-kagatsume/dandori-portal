#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋 Supabase マイグレーション実行手順"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 ステップ1: SQL Editorを開く"
echo "   以下のURLをクリック:"
echo "   https://supabase.com/dashboard/project/kwnybcmrwknjlhxhhbso/sql/new"
echo ""
echo "📄 ステップ2: マイグレーションSQLを表示"
echo "   以下のコマンドでSQLを表示します:"
echo ""
echo "   cat supabase/migrations/002_add_hr_tables.sql"
echo ""
echo "📋 ステップ3: SQLをコピー&ペースト"
echo "   1. SQL Editorにペースト"
echo "   2. 右下の \"Run\" ボタンをクリック"
echo "   3. \"Success\" が表示されればOK！"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "👇 SQLを表示しますか？ (y/n)"
read -r response
if [[ "$response" == "y" || "$response" == "Y" ]]; then
    echo ""
    echo "━━━━ マイグレーションSQL ━━━━"
    cat supabase/migrations/002_add_hr_tables.sql
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ 上記をコピーして、SQL Editorにペーストしてください"
    echo "   URL: https://supabase.com/dashboard/project/kwnybcmrwknjlhxhhbso/sql/new"
fi
