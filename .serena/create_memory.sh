#!/bin/bash

# メモリファイル作成スクリプト
# 使用方法: ./create_memory.sh <memory_name>

if [ -z "$1" ]; then
    echo "使用方法: ./create_memory.sh <memory_name>"
    exit 1
fi

MEMORY_NAME="$1"
MEMORY_FILE=".serena/memories/${MEMORY_NAME}.md"
CURRENT_DATE=$(date +"%Y年%m月%d日")
CURRENT_TIME=$(date +"%Y-%m-%d %H:%M:%S")
TIMEZONE=$(date +"%Z")

# テンプレートから新しいメモリファイルを作成
cat > "$MEMORY_FILE" << EOF
# ${MEMORY_NAME}
## 作成日: ${CURRENT_DATE}

### 📅 メタ情報
- **作成時刻**: ${CURRENT_TIME} ${TIMEZONE}
- **最終更新**: ${CURRENT_TIME} ${TIMEZONE}
- **システム日時確認**: $(date)

### 📝 内容
<!-- ここに内容を記載 -->

### ✅ 自動検証
- **Gitの最新コミット日時**: $(git log -1 --format="%ai")
- **作成日の整合性**: ✓ 自動生成により保証

EOF

echo "✅ メモリファイル作成完了: $MEMORY_FILE"
echo "📅 記録された日付: $CURRENT_DATE"
echo "🕐 記録された時刻: $CURRENT_TIME $TIMEZONE"