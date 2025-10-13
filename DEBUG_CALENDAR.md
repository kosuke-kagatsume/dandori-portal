# カレンダーデバッグ手順

## 現在の状況
- カレンダーが3列のグリッド表示になっている
- 本来は7列（日～土）であるべき

## DevToolsでの確認方法

### 1. 要素の検査
1. カレンダーの日付（例：「1」）を右クリック
2. 「検証」または「Inspect」を選択
3. Elements（要素）タブで親要素を確認

### 2. 確認すべき項目

#### A. クラス名の確認
カレンダーのDOM構造で以下のクラスが存在するか：
```
<div class="rdp-month_grid">
  <div class="rdp-weekday">Su</div>
  <div class="rdp-weekday">Mo</div>
  ...
  <div class="rdp-day">1</div>
  <div class="rdp-day">2</div>
  ...
</div>
```

**質問**:
- `.rdp-month_grid` クラスは存在しますか？
- 別のクラス名（例：`.rdp-weeks`や`.rdp-month-grid`）になっていませんか？

#### B. 適用されているスタイルの確認
1. `.rdp-month_grid`（または類似の親要素）を選択
2. Styles（スタイル）タブまたはComputed（計算済み）タブを開く
3. 以下を確認：
   - `display: grid` が適用されているか
   - `grid-template-columns` の値は何か
   - もし `repeat(3, 1fr)` になっていたら、それが原因

#### C. CSS上書きの確認
Stylesタブで：
```css
/* これが適用されているべき */
.rdp-month_grid {
  display: grid !important;
  grid-template-columns: repeat(7, 1fr) !important;
}
```

もし別のルールで上書きされている場合、そのセレクタをメモしてください。

### 3. スクリーンショット
以下のスクリーンショットを撮ってください：
1. Elements タブでDOM構造が見える状態
2. Styles タブで`.rdp-month_grid`（または類似要素）に適用されているCSSが見える状態

### 4. コンソールで確認
Consoleタブで以下を実行：
```javascript
// グリッド要素を取得
const grid = document.querySelector('.rdp-month_grid');
if (grid) {
  console.log('Grid found!');
  console.log('Class:', grid.className);
  console.log('Style:', window.getComputedStyle(grid).gridTemplateColumns);
} else {
  console.log('Grid NOT found. Looking for similar...');
  const alternatives = document.querySelectorAll('[class*="month"]');
  console.log('Possible elements:', alternatives);
  alternatives.forEach(el => console.log(el.className));
}
```

このコマンドの出力結果を教えてください。

## 予想される原因

### 原因1: react-day-pickerがCSS Modulesを使用
もしクラス名が `.rdp-month_grid__abc123` のようになっている場合、CSS Modulesによるハッシュ化が行われています。

### 原因2: 別の要素がグリッドを制御
`.rdp-month_grid`ではなく、別の要素（例：`.rdp-weeks`）がグリッドレイアウトを制御している可能性があります。

### 原因3: shadcn/uiのカスタマイズ
calendar.tsxコンポーネントが独自のclassNamesでreact-day-pickerのデフォルトクラスを上書きしている可能性があります。

## 次のステップ

上記の情報を確認できたら、正確なクラス名と適用されているCSSを教えてください。
それに基づいて、正しいCSSセレクタを作成します。
