# カレンダー問題 - 最終レポート v3

## 🔴 現在の状況（2025-10-12）

### 完全に解決した問題
✅ **曜日ヘッダーの7列表示** - 完璧に動作（Su Mo Tu We Th Fr Sa）
✅ **日付セルの7列グリッド** - 常に完璧に動作

### 解決できていない問題
❌ **選択中のセル（12）だけが巨大化する**
- **初回表示時**: 全てのセルが統一サイズ（36px x 36px）で完璧 ✅
- **リロード後**: 選択中のセル（12）だけが巨大化 ❌
- **他のセル**: 常に36px x 36pxで正しい ✅

## 📋 実施した全ての修正（11回）

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

### 3. セル自体（`.rdp-day`, `td`）のサイズ制限
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

### 4. 選択状態のセルを強制固定
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

### 5. calendar.tsx から `aspect-square h-full w-full` を削除
```typescript
// Before
day: cn("group/day relative aspect-square h-full w-full ...", defaultClassNames.day)

// After
day: cn("group/day relative select-none p-0 text-center ...", defaultClassNames.day)
```
**結果**: 初回OK、リロード後NG❌

---

### 6. calendar.tsx から `defaultClassNames.day` を完全削除
```typescript
// Before
day: cn("...", defaultClassNames.day)

// After
day: "group/day relative select-none p-0 text-center ..."
```
**結果**: 初回OK、リロード後NG❌

---

### 7. attendance-calendar.tsx の `styles` プロパティでインラインスタイル強制
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

### 8. attendance-calendar.tsx のインラインCSS（`<style>`タグ）
```tsx
<style dangerouslySetInnerHTML={{
  __html: `
    .calendar-wrapper .rdp table {
      display: table !important;
      width: 100% !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
    }
    .calendar-wrapper .rdp thead {
      display: table-header-group !important;
    }
    .calendar-wrapper .rdp tbody {
      display: table-row-group !important;
    }
    .calendar-wrapper .rdp tr {
      display: table-row !important;
      width: 100% !important;
    }
    .calendar-wrapper .rdp th,
    .calendar-wrapper .rdp td {
      display: table-cell !important;
      vertical-align: middle !important;
      text-align: center !important;
      width: 14.2857% !important;
    }
    /* .rdp-weekdays は <tr> 要素 */
    .calendar-wrapper .rdp-weekdays,
    .calendar-wrapper thead tr {
      display: table-row !important;
      width: 100% !important;
    }
    /* .rdp-weekday は <th> 要素 - 最優先 */
    .calendar-wrapper .rdp-weekday,
    .calendar-wrapper thead th {
      display: table-cell !important;
      vertical-align: middle !important;
      text-align: center !important;
      width: 14.2857% !important;
      min-width: 40px !important;
      max-width: none !important;
    }
  `
}} />
```
**結果**: 初回OK、リロード後NG❌

---

### 9. useEffect でDOM直接操作（初回実行）
```tsx
useEffect(() => {
  const fixCalendarSize = () => {
    const cells = document.querySelectorAll('.rdp .rdp-day, .rdp td');
    const buttons = document.querySelectorAll('.rdp button, .rdp .rdp-button');

    cells.forEach((cell) => {
      if (cell instanceof HTMLElement) {
        cell.style.width = '36px';
        cell.style.height = '36px';
        cell.style.minWidth = '36px';
        cell.style.minHeight = '36px';
        cell.style.maxWidth = '36px';
        cell.style.maxHeight = '36px';
        cell.style.padding = '0';
      }
    });

    buttons.forEach((button) => {
      if (button instanceof HTMLElement) {
        button.style.width = '36px';
        button.style.height = '36px';
        button.style.minWidth = '36px';
        button.style.minHeight = '36px';
        button.style.maxWidth = '36px';
        button.style.maxHeight = '36px';
        button.style.padding = '0';
        button.style.margin = '0';
        button.style.display = 'inline-flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
      }
    });
  };

  fixCalendarSize();
}, []);
```
**結果**: 初回OK、リロード後NG❌

---

### 10. useEffect でDOM直接操作（遅延実行追加）
```tsx
useEffect(() => {
  const fixCalendarSize = () => {
    // ... same as above
  };

  // 初回実行
  fixCalendarSize();

  // 0.5秒後にもう一度実行（CSSが適用された後）
  const timer = setTimeout(fixCalendarSize, 500);

  return () => clearTimeout(timer);
}, [date]);
```
**結果**: 初回OK、リロード後NG❌

---

### 11. 複数のCSS強制適用を組み合わせ
- globals.css の強制スタイル
- attendance-calendar.tsx のインラインCSS
- attendance-calendar.tsx の styles プロップ
- useEffect での DOM 直接操作

**結果**: 初回OK、リロード後NG❌

---

## 🔍 根本原因の推測

### 最有力候補：react-day-pickerの内部実装
react-day-pickerが、日付選択時に以下のいずれかを動的に行っている可能性：

1. **JavaScriptでインラインスタイルを動的追加**
   - `element.style.width = 'auto'` などで上書き
   - これが`!important`やインラインスタイルより優先される

2. **選択状態の復元時に特殊な処理**
   - リロード後、`selected`状態が復元される
   - その際に動的スタイルが適用される
   - 初回表示時は静的なので問題ない

3. **getDefaultClassNames()の戻り値**
   - calendar.tsx で削除しても効果なし
   - react-day-picker内部で別のスタイルが適用されている可能性

### その他の可能性

1. **Next.js Fast Refresh の影響**
   - 開発モードでのみ発生？
   - CSS Modules の読み込み順序がリロード時に変わる？

2. **MountGate による SSR/CSR 切り替え**
   - SSR時とCSR時でDOMの構築順序が違う
   - CSSの適用タイミングが異なる

3. **Tailwind CSS の purge/JIT**
   - 動的に生成されるクラスが purge される
   - リロード時に再生成されるが順序が変わる

---

## 📦 現在のファイル状態

### globals.css
- ✅ GPTの即効パッチ適用済み
- ✅ ボタンサイズ強制固定（36px）
- ✅ セルサイズ強制固定（36px）
- ✅ 選択状態セルも強制固定

### calendar.tsx
- ✅ `aspect-square h-full w-full` 削除済み
- ✅ `defaultClassNames.day` 削除済み
- ✅ カスタムクラスのみ使用

### attendance-calendar.tsx
- ✅ インラインCSS（`<style>`タグ）で強制適用
- ✅ `styles` プロパティでインラインスタイル強制
- ✅ `useEffect` で DOM 直接操作（初回+遅延）
- ✅ `day` と `day_button` の全サイズプロパティ指定

---

## 🎯 推奨される次のステップ

### オプションA: MutationObserver で監視（未実装）
JavaScriptで動的スタイル変更を監視し、即座に修正する：

```tsx
useEffect(() => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const target = mutation.target as HTMLElement;
        if (target.tagName === 'BUTTON' && target.closest('.rdp')) {
          target.style.width = '36px';
          target.style.height = '36px';
          // ... 他のスタイル
        }
      }
    });
  });

  const calendar = document.querySelector('.rdp');
  if (calendar) {
    observer.observe(calendar, {
      attributes: true,
      attributeFilter: ['style'],
      subtree: true,
    });
  }

  return () => observer.disconnect();
}, []);
```

**メリット**: 動的変更を即座にキャッチして修正
**デメリット**: パフォーマンスへの影響、複雑性増加

---

### オプションB: components プロップで完全カスタマイズ（未実装）
react-day-pickerのDayButtonを完全に自作：

```tsx
import { DayButton } from 'react-day-picker';

const CustomDayButton = ({ day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) => {
  return (
    <button
      {...props}
      style={{
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
        border: 'none',
        background: modifiers.selected ? 'rgb(37 99 235)' : 'transparent',
        color: modifiers.selected ? '#fff' : 'inherit',
        borderRadius: '10px',
        cursor: 'pointer',
      }}
    >
      {day.date.getDate()}
    </button>
  );
};

<Calendar
  components={{
    DayButton: CustomDayButton,
  }}
/>
```

**メリット**: react-day-pickerの内部スタイルを完全にバイパス
**デメリット**: アクセシビリティ・フォーカス管理を自前で実装

---

### オプションC: react-day-pickerを使わない（最終手段）
完全自作カレンダーコンポーネント、または別のライブラリに切り替え

**候補ライブラリ**:
- `react-calendar`
- `@mui/x-date-pickers`
- 完全自作（date-fns + カスタムUI）

**メリット**: 完全なコントロール
**デメリット**: 実装コスト大、アクセシビリティ対応が必要

---

### オプションD: 本番ビルドで確認（重要）
開発環境（`npm run dev`）でのみ発生している可能性：

```bash
npm run build
npm run start
```

**確認事項**:
1. 本番ビルドでも同じ問題が起きるか？
2. Fast Refresh が原因の可能性があるため、本番では問題ない可能性

---

## 🚨 緊急度と優先順位

### 緊急度：中
- カレンダーの7列表示は動作している
- 選択セルのサイズ問題は見た目のみ
- 機能自体は正常動作

### 推奨アクション
1. **まず本番ビルドで確認**（オプションD）- 最も簡単
2. **本番でも発生する場合**:
   - オプションB（components カスタマイズ）を試す
   - ダメならオプションA（MutationObserver）
   - 最終手段：オプションC（ライブラリ変更）

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
  "os": "macOS (Darwin 24.6.0)",
  "mode": "development (npm run dev)"
}
```

---

## 📸 問題の証拠

### 初回表示時（正常）
```
Su  Mo  Tu  We  Th  Fr  Sa
28  29  30   1   2   3   4
 5   6   7   8   9  10  11
[12] 13  14  15  16  17  18  ← 選択中の12も正しいサイズ
```

### リロード後（異常）
```
Su  Mo  Tu  We  Th  Fr  Sa
28  29  30   1   2   3   4
 5   6   7   8   9  10  11
[  12  ] 13  14  15  16  17  18  ← 選択中の12だけ巨大化
```

---

## ✅ 次回への引き継ぎ事項

1. **本番ビルドで確認すること**（最優先）
2. **開発環境でのみ発生する場合**: 開発時は無視して先に進む
3. **本番でも発生する場合**: オプションB → A → C の順で試す
4. **全て失敗した場合**: react-day-pickerの Issue を確認、または別ライブラリへ移行

---

**作成日時**: 2025-10-12
**試行回数**: 11回
**成功率**: 初回表示 100% / リロード後 0%
**パターン**: 「初回OK、リロード後NG」が一貫して再現
