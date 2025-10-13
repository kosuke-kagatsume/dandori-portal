# Dandori Portal Hydration Error - 詳細レポート

## 🚨 問題の概要
Next.js 14.0.4で構築したDandori Portalアプリケーションで、Hydrationエラーが発生し、ログインページが正常に動作しない。

## 📅 発生状況
- **発生日時**: 2025年10月13日（本日）朝
- **前回正常動作**: 昨日（2025年10月12日）夜の開発終了時
- **環境**: ローカル開発環境（localhost:3000）
- **本番環境**: 未確認（認証が必要なため）

## ❌ エラー内容

### コンソールエラー（4件）
```
Uncaught Error: Hydration failed because the initial UI does not match what was rendered on the server.

Warning: Expected server HTML to contain a matching text node for ">" in <div>.

See more info here: https://nextjs.org/docs/messages/react-hydration-error
```

### エラーの特徴
1. **特定の文字**: エラーメッセージに「>」（大なり記号）が関係していると表示
2. **Suspense境界の外**: エラーがSuspense境界の外で発生し、全体がクライアントレンダリングに切り替わる
3. **4 errors**: 左下に「4 errors」と赤く表示

## 🔍 調査内容

### 1. 試した対策（すべて失敗）
- ✅ 矢印文字チェック (`npm run lint:arrows`) → 問題なし
- ✅ 特殊文字 `⌘K` を削除 → 効果なし
- ✅ `suppressHydrationWarning` を body に追加 → 効果なし
- ✅ `<Toaster />` をルートレイアウトに追加 → 効果なし
- ✅ クリーンビルド (`.next`, `.turbo`, `node_modules/.cache` 削除) → 効果なし

### 2. 変更ファイル（未コミット）
```
 CLAUDE.md                                          |  44 +++-
 package-lock.json                                  |   8 +-
 package.json                                       |   2 +-
 src/app/[locale]/users/[id]/page.tsx               |  34 ++-
 src/app/globals.css                                |  77 +++++++
 src/app/layout.tsx                                 |   4 +-
 src/components/ui/calendar.tsx                     | 242 ++++++++++++++++-----
 src/features/attendance/attendance-calendar.tsx    | 170 ++++++++++++++-
 src/features/navigation/header.tsx                 |   2 +-
 src/lib/mock-data.ts                               | 210 +++++++++++++++++-
 src/lib/store/payroll-store.ts                     |  17 ++
 src/styles/calendar-fix.css                        |  59 ++++-
```

**注目点**: カレンダー関連のファイルが大量に変更されている

### 3. 最新コミット
```
54fec33 2025-10-12 feat: ユーザー詳細タブと車両費用集計の完全実装
ca4c496 2025-10-12 feat: 権限別ダッシュボードグラフを実装
5c45c83 2025-10-12 docs: DandoriPortal機能一覧完全版を追加
```

## 🏗️ プロジェクト構成

### 技術スタック
- **フレームワーク**: Next.js 14.0.4 (App Router)
- **言語**: TypeScript 5
- **UI**: Radix UI, shadcn/ui, Tailwind CSS
- **状態管理**: Zustand 4.4.7
- **フォーム**: React Hook Form + Zod
- **日付**: react-day-picker 9.11.1, date-fns 4.1.0

### レイアウト構造
```
src/app/layout.tsx (Root Layout)
  └── src/app/[locale]/layout.tsx (Locale Layout with AppShell)
      └── src/components/layout/app-shell.tsx ('use client')
          ├── Sidebar
          ├── Header
          └── {children}
```

### 問題のログインページ
- **パス**: `/src/app/auth/login/page.tsx`
- **ディレクティブ**: `'use client'`（クライアントコンポーネント）
- **使用コンポーネント**: `<Tabs>`, `<Input>`, `<Button>`, `<Card>`

## 🤔 不明点・疑問

### 1. なぜ昨日は動いていたのか？
- 最新コミット（54fec33）でも `⌘K` 文字が含まれていた
- layout.tsxにも `suppressHydrationWarning` が body になかった
- **→ つまり、同じコード状態で昨日は動いていたはず**

### 2. エラーの具体的な発生箇所
- エラーメッセージは「>」に関するものだが、検索しても該当箇所が見つからない
- `grep -r ">" src` では大量にヒットするが、どれが原因か特定できない

### 3. SSR/CSRの不一致
- どのコンポーネントでサーバー側とクライアント側のレンダリング結果が異なっているのか？
- MountGateコンポーネントは使用しているが、すべてのクライアントコンポーネントで使えているわけではない

## 📝 過去の解決事例（CLAUDE.mdより）

### 過去に解決したHydrationエラー
1. **DOM構造の条件分岐** → CSSで制御に変更
2. **矢印文字（›, &gt;）** → 削除
3. **Zustand persist** → SSR対応
4. **MountGate導入** → SSR/CSR差分吸収

### 過去の解決策スニペット
```jsx
// ❌ Before - SSR/CSRで異なるDOM
{collapsed ? <ChevronRight/> : <ChevronLeft/>}

// ✅ After - 同一DOM、CSSで制御
<ChevronLeft className={collapsed ? 'rotate-180' : ''} />
```

## 💡 GPTへの質問

1. **なぜ同じコードで昨日は動いて今日は動かないのか？**
   - キャッシュの問題？
   - 環境変数の問題？
   - ブラウザの問題？

2. **「>」エラーの真の発生箇所を特定する方法は？**
   - React DevToolsでどう調査すべきか？
   - Next.jsのデバッグモードで何が見えるか？

3. **根本的な解決策は？**
   - 全ページを `'use client'` にすべきか？
   - SSRを無効にすべきか？
   - react-day-pickerが原因の可能性は？

4. **緊急回避策は？**
   - 最後のコミットに戻すべきか？
   - 特定のコンポーネントを無効化すべきか？

## 📂 関連ファイル

### 主要ファイル
- `/src/app/layout.tsx` - ルートレイアウト
- `/src/app/[locale]/layout.tsx` - ロケールレイアウト
- `/src/app/auth/login/page.tsx` - ログインページ
- `/src/components/layout/app-shell.tsx` - アプリシェル
- `/src/features/navigation/header.tsx` - ヘッダー
- `/src/features/navigation/sidebar.tsx` - サイドバー

### カレンダー関連（大量変更あり）
- `/src/components/ui/calendar.tsx`
- `/src/features/attendance/attendance-calendar.tsx`
- `/src/styles/calendar-fix.css`
- `/src/app/globals.css`

## 🎯 求める解決策

1. **エラーの根本原因の特定**
2. **確実に動作する修正方法**
3. **再発防止策**
4. **デバッグ手順の確立**

---

**生成日時**: 2025-10-13 09:00
**プロジェクト**: Dandori Portal
**環境**: Next.js 14.0.4, React 18, TypeScript 5
