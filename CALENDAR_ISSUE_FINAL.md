# カレンダー曜日ヘッダー問題 - GPT最終相談

## 現在の状況（スクリーンショット参照）
✅ **日付は完璧に7列のグリッド表示になっている**
❌ **曜日ヘッダーが "SuMoTuWeThrFrSa" と詰まって表示されている**

## 問題の詳細
- 日付セルは正しくtable-cellとして横並び
- 曜日ヘッダーが `display: table-cell` にならず、横に詰まっている
- または、曜日ヘッダーの各セルに幅が適用されていない

## 実施した修正

### 1. react-day-pickerの公式CSSをインポート
```css
/* globals.css */
@import 'react-day-picker/dist/style.css';
```

### 2. テーブルレイアウト強制CSS
```css
/* calendar-fix.css */
.rdp table { display: table !important; }
.rdp thead { display: table-header-group !important; }
.rdp tbody { display: table-row-group !important; }
.rdp tr    { display: table-row !important; }
.rdp th,
.rdp td    { display: table-cell !important; }

/* 曜日ヘッダー専用 */
.rdp-weekdays { display: table-header-group !important; }
.rdp-weekdays tr { display: table-row !important; }
.rdp-weekdays th { display: table-cell !important; }
```

### 3. calendar.tsxのclassNames設定
```typescript
classNames={{
  month_grid: "w-full",
  weekdays: cn("w-full", defaultClassNames.weekdays),  // flexを削除済み
  weekday: cn("text-muted-foreground select-none ...", defaultClassNames.weekday),
  week: cn("mt-2 w-full", defaultClassNames.week),     // flexを削除済み
}}
```

## 結果
- ✅ 日付は7列で完璧に表示
- ❌ 曜日ヘッダーだけが詰まっている（"SuMoTuWeThrFrSa"）

## 推測される原因

### 可能性1: 曜日ヘッダーのDOM構造が違う
react-day-pickerが曜日ヘッダーを`<thead>`の中ではなく、別の構造でレンダリングしている可能性

### 可能性2: .rdp-weekdaysが`<tr>`ではなく`<div>`
もし`.rdp-weekdays`が`<div>`要素で、その中に曜日が入っている場合、table-header-groupでは効かない

### 可能性3: 曜日個別セルのクラス名が違う
`.rdp-weekdays th` ではなく、`.rdp-weekday`（単数形）が個別セルのクラスかもしれない

### 可能性4: widthが設定されていない
各曜日セルに `width: calc(100% / 7)` や `width: 14.2857%` が必要

## GPTへの質問

### 質問1: 曜日ヘッダーの実際のDOM構造
react-day-picker v9.11.1で、曜日ヘッダーはどのようなHTML構造でレンダリングされますか？

期待する構造：
```html
<table class="rdp-month_grid">
  <thead class="rdp-weekdays">
    <tr>
      <th class="rdp-weekday">Su</th>
      <th class="rdp-weekday">Mo</th>
      ...
    </tr>
  </thead>
</table>
```

実際の構造：
```html
<!-- これを確認したい -->
<div class="rdp-weekdays">
  <div class="rdp-weekday">Su</div>
  <div class="rdp-weekday">Mo</div>
  ...
</div>
```

### 質問2: 必要なCSS
曜日ヘッダーを7列に横並びにするために、**正確に**どのCSSセレクタにどのスタイルを適用すべきですか？

現在のスクリーンショットを見ると：
- 日付は完璧に7列
- 曜日だけが詰まっている

### 質問3: shadcn/uiのカレンダーコンポーネントでの対処法
shadcn/uiのカレンダーコンポーネントで`getDefaultClassNames()`を使用している場合、どのようにclassNamesを上書きすべきですか？

現在のコード：
```typescript
weekdays: cn("w-full", defaultClassNames.weekdays),
weekday: cn("text-muted-foreground select-none ...", defaultClassNames.weekday),
```

## 追加情報

### インラインスタイルも試行済み
attendance-calendar.tsxにインラインスタイルも追加しているが、効果なし：
```tsx
<style dangerouslySetInnerHTML={{
  __html: `
    .calendar-wrapper .rdp-weekdays { display: table-header-group !important; }
    .calendar-wrapper .rdp-weekdays tr { display: table-row !important; }
    .calendar-wrapper .rdp-weekdays th { display: table-cell !important; }
  `
}} />
```

### 確認したいこと
DevToolsで確認すべき具体的な項目：
1. `.rdp-weekdays`要素のタグ名（`<thead>`, `<div>`, その他？）
2. 曜日個別要素のタグ名とクラス名
3. 適用されているComputedスタイル（特に`display`プロパティ）

## 期待される解決策

### オプションA: 正確なCSSセレクタ
実際のDOM構造に合わせた正確なCSSセレクタを教えてください

### オプションB: classNamesの完全な上書き
shadcn/uiのデフォルトを完全に無視して、必要なclassNamesだけを適用する方法

### オプションC: react-day-pickerのコンポーネントカスタマイズ
`components`プロップで曜日ヘッダーをカスタマイズする方法

## プロジェクト情報
- **Next.js**: 14.0.4
- **react-day-picker**: v9.11.1
- **Tailwind CSS**: v3.3.0
- **shadcn/ui**: カレンダーコンポーネント使用

## 最終的に欲しい結果
```
Su  Mo  Tu  We  Th  Fr  Sa
28  29  30   1   2   3   4
 5   6   7   8   9  10  11
12  13  14  15  16  17  18
...
```

曜日ヘッダーが7列に均等に広がり、各曜日が明確に分離されている状態。

---

**GPTへの直接的な質問**:
「react-day-picker v9.11.1で、日付は7列で完璧に表示されているのに、曜日ヘッダーだけが "SuMoTuWeThrFrSa" と詰まってしまいます。曜日ヘッダーを日付と同じように7列に均等配置するには、どのようなCSSを適用すればよいですか？実際のDOM構造とセレクタを含めて教えてください。」
