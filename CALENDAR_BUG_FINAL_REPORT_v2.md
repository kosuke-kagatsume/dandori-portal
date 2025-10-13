# カレンダー問題 - 最終レポート v2

## 🔴 現在の状況

### 完全に解決した問題
✅ **曜日ヘッダーの7列表示** - 完璧に動作（Su Mo Tu We Th Fr Sa）
✅ **日付セルの7列グリッド** - 常に完璧に動作

### 解決できていない問題
❌ **選択中のセル（12）だけが巨大化する**
- **初回表示時**: 全てのセルが統一サイズ（36px x 36px）で完璧
- **リロード後**: 選択中のセル（12）だけが巨大化
- **他のセル**: 常に36px x 36pxで正しい

## 📋 実施した全ての修正（10回以上）

### 1. globals.css への即効パッチ（GPT提案）
```css
.rdp table { display: table !important; width: 100%; border-collapse: collapse; table-layout: fixed; }
.rdp thead { display: table-header-group !important; }
.rdp tbody { display: table-row-group !important; }
.rdp tr    { display: table-row !important; }
.rdp th, .rdp td { display: table-cell !important; vertical-align: middle; text-align: center; }
```
**結果**: 曜日ヘッダー7列表示は解決✅ セルサイズ問題は継続❌

---

### 2. ボタンサイズの強制固定（CSS変数使用）
```css
.rdp { --rdp-cell-size: 36px; }

.rdp .rdp-button,
.rdp button {
  width: var(--rdp-cell-size) !important;
  height: var(--rdp-cell-size) !important;
  min-width: var(--rdp-cell-size) !important;
  min-height: var(--rdp-cell-size) !important;
  max-width: var(--rdp-cell-size) !important;
  max-height: var(--rdp-cell-size) !important;
}
```
**結果**: 初回OK、リロード後NG❌

---

### 3. `all: unset` でリセット試行
```css
.rdp .rdp-button {
  all: unset !important;
  /* その後サイズ指定 */
}
```
**結果**: 初回OK、リロード後NG❌

---

### 4. `all: unset` を削除、特定プロパティだけ上書き
```css
.rdp .rdp-button,
.rdp button {
  box-sizing: border-box !important;
  display: inline-flex !important;
  width: var(--rdp-cell-size) !important;
  height: var(--rdp-cell-size) !important;
  /* ... 全プロパティ個別指定 */
}
```
**結果**: 初回OK、リロード後NG❌

---

### 5. セル自体（`.rdp-day`, `td`）のサイズ制限
```css
.rdp .rdp-day,
.rdp .rdp-cell,
.rdp td {
  width: var(--rdp-cell-size) !important;
  height: var(--rdp-cell-size) !important;
  min-width: var(--rdp-cell-size) !important;
  min-height: var(--rdp-cell-size) !important;
  max-width: var(--rdp-cell-size) !important;
  max-height: var(--rdp-cell-size) !important;
  overflow: hidden !important;
}
```
**結果**: 初回OK、リロード後NG❌

---

### 6. 選択状態のセルを強制固定
```css
.rdp .rdp-day_selected,
.rdp .rdp-day[data-selected="true"],
.rdp td[data-selected="true"] {
  width: var(--rdp-cell-size) !important;
  height: var(--rdp-cell-size) !important;
  /* ... 全サイズプロパティ */
}
```
**結果**: 初回OK、リロード後NG❌

---

### 7. calendar.tsx から `aspect-square h-full w-full` を削除
```typescript
// Before
day: cn("group/day relative aspect-square h-full w-full ...", defaultClassNames.day)

// After
day: cn("group/day relative select-none p-0 text-center ...", defaultClassNames.day)
```
**結果**: 初回OK、リロード後NG❌

---

### 8. calendar.tsx から `defaultClassNames.day` を完全削除
```typescript
// Before
day: cn("...", defaultClassNames.day)

// After
day: "group/day relative select-none p-0 text-center ..."
```
**結果**: 初回OK、リロード後NG❌

---

### 9. attendance-calendar.tsx の `styles` プロパティでインラインスタイル強制
```tsx
<Calendar
  styles={{
    day: {
      width: '36px',
      height: '36px',
      minWidth: '36px',
      minHeight: '36px',
      maxWidth: '36px',
      maxHeight: '36px',
      padding: '0',
      overflow: 'hidden',
    },
    day_button: {
      width: '36px',
      height: '36px',
      minWidth: '36px',
      minHeight: '36px',
      maxWidth: '36px',
      maxHeight: '36px',
      padding: '0',
      margin: '0',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }}
/>
```
**結果**: 初回OK、リロード後NG❌

---

### 10. attendance-calendar.tsx のインラインCSS（`<style>`タグ）
```tsx
<style dangerouslySetInnerHTML={{
  __html: `
    .calendar-wrapper .rdp-button {
      width: 36px !important;
      height: 36px !important;
      /* ... 全プロパティ !important */
    }
  `
}} />
```
**結果**: 初回OK、リロード後NG❌

---

## 🔍 推測される根本原因

### 最有力候補：選択状態の動的クラス付与
react-day-pickerが、日付選択時に以下のいずれかを動的に行っている可能性：
1. **JavaScriptでインラインスタイルを動的追加**（`element.style.width = 'auto'` など）
2. **動的クラス名の追加**で、隠れたCSSルールが適用される
3. **`data-selected="true"` 属性付与時に特殊な処理**が走る

### 証拠
- **初回表示時**: 選択前 or 静的な状態 → CSSが正しく適用される
- **リロード後**: 選択状態が復元される → 動的処理が走り、サイズが変わる

### その他の可能性
1. **Next.js Fast Refresh の影響**
   - 開発モードでのみ発生？
   - CSS Modules の読み込み順序がリロード時に変わる？

2. **MountGate による SSR/CSR 切り替え**
   - SSR時とCSR時でDOMの構築順序が違う
   - CSSの適用タイミングが異なる

3. **shadcn/ui の Calendar コンポーネントの内部実装**
   - `getDefaultClassNames()` の戻り値に問題がある
   - しかし削除しても効果なし

## 📦 現在のファイル構成

### globals.css（最終版）
- GPTの即効パッチ適用済み
- ボタンサイズ強制固定（36px）
- セルサイズ強制固定（36px）
- 選択状態セルも強制固定

### calendar.tsx（最終版）
- `aspect-square h-full w-full` 削除済み
- `defaultClassNames.day` 削除済み
- カスタムクラスのみ使用

### attendance-calendar.tsx（最終版）
- インラインCSS（`<style>`タグ）で強制適用
- `styles` プロパティでインラインスタイル強制
- `day` と `day_button` の全サイズプロパティ指定

## 🛠️ GPTへの質問

### 質問1: react-day-picker v9.11.1 の選択状態の実装
- 日付選択時に、JavaScriptでインラインスタイルを動的に追加していないか？
- `data-selected="true"` 属性付与時に何か特殊な処理をしていないか？
- 選択状態のセルだけにCSSが効かない理由は何か？

### 質問2: 初回OK、リロード後NGの原因
- Next.js 14.0.4 の Fast Refresh が関係しているか？
- MountGate（SSR/CSR切り替え）が関係しているか？
- CSS Modules の読み込み順序がリロード時に変わるか？

### 質問3: 解決策の提案

以下のアプローチで解決できるか：

#### オプションA: `useEffect` で DOM 直接操作
```tsx
useEffect(() => {
  const buttons = document.querySelectorAll('.rdp-button');
  buttons.forEach(btn => {
    (btn as HTMLElement).style.width = '36px';
    (btn as HTMLElement).style.height = '36px';
  });
}, [date]); // 選択状態変更時に実行
```

#### オプションB: react-day-picker の `components` プロップで完全カスタマイズ
```tsx
<Calendar
  components={{
    Day: ({ date, ...props }) => (
      <button
        {...props}
        style={{
          width: '36px',
          height: '36px',
          minWidth: '36px',
          maxWidth: '36px',
        }}
      >
        {date.getDate()}
      </button>
    ),
  }}
/>
```

#### オプションC: `!important` より強力な CSS
- `[style]` 属性セレクタで上書き？
- JavaScript で `MutationObserver` を使って監視？

#### オプションD: react-day-picker を使わない
- 完全自作カレンダーコンポーネント
- または別のライブラリに切り替え

### 質問4: DevTools での確認方法
リロード後、選択中のセル（12）で確認すべき項目：
1. Elements タブで `<button>` に `style=""` 属性があるか？
2. Computed タブの `width` が `36px` になっているか？
3. Styles タブで、どのルールが最終的に適用されているか？

## 🎯 期待される結果

```
Su  Mo  Tu  We  Th  Fr  Sa
28  29  30   1   2   3   4
 5   6   7   8   9  10  11
[12] 13  14  15  16  17  18  ← 選択中の12も他と同じサイズ
```

**全てのセルが36px x 36pxで統一され、初回表示・リロード後・日付選択後も崩れない。**

---

## 📊 環境情報

```json
{
  "next": "14.0.4",
  "react": "18.2.0",
  "react-day-picker": "9.11.1",
  "tailwindcss": "3.3.0",
  "typescript": "5.3.3",
  "browser": "Chrome 最新版",
  "os": "macOS (Darwin 24.6.0)"
}
```

---

**Claude Code での試行回数**: 10回以上
**全て失敗**: 初回表示OK、リロード後に選択中のセルだけが巨大化

この問題の解決策を教えてください。
