# カレンダーレイアウトバグ - 詳細レポート

## 問題の概要
`/ja/attendance`ページのカレンダータブで、日付が7列のグリッド表示ではなく、垂直（縦一列）に表示される問題が発生しています。

## スクリーンショット
ユーザーが提供したスクリーンショットによると：
- カレンダーの日付が縦に並んでいる（1, 2, 3, 4, 5, 6, 7, 8, 9...）
- 曜日ヘッダーが正しく表示されていない（"SUMONTUEd"という変な表示）
- 完全に縦レイアウトになっている

## 環境情報
- **プロジェクト**: DandoriPortal
- **フレームワーク**: Next.js 14.0.4
- **React**: ^18
- **react-day-picker**: v9.11.1
- **開発サーバー**: http://localhost:3001
- **ブラウザ**: Chrome

## 関連ファイル

### 1. カレンダーコンポーネント
**ファイル**: `/Users/dw100/dandori-portal/src/components/ui/calendar.tsx`
- shadcn/uiのカレンダーコンポーネント
- react-day-picker v9.11.1をベースにしたラッパー
- `DayPicker`コンポーネントを使用

### 2. 勤怠カレンダー
**ファイル**: `/Users/dw100/dandori-portal/src/features/attendance/attendance-calendar.tsx`
- 勤怠管理画面のカレンダー表示コンポーネント
- `Calendar`コンポーネントを使用
- `MountGate`でラップしてSSR/CSR差を吸収

### 3. 勤怠管理ページ
**ファイル**: `/Users/dw100/dandori-portal/src/app/[locale]/attendance/page.tsx`
- メインの勤怠管理ページ
- タブの3番目に`LazyAttendanceCalendar`を配置（526-530行目）

### 4. カレンダー修正CSS
**ファイル**: `/Users/dw100/dandori-portal/src/styles/calendar-fix.css`
- カレンダーレイアウトを強制するCSS
- `!important`でreact-day-pickerのクラスを上書き

### 5. グローバルCSS
**ファイル**: `/Users/dw100/dandori-portal/src/app/globals.css`
- `calendar-fix.css`をインポート（3行目）

## 実施した修正（効果なし）

### 修正1: MountGateでラップ
```tsx
// attendance-calendar.tsx (133-148行目)
<MountGate
  fallback={<div className="w-full h-96 flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">
      カレンダーを読み込み中...
    </div>
  </div>}
>
  <Calendar
    mode="single"
    selected={date}
    onSelect={setDate}
    className="w-full rounded-md border"
  />
</MountGate>
```

### 修正2: コンポーネントレベルのクラス追加
```tsx
// calendar.tsx
<DayPicker
  className={cn(
    "bg-background group/calendar p-3 w-full [--cell-size:2rem] ...",
    className
  )}
  classNames={{
    weekdays: cn("flex w-full", defaultClassNames.weekdays),
    week: cn("mt-2 flex w-full items-center", defaultClassNames.week),
    day: cn("group/day relative flex-1 aspect-square ...", defaultClassNames.day),
  }}
/>
```

### 修正3: CSS強制適用
```css
/* calendar-fix.css */
.rdp-weekdays {
  display: flex !important;
  flex-direction: row !important;
  width: 100% !important;
}

.rdp-week {
  display: flex !important;
  flex-direction: row !important;
  width: 100% !important;
  align-items: center !important;
}

.rdp-day {
  flex: 1 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
```

## 問題が解決しない理由（推測）

### 仮説1: クラス名の不一致
react-day-picker v9.11.1が使用する実際のクラス名が`.rdp-weekdays`, `.rdp-week`, `.rdp-day`ではない可能性があります。

**確認方法**:
- ブラウザのDevToolsでカレンダー要素を調査
- 実際に適用されているクラス名を確認

### 仮説2: CSS優先順位の問題
`!important`を使用しているにも関わらず、他のCSSがさらに優先されている可能性があります。

**確認方法**:
- DevToolsのStylesタブで、どのCSSルールが適用されているか確認
- `calendar-fix.css`が正しく読み込まれているか確認

### 仮説3: react-day-pickerのデフォルトスタイル
react-day-picker v9.11.1はデフォルトでインラインスタイルやCSS Modulesを使っている可能性があります。

**確認方法**:
- `node_modules/react-day-picker/dist/`内のCSSファイルを確認
- コンポーネントがインラインスタイルを適用しているか確認

### 仮説4: Tailwind CSSの競合
TailwindのユーティリティクラスがCSSカスタムプロパティと競合している可能性があります。

### 仮説5: 曜日ヘッダーの表示問題
スクリーンショットの"SUMONTUEd"という表示は、曜日が横に並ばず重なっている可能性を示唆しています。

## 必要な追加調査

### 1. DevToolsでの確認
```
ブラウザのDevTools > Elements タブ
1. カレンダー要素を検査
2. 適用されているクラス名を確認（.rdp-*, その他）
3. Computed Stylesで display, flex-direction, width を確認
4. どのCSSファイルが適用されているか確認
```

### 2. react-day-pickerの実際の構造
```bash
# node_modules内でクラス名を確認
grep -r "rdp-week" node_modules/react-day-picker/dist/
grep -r "weekdays" node_modules/react-day-picker/dist/
```

### 3. ネットワークタブ
```
DevTools > Network タブ
1. calendar-fix.css が正しく読み込まれているか
2. CSSファイルの読み込み順序を確認
```

## 推奨される次のステップ

### オプション1: react-day-pickerの公式ドキュメント確認
- https://daypicker.dev/
- v9.11.1の公式スタイリングガイドを確認
- 正しいクラス名やカスタマイズ方法を確認

### オプション2: 別のカレンダーライブラリに変更
- `@fullcalendar/react`
- `react-big-calendar`
- 独自実装のシンプルなカレンダー

### オプション3: react-day-pickerのバージョンダウン
以前のバージョン（v8.x）に戻して、既知の動作で実装する。

### オプション4: 完全にカスタムCSSで上書き
react-day-pickerのデフォルトスタイルを完全に無効化し、ゼロから実装する。

## コード参照

### calendar.tsx の関連部分
```typescript
// Line 28-36
return (
  <DayPicker
    showOutsideDays={showOutsideDays}
    className={cn(
      "bg-background group/calendar p-3 w-full [--cell-size:2rem] ...",
      className
    )}
    captionLayout={captionLayout}
    // ...
```

### attendance-calendar.tsx の関連部分
```typescript
// Line 132-148
<div className="flex-1">
  <MountGate fallback={...}>
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="w-full rounded-md border"
    />
  </MountGate>
</div>
```

## デバッグコマンド

```bash
# react-day-pickerのファイル構造確認
ls -la node_modules/react-day-picker/dist/

# CSSファイル探索
find node_modules/react-day-picker -name "*.css"

# TypeScript定義確認
cat node_modules/react-day-picker/dist/index.d.ts | grep -A 20 "classNames"

# package.jsonの確認
cat node_modules/react-day-picker/package.json | grep version
```

## まとめ

現在、3層のアプローチ（MountGate + コンポーネントクラス + CSS強制）を実施しましたが、効果がありませんでした。

**最も可能性が高い原因**:
1. react-day-picker v9.11.1の実際のクラス名が想定と異なる
2. CSSの優先順位が不十分
3. コンポーネント自体がインラインスタイルで表示を制御している

**推奨される次のアクション**:
1. ブラウザのDevToolsで実際のDOM構造とクラス名を確認
2. react-day-pickerの公式ドキュメントでv9.11.1のスタイリング方法を確認
3. 必要に応じて別のアプローチ（別ライブラリ、バージョンダウン、完全カスタム実装）を検討

---

**作成日時**: 2025-10-12
**作成者**: Claude Code
**バグトラッキング**: CALENDAR-LAYOUT-001
