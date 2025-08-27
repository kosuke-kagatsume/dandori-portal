#!/bin/bash

# 負荷テスト実行スクリプト

# 色付き出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# デフォルト設定
BASE_URL="${BASE_URL:-https://dandori-portal.vercel.app}"
TEST_TYPE="${1:-smoke}"

echo -e "${GREEN}🚀 Dandori Portal 負荷テスト${NC}"
echo "================================"

# K6がインストールされているか確認
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ K6がインストールされていません${NC}"
    echo ""
    echo "インストール方法:"
    echo "  Mac: brew install k6"
    echo "  Linux: sudo snap install k6"
    echo "  Docker: docker pull grafana/k6"
    exit 1
fi

# テストタイプの選択
case "$TEST_TYPE" in
    "smoke")
        echo -e "${YELLOW}🔍 スモークテスト実行中...${NC}"
        echo "  - 期間: 1分"
        echo "  - 最大ユーザー: 10"
        k6 run \
            --vus 10 \
            --duration 1m \
            --summary-export=results/smoke-test-$(date +%Y%m%d-%H%M%S).json \
            -e BASE_URL=$BASE_URL \
            k6-test.js
        ;;
        
    "load")
        echo -e "${YELLOW}⚡ 通常負荷テスト実行中...${NC}"
        echo "  - 期間: 10分"
        echo "  - 最大ユーザー: 100"
        k6 run \
            --stage 2m:20 \
            --stage 5m:100 \
            --stage 3m:20 \
            --summary-export=results/load-test-$(date +%Y%m%d-%H%M%S).json \
            -e BASE_URL=$BASE_URL \
            k6-test.js
        ;;
        
    "stress")
        echo -e "${YELLOW}💪 ストレステスト実行中...${NC}"
        echo "  - 期間: 20分"
        echo "  - 最大ユーザー: 500"
        k6 run \
            --stage 5m:100 \
            --stage 10m:500 \
            --stage 5m:100 \
            --summary-export=results/stress-test-$(date +%Y%m%d-%H%M%S).json \
            -e BASE_URL=$BASE_URL \
            k6-test.js
        ;;
        
    "spike")
        echo -e "${YELLOW}📈 スパイクテスト実行中...${NC}"
        echo "  - 期間: 10分"
        echo "  - 最大ユーザー: 1000（急増）"
        k6 run \
            --stage 1m:10 \
            --stage 1m:1000 \
            --stage 3m:1000 \
            --stage 1m:10 \
            --stage 4m:10 \
            --summary-export=results/spike-test-$(date +%Y%m%d-%H%M%S).json \
            -e BASE_URL=$BASE_URL \
            k6-test.js
        ;;
        
    "soak")
        echo -e "${YELLOW}⏱️  耐久テスト実行中...${NC}"
        echo "  - 期間: 2時間"
        echo "  - 一定ユーザー: 200"
        k6 run \
            --stage 10m:200 \
            --stage 100m:200 \
            --stage 10m:0 \
            --summary-export=results/soak-test-$(date +%Y%m%d-%H%M%S).json \
            -e BASE_URL=$BASE_URL \
            k6-test.js
        ;;
        
    "full")
        echo -e "${YELLOW}🎯 フル負荷テスト実行中...${NC}"
        echo "  - 期間: 50分"
        echo "  - 最大ユーザー: 3000"
        echo "  - 本番想定シナリオ"
        k6 run \
            --summary-export=results/full-test-$(date +%Y%m%d-%H%M%S).json \
            --out influxdb=http://localhost:8086/k6 \
            -e BASE_URL=$BASE_URL \
            k6-test.js
        ;;
        
    *)
        echo -e "${RED}❌ 不正なテストタイプ: $TEST_TYPE${NC}"
        echo ""
        echo "使用可能なテストタイプ:"
        echo "  smoke  - 基本的な動作確認（1分、10ユーザー）"
        echo "  load   - 通常負荷テスト（10分、100ユーザー）"
        echo "  stress - ストレステスト（20分、500ユーザー）"
        echo "  spike  - スパイクテスト（10分、1000ユーザー急増）"
        echo "  soak   - 耐久テスト（2時間、200ユーザー）"
        echo "  full   - フル負荷テスト（50分、3000ユーザー）"
        echo ""
        echo "使用例:"
        echo "  ./run-load-test.sh smoke"
        echo "  BASE_URL=http://localhost:3000 ./run-load-test.sh load"
        exit 1
        ;;
esac

# 結果の確認
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ テスト完了！${NC}"
    echo ""
    echo "結果ファイル: results/"
    echo "最新の結果を確認: ls -la results/*.json | tail -1"
    
    # 簡単な結果サマリーを表示
    if command -v jq &> /dev/null; then
        LATEST_RESULT=$(ls -t results/*.json 2>/dev/null | head -1)
        if [ -f "$LATEST_RESULT" ]; then
            echo ""
            echo "📊 クイックサマリー:"
            jq '.metrics.http_req_duration.values' "$LATEST_RESULT" 2>/dev/null || true
        fi
    fi
else
    echo ""
    echo -e "${RED}❌ テスト失敗${NC}"
    echo "ログを確認してください"
    exit 1
fi