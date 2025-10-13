# カレンダー曜日ヘッダー問題 - GPT詳細レポート

## 🔴 問題の症状

### 現象
- **初回表示時**: 曜日ヘッダーが7列で正しく表示される（Su Mo Tu We Th Fr Sa）
- **リロード後**: 曜日ヘッダーが圧縮されて「SuMoTuWeThrFrSa」と1行に詰まる
- **日付セルは常に完璧**: 28 29 30 1 2 3 4... と7列グリッドで正しく表示される

### 確認した事実
1. ✅ 日付セル（`<td>`）は常に7列グリッドで完璧に表示
2. ❌ 曜日ヘッダー（`<th>`）だけがリロード後に圧縮される
3. ✅ react-day-picker v9.11.1 のDOM構造を確認済み：
   - `Weekdays` コンポーネント: `<thead><tr {...props}></tr></thead>`
   - `Weekday` コンポーネント: `<th {...props}></th>`
   - つまり `.rdp-weekdays` は `<tr>` 要素、`.rdp-weekday` は `<th>` 要素

## 📋 試行した修正（全て失敗）

### 試行1: calendar.tsx の defaultClassNames 順序変更
```typescript
// Before
weekdays: cn("w-full", defaultClassNames.weekdays)

// After
weekdays: cn(defaultClassNames.weekdays, "w-full")
```
**結果**: 変化なし。初回OK、リロード後NG。

---

### 試行2: calendar.tsx の defaultClassNames 完全削除
```typescript
// After
weekdays: "w-full",
weekday: "text-muted-foreground select-none text-[0.8rem] font-normal text-center",
week: "mt-2 w-full",
```
**結果**: 変化なし。初回OK、リロード後NG。

---

### 試行3: globals.css の import 順序変更
```css
/* Before */
@import '../styles/calendar-fix.css';
@import 'react-day-picker/dist/style.css';

/* After */
@import 'react-day-picker/dist/style.css';
@import '../styles/calendar-fix.css';
```
**結果**: 変化なし。初回OK、リロード後NG。

---

### 試行4: calendar-fix.css の修正（.rdp-weekdays を table-row に）
```css
/* 修正前（間違い） */
.rdp-weekdays {
  display: table-header-group !important;  /* <thead> 用 */
}

/* 修正後（正しい） */
.rdp-weekdays {
  display: table-row !important;  /* <tr> 要素なのでこれが正解 */
  width: 100% !important;
}

.rdp-weekday {
  display: table-cell !important;
  vertical-align: middle !important;
  text-align: center !important;
  width: calc(100% / 7) !important;  /* 14.2857% */
}
```
**結果**: 変化なし。初回OK、リロード後NG。

---

### 試行5: attendance-calendar.tsx のインラインスタイル強化
```tsx
<style dangerouslySetInnerHTML={{
  __html: `
    .calendar-wrapper .rdp table {
      display: table !important;
      width: 100% !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
    }
    .calendar-wrapper .rdp tr {
      display: table-row !important;
      width: 100% !important;
    }
    .calendar-wrapper .rdp th,
    .calendar-wrapper .rdp td {
      display: table-cell !important;
      width: 14.2857% !important;
    }
    .calendar-wrapper .rdp-weekdays,
    .calendar-wrapper thead tr {
      display: table-row !important;
      width: 100% !important;
    }
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
**結果**: 変化なし。初回OK、リロード後NG。

---

### 試行6: attendance-calendar.tsx の classNames に !important 付き Tailwind
```tsx
<Calendar
  classNames={{
    table: "w-full border-collapse !table",
    weekdays: "w-full !table-row",
    weekday: "text-muted-foreground select-none text-[0.8rem] font-normal text-center !table-cell",
    week: "mt-2 w-full !table-row",
  }}
/>
```
**結果**: 変化なし。初回OK、リロード後NG。

---

### 試行7: attendance-calendar.tsx の styles プロパティでインラインスタイル直接適用
```tsx
<Calendar
  styles={{
    table: { display: 'table', width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
    month_grid: { width: '100%' },
    weekdays: { display: 'table-row', width: '100%' },
    weekday: { display: 'table-cell', textAlign: 'center', verticalAlign: 'middle', width: '14.2857%' },
    week: { display: 'table-row', width: '100%' },
    day: { display: 'table-cell', textAlign: 'center', verticalAlign: 'middle', width: '14.2857%' },
  }}
  classNames={{
    table: "w-full border-collapse",
    month_grid: "w-full",
    weekdays: "w-full",
    weekday: "text-muted-foreground select-none text-[0.8rem] font-normal",
    week: "mt-2 w-full",
  }}
/>
```
**結果**: 変化なし。初回OK、リロード後NG。

---

## 🔍 推測される根本原因

### 可能性A: CSS読み込みタイミングの問題
- 初回表示時: MountGateでSSR→CSR遷移時にインラインスタイルが先に適用される
- リロード後: 外部CSSが後から読み込まれて上書きする
- しかし `!important` やインラインスタイルでも効かない

### 可能性B: shadcn/ui または Tailwind の CSS リセットが後から適用される
- Tailwind の `@tailwind base` が後から読み込まれている？
- globals.css の順序:
  ```css
  @import 'react-day-picker/dist/style.css';
  @import '../styles/calendar-fix.css';
  @tailwind base;  /* ← これが後から適用されて上書き？ */
  @tailwind components;
  @tailwind utilities;
  ```

### 可能性C: react-day-picker の defaultClassNames に flexbox 指定がある
- `getDefaultClassNames()` の戻り値に `display: flex` などが含まれている
- これが後から適用されている
- しかし削除しても効果なし

### 可能性D: Next.js の CSS Modules の読み込み順序
- Next.js 14.0.4 の CSS Modules が特定の順序で読み込まれる
- 開発モード（初回）と本番モード（リロード後）で順序が変わる

### 可能性E: MountGate による SSR/CSR の切り替えで何かが起きている
- SSR時は適用されないはずのCSSがCSR時に遅延読み込みされる
- しかし MountGate 内のインラインスタイルが効かない理由にはならない

## 📦 現在のファイル構成

### src/app/globals.css（4行目）
```css
@import '../styles/tokens.css';
@import '../styles/brand-colors.css';
@import 'react-day-picker/dist/style.css';
@import '../styles/calendar-fix.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

### src/styles/calendar-fix.css（28-51行目）
```css
/* 曜日ヘッダー行を強制 */
/* .rdp-weekdays は <tr> 要素なので table-row */
.rdp-weekdays {
  display: table-row !important;
  width: 100% !important;
}

.rdp thead tr {
  display: table-row !important;
}

/* .rdp-weekday は <th> 要素 */
.rdp-weekday {
  display: table-cell !important;
  vertical-align: middle !important;
  text-align: center !important;
  width: calc(100% / 7) !important;
}

.rdp thead th {
  display: table-cell !important;
  vertical-align: middle !important;
  text-align: center !important;
}
```

### src/components/ui/calendar.tsx（87-94行目）
```typescript
table: "w-full border-collapse",
month_grid: "w-full",
weekdays: "w-full",
weekday: "text-muted-foreground select-none rounded-md text-[0.8rem] font-normal text-center",
week: "mt-2 w-full",
```
（defaultClassNames を完全削除済み）

### src/features/attendance/attendance-calendar.tsx（143-206行目）
- インラインスタイル（`<style dangerouslySetInnerHTML>`）で最強の !important
- `styles` プロパティで直接インラインスタイル適用
- `classNames` プロパティで Tailwind クラス適用

**3重の防御を実装したが、全て効果なし。**

---

## 🛠️ 必要な情報（DevTools で確認してください）

### 手順
1. http://localhost:3001/ja/attendance を開く
2. カレンダータブをクリック
3. 「Su」の文字を右クリック → 検証
4. DevTools の Elements タブで `<th>` 要素が選択される
5. Computed タブを開く

### 確認項目
```
1. display: ??? (table-cell であるべき)
2. width: ??? (14.2857% または calc(100% / 7) であるべき)
3. text-align: ??? (center であるべき)
4. vertical-align: ??? (middle であるべき)
```

### Styles タブで確認
```
どのCSSファイル・ルールが実際に適用されているか？
- calendar-fix.css の .rdp-weekday が適用されているか？
- 他のルールで上書きされているか？
- 取り消し線（strikethrough）が付いているルールは？
```

### Console で実行して出力を送ってください
```javascript
const weekday = document.querySelector('.rdp-weekday');
console.log('=== WEEKDAY ELEMENT ===');
console.log('Tag:', weekday?.tagName);
console.log('Classes:', weekday?.className);
console.log('Display:', window.getComputedStyle(weekday).display);
console.log('Width:', window.getComputedStyle(weekday).width);
console.log('Text-align:', window.getComputedStyle(weekday).textAlign);
console.log('Vertical-align:', window.getComputedStyle(weekday).verticalAlign);
console.log('Inline styles:', weekday?.style.cssText);
console.log('HTML:', weekday?.outerHTML);

const weekdays = document.querySelector('.rdp-weekdays');
console.log('\n=== WEEKDAYS ROW ===');
console.log('Tag:', weekdays?.tagName);
console.log('Classes:', weekdays?.className);
console.log('Display:', window.getComputedStyle(weekdays).display);
console.log('Width:', window.getComputedStyle(weekdays).width);
console.log('Inline styles:', weekdays?.style.cssText);
console.log('HTML:', weekdays?.outerHTML);
```

---

## 💡 GPTへの質問

### 質問1: なぜ初回表示時は正しく、リロード後に崩れるのか？
- CSS読み込み順序の問題？
- Next.js 14.0.4 の CSS Modules の特性？
- SSR/CSR の切り替えに起因する問題？

### 質問2: インラインスタイル（styles プロパティ）が効かない理由
- DayPicker の `styles` プロパティは本当にインラインスタイルとして適用されるのか？
- react-day-picker v9.11.1 の内部実装で何か特殊な処理をしている？

### 質問3: 解決策の提案
以下の観点から解決策を提案してください：

#### オプションA: CSS読み込み順序の完全制御
- `@layer` ディレクティブを使用する？
- CSS Modules の `composes` を使用する？

#### オプションB: react-day-picker のコンポーネントカスタマイズ
- `components.Weekdays` と `components.Weekday` を完全にカスタムコンポーネントで置き換える？
```typescript
<Calendar
  components={{
    Weekdays: (props) => <tr {...props} style={{ display: 'table-row', width: '100%' }} />,
    Weekday: (props) => <th {...props} style={{ display: 'table-cell', width: '14.2857%' }} />,
  }}
/>
```

#### オプションC: Tailwind の設定変更
- tailwind.config.ts の `important` オプションを `true` にする？
- `corePlugins` で display 関連を無効化する？

#### オプションD: Next.js の CSS 設定変更
- next.config.js で CSS 読み込み順序を制御する？

---

## 📊 環境情報

```json
{
  "next": "14.0.4",
  "react": "18.2.0",
  "react-day-picker": "9.11.1",
  "tailwindcss": "3.3.0",
  "typescript": "5.3.3"
}
```

### ブラウザ
- Chrome 最新版

### OS
- macOS (Darwin 24.6.0)

---

## 🆘 最終的に欲しい結果

```
Su  Mo  Tu  We  Th  Fr  Sa
28  29  30   1   2   3   4
 5   6   7   8   9  10  11
12  13  14  15  16  17  18
```

**曜日ヘッダーが日付セルと同じように7列に均等配置され、リロード後も崩れない。**

---

**Claude Codeでの試行回数**: 7回以上
**全て失敗**: 初回表示OKだがリロード後に必ず崩れる

この問題の解決策を教えてください。
