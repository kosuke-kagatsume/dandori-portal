# DevToolsでの確認手順

## 手順1: 曜日ヘッダーの要素を検査

1. ブラウザで http://localhost:3001/ja/attendance にアクセス
2. 「カレンダー」タブを開く
3. 曜日ヘッダー（"SuMoTuWeThrFrSa"）を右クリック
4. 「検証」または「Inspect」を選択

## 手順2: 確認する情報

### A. 要素のHTML構造
Elementsタブで以下を確認：

```
期待される構造:
<table class="rdp-month_grid">
  <thead class="rdp-weekdays">
    <tr>
      <th class="rdp-weekday">Su</th>
      <th class="rdp-weekday">Mo</th>
      ...
    </tr>
  </thead>
</table>

実際の構造（これを確認したい）:
- .rdp-weekdays は何のタグ？ (<thead>, <div>, その他？)
- 曜日個別は何のタグ？ (<th>, <div>, <span>？)
- クラス名は？ (.rdp-weekday か別の名前か？)
```

### B. Computedスタイル
Computedタブで以下を確認：

**`.rdp-weekdays`要素:**
- `display`: ?
- `width`: ?

**曜日個別要素（例：Su）:**
- `display`: ?
- `width`: ?
- `text-align`: ?

### C. Stylesパネル
どのCSSファイルのどのルールが適用されているか確認

## 手順3: コンソールで実行

Consoleタブで以下を実行してコピー：

```javascript
// 曜日ヘッダーの構造を確認
const weekdays = document.querySelector('.rdp-weekdays');
console.log('=== WEEKDAYS CONTAINER ===');
console.log('Tag:', weekdays?.tagName);
console.log('Classes:', weekdays?.className);
console.log('Display:', window.getComputedStyle(weekdays).display);
console.log('Width:', window.getComputedStyle(weekdays).width);
console.log('HTML:', weekdays?.outerHTML);

// 曜日個別要素を確認
const weekdayItems = document.querySelectorAll('.rdp-weekdays > *');
console.log('\n=== INDIVIDUAL WEEKDAYS ===');
weekdayItems.forEach((item, idx) => {
  console.log(`Weekday ${idx}:`, {
    tag: item.tagName,
    class: item.className,
    display: window.getComputedStyle(item).display,
    width: window.getComputedStyle(item).width,
    text: item.textContent
  });
});

// 親のtable要素も確認
const table = document.querySelector('.rdp table');
console.log('\n=== TABLE ===');
console.log('Display:', window.getComputedStyle(table).display);
console.log('Width:', window.getComputedStyle(table).width);
```

この出力結果を全てコピーしてGPTに送信してください。
