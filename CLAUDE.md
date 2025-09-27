# Dandori Portal - 開発ドキュメント

## 🎯 最終更新: 2025-09-27

### ✅ Hydrationエラーの完全解決

#### 問題の経緯
Next.js 14.0.4でHydrationエラーが頻発し、前回解決できなかった問題を今回根本的に解決。

#### 根本原因と解決策

##### 1. DOM構造の不一致
**問題**: 条件分岐でDOM構造が変わっていた
```jsx
// ❌ Before - SSR/CSRで異なるDOM
{collapsed ? <ChevronRight/> : <ChevronLeft/>}

// ✅ After - 同一DOM、CSSで制御
<ChevronLeft className={collapsed ? 'rotate-180' : ''} />
```

##### 2. MountGateコンポーネントの実装
SSR/CSRの差を吸収する汎用コンポーネントを作成：
```jsx
// src/components/common/MountGate.tsx
export function MountGate({ children, fallback = null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
```

##### 3. Zustand persistのSSR対応
```javascript
// SSR時はpersistを無効化
if (typeof window === 'undefined') {
  return create<State>()(storeCreator);
}
return create<State>()(persist(storeCreator, {...}));
```

### 🛡️ 再発防止策

#### npm scripts
```json
{
  "scripts": {
    // 矢印文字チェック
    "lint:arrows": "grep -r -n \"›\\|&gt;\\|['\\\"]>['\\\"]\" src && echo 'NG' && exit 1 || echo 'OK'",
    // クリーン起動
    "dev:clean": "pkill -f \"next|node\" || true && rm -rf .next .turbo node_modules/.cache && npm ci && npm dedupe && HOST=127.0.0.1 PORT=3100 npm run dev"
  }
}
```

#### ESLintルール
```json
// .eslintrc.json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      { "selector": "Literal[value='›']", "message": "JSXに生の›は禁止" },
      { "selector": "Literal[value='>']", "message": "JSXに生の>は禁止" }
    ]
  }
}
```

### 📝 重要な設計原則

1. **DOM構造を条件分岐で変えない**
   - アイコンの向きはCSSのtransformで制御
   - 表示/非表示はCSSクラスで制御

2. **SSR/CSRで異なる処理は必ずMountGateでラップ**
   - localStorage/sessionStorageへのアクセス
   - window/documentオブジェクトの使用
   - ブラウザAPI依存の処理

3. **Zustand storeはSSR対応必須**
   - サーバー側ではpersist無効
   - クライアント側でのみlocalStorage使用

### 🚀 開発環境

#### 通常起動
```bash
cd /Users/dw100/dandori-portal
PORT=3001 npm run dev
```

#### トラブル時のクリーン起動
```bash
npm run dev:clean  # ポート3100で起動
```

#### Hydrationエラーチェック
```bash
npm run lint:arrows  # 矢印文字の検出
```

### 🏗️ プロジェクト構成

```
src/
├── app/
│   └── [locale]/
│       ├── layout.tsx        # メインレイアウト
│       ├── dashboard/        # ダッシュボード
│       └── payroll/         # 給与管理（新規追加）
├── components/
│   ├── common/
│   │   └── MountGate.tsx    # SSR/CSR差吸収コンポーネント
│   └── layout/
│       └── app-shell.tsx    # アプリケーションシェル
├── features/
│   └── navigation/
│       └── sidebar.tsx      # サイドバー（修正済み）
└── lib/
    └── store/
        ├── ui-store.ts      # UIストア（SSR対応済み）
        └── user-store.ts    # ユーザーストア（SSR対応済み）
```

### 🔧 トラブルシューティング

#### Hydrationエラーが再発した場合
1. `npm run lint:arrows`で矢印文字チェック
2. ブラウザコンソールでエラー箇所を特定
3. 条件分岐でDOMが変わっていないか確認
4. MountGateでラップすべき箇所がないか確認

#### 開発サーバーが不安定な場合
```bash
# 全プロセス終了＆クリーン起動
npm run dev:clean
```

### 📊 実装済み機能

- ✅ ダッシュボード
- ✅ ユーザー管理
- ✅ メンバー管理
- ✅ 勤怠管理
- ✅ 休暇管理
- ✅ 承認管理
- ✅ ワークフロー
- ✅ **給与管理**（2025-09-27追加）

### 🎉 解決済み問題

- ✅ Hydrationエラー（2025-09-27完全解決）
- ✅ UTF-8エンコーディングエラー
- ✅ 複数プロセス同時起動問題
- ✅ SSR/CSR不一致問題

---

**最重要**: Hydrationエラーは完全に解決済み。再発防止策も実装済み。