# パフォーマンス最適化設定

## 実装済みの最適化

### 1. コード分割とLazy Loading
- ✅ ダッシュボードコンポーネントの動的インポート
- ✅ ActivityFeed, SystemStatus, QuickActionsの遅延読み込み
- ✅ Suspenseによるローディング状態の管理

### 2. キャッシング戦略
- ✅ 多層キャッシュサービス（メモリ/セッション/ローカル）
- ✅ TTL管理とステイル戦略
- ✅ React用キャッシングフック

### 3. バンドル最適化
- ✅ Bundle Analyzer設定
- ✅ Tree Shaking対応
- ✅ パッケージ最適化（lucide-react, date-fns, radix-ui）

### 4. 画像最適化
- ✅ 遅延読み込み
- ✅ レスポンシブ画像
- ✅ AVIF/WebP自動選択
- ✅ プログレッシブ読み込み

### 5. パフォーマンス監視
- ✅ コンポーネントレンダリング測定
- ✅ Web Vitals測定
- ✅ メトリクスレポート生成

## 使用方法

### Bundle分析の実行
```bash
# バンドルサイズを分析
npm run build:analyze
```

### 開発時のパフォーマンス監視
```javascript
// コンソールで実行
performanceMonitor.generateReport()
```

### キャッシュのクリア
```javascript
// コンソールで実行
cacheService.clear()
```

## 推奨設定

### 環境変数（.env.local）
```env
# 画像CDN設定
NEXT_PUBLIC_IMAGE_CDN=cloudfront
NEXT_PUBLIC_CLOUDFRONT_URL=https://d123456.cloudfront.net

# パフォーマンス監視
NEXT_PUBLIC_ENABLE_MONITORING=true
NEXT_PUBLIC_MONITORING_SAMPLE_RATE=0.1
```

### Vercelデプロイ設定
```json
{
  "functions": {
    "app/[locale]/dashboard/page.tsx": {
      "maxDuration": 10
    }
  },
  "images": {
    "domains": ["dandori-portal.s3.amazonaws.com"],
    "formats": ["image/avif", "image/webp"]
  }
}
```

## パフォーマンス目標

| メトリクス | 目標値 | 現在値 |
|-----------|--------|---------|
| FCP (First Contentful Paint) | < 1.8s | 測定中 |
| LCP (Largest Contentful Paint) | < 2.5s | 測定中 |
| FID (First Input Delay) | < 100ms | 測定中 |
| CLS (Cumulative Layout Shift) | < 0.1 | 測定中 |
| TTI (Time to Interactive) | < 3.8s | 測定中 |

## 次のステップ

### Phase 1: 即座に実装可能
- [ ] Service Workerの実装（オフライン対応）
- [ ] Prefetchingの実装
- [ ] Critical CSSのインライン化

### Phase 2: AWS移行時
- [ ] CloudFront CDN設定
- [ ] ElastiCache Redis統合
- [ ] Aurora Read Replicaの設定
- [ ] Lambda@Edgeでの最適化

### Phase 3: 高度な最適化
- [ ] Edge Computingの活用
- [ ] WebAssemblyの導入
- [ ] HTTP/3対応

## トラブルシューティング

### キャッシュ関連
```javascript
// キャッシュ統計を確認
cacheService.getStats()

// 特定パターンのキャッシュをクリア
cacheService.invalidatePattern(/^dashboard-/)
```

### パフォーマンス測定
```javascript
// Web Vitalsの測定開始
performanceMonitor.measureWebVitals()

// 特定コンポーネントの測定
performanceMonitor.measureComponent('Dashboard', () => {
  // レンダリング処理
})
```

### 画像最適化
```javascript
// 最適なフォーマットを確認
getOptimizedImageFormat()

// レスポンシブサイズを計算
calculateResponsiveImageSizes(window.innerWidth, 50)
```

## ベストプラクティス

1. **コンポーネントの最適化**
   - React.memoを使用してリレンダリングを防ぐ
   - useMemoとuseCallbackで計算結果をキャッシュ
   - 大きなリストには仮想スクロールを使用

2. **データフェッチング**
   - 並列フェッチングを活用
   - ページネーションまたは無限スクロール
   - GraphQLのフラグメントでオーバーフェッチを防ぐ

3. **アセット管理**
   - 重要でないCSSを遅延読み込み
   - フォントのプリロードとfont-displayの設定
   - SVGのインライン化とスプライト化

4. **ネットワーク最適化**
   - HTTP/2 Server Pushの活用
   - Resource Hintsの適切な使用
   - API呼び出しのバッチ処理