# DandoriPortal コードレビュー & パフォーマンス分析レポート

**分析日**: 2025-10-20
**デプロイURL**: https://dandori-portal-r3vy161ca-kosukes-projects-c6ad92ba.vercel.app

---

## 📊 プロジェクト概要

### コードベース規模
- **総ファイル数**: 299ファイル (.ts/.tsx)
- **総コード行数**: 89,517行
- **ページ数**: 28ページ
- **ディレクトリサイズ**:
  - `src/lib`: 1.4MB (最大)
  - `src/app`: 868KB
  - `src/components`: 644KB
  - `src/features`: 400KB

### ビルド結果
- **First Load JS**: 545KB (shared by all pages)
  - `vendors.js`: **542KB** ⚠️ 非常に大きい
  - その他: 2.36KB
- **最大ページサイズ**:
  - `/settings`: 632KB
  - `/assets`: 614KB
  - `/users/[id]`: 613KB
  - `/payroll`: 609KB

---

## 🔴 重大な問題（High Priority）

### 1. Vendorバンドルサイズが非常に大きい (542KB)
**影響度**: 🔴 High
**現状**: 全ページで共有されるvendor.jsが542KBと非常に大きい

**原因分析**:
- 多数のRadix UIコンポーネントを一括インポート
- recharts、jsPDFなど重いライブラリが含まれている可能性
- Tree shakingが効いていない箇所がある

**推奨アクション**:
```javascript
// ❌ Bad: 全コンポーネントをインポート
import * from '@radix-ui/react-dialog';

// ✅ Good: 必要なもののみインポート
import { Dialog, DialogContent } from '@radix-ui/react-dialog';
```

**改善施策**:
1. Dynamic importでPDF生成機能を遅延ロード
2. rechartsを使用するページのみで動的読み込み
3. @next/bundle-analyzerで詳細分析

---

### 2. 大きすぎるページファイル
**影響度**: 🔴 High
**現状**: 複数のページが1000行超え

**問題ファイル**:
- `settings/page.tsx`: **2,186行** ⚠️
- `workflow/page.tsx`: 1,351行
- `assets/page.tsx`: 1,117行
- `onboarding-admin/[applicationId]/page.tsx`: 953行

**推奨アクション**:
Settings ページを11個のタブに分割:
```
src/features/settings/
├── tabs/
│   ├── GeneralTab.tsx
│   ├── SecurityTab.tsx
│   ├── IntegrationTab.tsx
│   └── ...
└── SettingsPage.tsx (メインコンポーネント)
```

**期待効果**:
- コード保守性の向上
- 初期ロード時間の短縮（Dynamic import活用）
- 開発者体験の改善

---

### 3. Consoleログが多数残存
**影響度**: 🟡 Medium
**現状**: 238箇所でconsole.log/warn/errorを使用

**問題**:
- Productionビルドでもconsoleログが残る
- バンドルサイズ増加
- セキュリティリスク（機密情報の漏洩）

**推奨アクション**:
```javascript
// next.config.js に追加
webpack: (config, { dev }) => {
  if (!dev) {
    config.optimization.minimizer.push(
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // console.* を削除
          },
        },
      })
    );
  }
  return config;
}
```

---

## 🟡 中程度の問題（Medium Priority）

### 4. Any型の多用
**影響度**: 🟡 Medium
**現状**: 20+ファイルで`any`型を使用

**問題ファイル例**:
- `src/app/[locale]/settings/page.tsx`
- `src/app/[locale]/dashboard/page.tsx`
- `src/types/index.ts`

**推奨アクション**:
```typescript
// ❌ Bad
const handleSubmit = (data: any) => { ... }

// ✅ Good
interface FormData {
  name: string;
  email: string;
}
const handleSubmit = (data: FormData) => { ... }
```

**改善施策**:
1. TypeScript strict modeを段階的に有効化
2. eslint-plugin-@typescript-eslintのルール追加

---

### 5. メモ化が不十分
**影響度**: 🟡 Medium
**現状**: 71箇所でメモ化使用、15ページでuseEffect使用

**問題**:
- 大きなページコンポーネントでReact.memoが未使用
- useMemoなしで重い計算を実行
- useCallbackなしでイベントハンドラーを再生成

**推奨アクション**:
```typescript
// ✅ Good: 重い計算をメモ化
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}, [users]);

// ✅ Good: イベントハンドラーをメモ化
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

---

### 6. 大きなストアファイル
**影響度**: 🟡 Medium
**現状**: payroll-store.tsが1,853行

**問題**:
- 単一ファイルが大きすぎる
- 責任が多すぎる（給与、賞与、年末調整を1ファイルで管理）

**推奨アクション**:
```
src/lib/store/payroll/
├── salary-store.ts (給与)
├── bonus-store.ts (賞与)
├── tax-store.ts (年末調整)
└── index.ts (統合)
```

---

## 🟢 軽微な問題（Low Priority）

### 7. テストファイルの整理
**影響度**: 🟢 Low
**現状**: テストファイル（*.test.ts）が多数存在

**推奨アクション**:
- `__tests__` ディレクトリに移動
- jest.config.jsでテストファイルのパターンを統一

---

## ✅ 良好な点

1. **コード分割設定が適切**
   - next.config.jsでvendor、react、ui、chartsを分割済み
   - optimizePackageImportsで主要ライブラリを最適化

2. **SSR対応が徹底**
   - MountGateコンポーネントでHydrationエラー対策
   - useIsMountedフックの活用

3. **セキュリティ対策**
   - 監査ログ機能実装
   - データマスキング実装
   - CSPヘッダー設定

4. **アクセシビリティ対応**
   - ARIA属性ヘルパー実装
   - スクリーンリーダー対応
   - キーボードショートカット実装

---

## 📋 推奨改善ロードマップ

### Phase 1: 即効性のある改善（1-2日）
1. ✅ Console.logの削除（webpack設定）
2. ✅ PDF生成のDynamic import化
3. ✅ Rechartsの遅延ロード

### Phase 2: 構造改善（3-5日）
1. ⏳ Settings ページの分割
2. ⏳ Payroll storeの分割
3. ⏳ Any型の削減

### Phase 3: パフォーマンス最適化（5-7日）
1. ⏳ 重要コンポーネントのメモ化
2. ⏳ Bundle analyzerによる詳細分析
3. ⏳ Web Vitals計測とチューニング

---

## 🎯 期待効果

### Phase 1完了後
- **First Load JS**: 545KB → **350KB** (-36%)
- **Lighthouse Score**: 現状不明 → **90+**

### Phase 2完了後
- **コード保守性**: 大幅改善
- **開発速度**: 20%向上

### Phase 3完了後
- **Time to Interactive**: 2秒以内
- **Largest Contentful Paint**: 2.5秒以内

---

## 🔧 即座に実行可能なコマンド

```bash
# 1. Bundle分析
ANALYZE=true npm run build

# 2. 未使用exports検出
npx ts-prune

# 3. 重複コード検出
npx jscpd src

# 4. パフォーマンス計測
npm run build && npm run start
# ブラウザでLighthouse実行
```

---

## 📚 参考資料

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance Optimization](https://react.dev/reference/react/memo)
- [Web Vitals](https://web.dev/vitals/)
- [Bundle Size Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
