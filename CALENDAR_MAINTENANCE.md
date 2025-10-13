# カレンダー保守ガイド

## 🎯 重要事項

DayPicker（react-day-picker）は **table レイアウト前提** です。
**絶対に `classNames` で `row` や `head_row` に `grid` を渡さないでください。**

## 🛡️ 3重の防御策

### 1. コンポーネントレベル（最優先）
```tsx
<DayPicker
  styles={{
    head_row: { display: "table-row" },
    row: { display: "table-row" },
  }}
  classNames={{
    // ⛔ head_row: "grid grid-cols-7" は絶対NG
    // ⛔ row: "grid grid-cols-7" は絶対NG
  }}
/>
```

### 2. グローバルCSS（`src/app/globals.css`）
```css
.rdp table { display: table !important; table-layout: fixed; }
.rdp tr    { display: table-row !important; }
.rdp th,
.rdp td    { display: table-cell !important; }
```

### 3. Dev環境チェック（`src/features/attendance/attendance-calendar.tsx`）
開発環境でのみ、崩れたら即警告＋自動修正するコードが動作します。

## 📝 チェック方法

### 手動チェック
```bash
# 禁止パターンチェック
npm run lint:calendar

# 矢印文字チェック
npm run lint:arrows
```

### ビルド前チェック
```bash
# 厳密ビルド（TypeScript + Calendar チェック）
npm run build:strict
```

### ブラウザでの確認
1. DevTools → Elements
2. `.rdp-row` を選択
3. Computed タブで `display: table-row` を確認

## 🚫 禁止事項

### ❌ NG例
```tsx
// ❌ これは絶対にダメ
<DayPicker
  classNames={{
    head_row: "grid grid-cols-7",
    row: "grid grid-cols-7",
  }}
/>
```

### ✅ OK例
```tsx
// ✅ これが正しい
<DayPicker
  styles={{
    head_row: { display: "table-row" },
    row: { display: "table-row" },
  }}
  classNames={{
    // row/head_row は定義しない
    weekday: "text-center",
    day: "p-2",
  }}
/>
```

## 🔧 トラブルシューティング

### 症状: 強制リロード後に左列が巨大化
**原因**: `row` に `grid` が渡されている

**対処**:
1. `npm run lint:calendar` を実行
2. エラーが出た箇所の `classNames.row` と `classNames.head_row` を削除
3. 代わりに `styles={{ row: { display: 'table-row' }, head_row: { display: 'table-row' } }}` を追加

### 症状: Dev環境でコンソールに警告が出る
**原因**: 別のCSSが `grid` を適用している

**対処**:
1. コンソールの警告メッセージから該当要素を特定
2. その要素に `!important` で `display: table-row` を強制
3. または `globals.css` のセレクタを強化

## 📚 参考情報

### 関連ファイル
- `src/components/ui/calendar.tsx` - ベースコンポーネント
- `src/features/attendance/attendance-calendar.tsx` - 勤怠カレンダー
- `src/app/globals.css` - グローバルスタイル（11-20行目）
- `src/hooks/useIsMounted.ts` - SSR/CSR不一致対策

### npm scripts
- `npm run lint:calendar` - カレンダー禁止パターンチェック
- `npm run lint:arrows` - 矢印文字チェック
- `npm run build:strict` - TypeScript + カレンダーチェック + ビルド

### 過去の問題
詳細は `CLAUDE.md` の「🔧 Hydrationエラー根本対策」セクションを参照。

---

**最終更新**: 2025-10-13
**メンテナンス担当**: Dandori Portal開発チーム
