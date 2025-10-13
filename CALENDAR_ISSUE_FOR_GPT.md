# カレンダーレイアウト問題 - GPT相談用レポート

## 問題の概要
react-day-picker v9.11.1を使用したカレンダーコンポーネントが、7列のグリッド表示ではなく、縦一列に表示される問題が継続しています。

## 環境
- **プロジェクト**: DandoriPortal (Next.js 14.0.4)
- **ライブラリ**: react-day-picker v9.11.1
- **UI**: shadcn/ui のカレンダーコンポーネント
- **スタイリング**: Tailwind CSS + CSS Modules

## 現在の状態
スクリーンショットによると：
- カレンダーの日付が縦一列に表示されている (1, 2, 3, 4, 5, 6...)
- 曜日ヘッダーは "Su Mo Tu We Th Fr Sa" と表示されているが、横並びではない
- リロードしても問題が解決しない

## 試したアプローチ

### アプローチ 1: CSS Gridレイアウト (失敗)
```css
.rdp-month_grid {
  display: grid !important;
  grid-template-columns: repeat(7, 1fr) !important;
}
```
**結果**: 3列のグリッドになったが、7列にはならなかった

### アプローチ 2: Tableレイアウトへの変更 (失敗)
calendar.tsxから`flex`クラスを削除し、Tableレイアウトに変更：
```typescript
// calendar.tsx
month_grid: "w-full",
weekdays: cn("w-full", defaultClassNames.weekdays),  // flexを削除
week: cn("mt-2 w-full", defaultClassNames.week),      // flexを削除
```

```css
.rdp-month_grid { display: table !important; }
.rdp-weekdays { display: table-header-group !important; }
.rdp-week { display: table-row !important; }
.rdp-weekday, .rdp-day {
  display: table-cell !important;
  width: calc(100% / 7) !important;
}
```
**結果**: 変化なし、依然として縦一列

### アプローチ 3: インラインスタイルの追加 (失敗)
attendance-calendar.tsxにインラインスタイルを追加：
```tsx
<div className="calendar-wrapper">
  <style dangerouslySetInnerHTML={{
    __html: `
      .calendar-wrapper .rdp-month_grid {
        display: table !important;
        width: 100% !important;
        border-collapse: collapse !important;
        table-layout: fixed !important;
      }
      ...
    `
  }} />
  <Calendar ... />
</div>
```
**結果**: 変化なし

## 関連ファイル

### 1. Calendar Component
**ファイル**: `/Users/dw100/dandori-portal/src/components/ui/calendar.tsx`
```typescript
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

export function Calendar({ className, classNames, ... }: ...) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      className={cn("bg-background group/calendar p-3 w-full ...", className)}
      classNames={{
        month_grid: "w-full",
        weekdays: cn("w-full", defaultClassNames.weekdays),
        week: cn("mt-2 w-full", defaultClassNames.week),
        day: cn("group/day relative aspect-square ...", defaultClassNames.day),
        ...
      }}
      {...props}
    />
  )
}
```

### 2. Attendance Calendar
**ファイル**: `/Users/dw100/dandori-portal/src/features/attendance/attendance-calendar.tsx`
```typescript
<MountGate>
  <div className="calendar-wrapper">
    <style dangerouslySetInnerHTML={{ __html: `...` }} />
    <Calendar mode="single" selected={date} onSelect={setDate} />
  </div>
</MountGate>
```

### 3. Calendar Fix CSS
**ファイル**: `/Users/dw100/dandori-portal/src/styles/calendar-fix.css`
```css
.rdp-root { width: 100% !important; }
.rdp-month_grid { display: table !important; ... }
.rdp-weekdays { display: table-header-group !important; }
.rdp-week { display: table-row !important; }
.rdp-weekday, .rdp-day { display: table-cell !important; ... }
```

## 疑問点

### 1. react-day-pickerのデフォルトスタイルが読み込まれているか？
react-day-pickerのデフォルトCSSが別の場所で読み込まれており、それが我々のカスタムスタイルを上書きしている可能性があります。

確認済み：
- `node_modules/react-day-picker/src/style.css` が存在
- しかし、どこで読み込まれているかは不明

### 2. 実際のDOM構造はTableなのか？
推測ではTableベースと考えていますが、実際のDOM構造を確認していません。

react-day-pickerのソースを確認：
```bash
grep -r "month_grid" node_modules/react-day-picker/dist/esm
# 結果: UI["MonthGrid"] = "month_grid"
```

### 3. shadcn/uiのgetDefaultClassNames()は何を返すのか？
`getDefaultClassNames()`がreact-day-pickerのデフォルトクラスを返していますが、その内容がレイアウトを破壊している可能性があります。

### 4. CSS優先順位の問題？
`!important`を使用しているにも関わらず効いていないということは：
- より高い優先度のCSSが存在する
- CSSが読み込まれていない
- 別の要素にスタイルが適用されている

## 必要な情報（GPTへの質問）

### 質問1: react-day-picker v9.11.1の実際のDOM構造
実際にどのようなHTML構造でレンダリングされるのか？
- `<table>`ベースなのか？
- `<div>`ベースなのか？
- グリッドレイアウトなのか？

### 質問2: shadcn/uiのカレンダーコンポーネントのベストプラクティス
shadcn/uiでreact-day-picker v9.11.1を使用する場合の正しいスタイリング方法は？

### 質問3: 代替アプローチ
以下のアプローチは有効か？
1. react-day-pickerのデフォルトスタイルを完全に無効化
2. 別のカレンダーライブラリに変更（例：react-calendar, @fullcalendar/react）
3. 完全に独自のカレンダーコンポーネントを実装

### 質問4: デバッグ方法
ブラウザのDevToolsで確認すべき具体的な項目は？
- どのセレクタを確認すべきか？
- どのCSSプロパティをチェックすべきか？
- Computedスタイルで確認すべき値は？

## 期待される解決策

### オプション A: CSS修正
正しいセレクタと優先度でCSSを適用する方法

### オプション B: コンポーネント修正
react-day-pickerの設定やpropsを変更して、正しいレイアウトを強制する方法

### オプション C: ライブラリ変更
react-day-pickerを諦めて、別のカレンダーライブラリに変更する

### オプション D: 独自実装
シンプルな独自カレンダーコンポーネントを実装する

## コンテキスト
このカレンダーは、勤怠管理システムの一部として使用されています。ユーザーが日付を選択して、その日の勤怠記録を確認・編集できるようにする必要があります。

必須機能：
- 7列のカレンダーグリッド表示（日曜〜土曜）
- 今日の日付のハイライト
- 日付選択時のイベント処理
- レスポンシブデザイン

---

**GPTへの具体的な質問**:
「react-day-picker v9.11.1とshadcn/uiを使用したNext.js 14プロジェクトで、カレンダーが縦一列に表示される問題を解決するには、どのような方法がありますか？上記の試行錯誤を踏まえて、最も効果的なアプローチを教えてください。」
