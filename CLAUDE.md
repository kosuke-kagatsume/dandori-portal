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

- ✅ ダッシュボード（統計表示、グラフ表示）
- ✅ ユーザー管理（CRUD、権限管理）
- ✅ メンバー管理（プロフィール、ステータス管理）
- ✅ 勤怠管理（打刻、履歴保存、月次統計）
- ✅ 休暇管理（申請、承認、残数管理）
- ✅ 承認管理（多段階承認、代理承認）
- ✅ ワークフロー（申請フロー、エスカレーション）
- ✅ **給与管理**（税計算、社会保険、年末調整、PDF出力準備）
- ✅ **賞与管理**（従業員別明細、査定評価、複数種別対応）
- ✅ **組織管理**（組織図、部門管理、権限設定）
- ✅ **設定画面**（テーマ切替、言語設定、通知設定）

### 🗄️ データ永続化

全機能でLocalStorage経由のデータ永続化実装済み：
- `attendance-history-store` - 勤怠履歴データ
- `leave-management-store` - 休暇申請・残数データ
- `workflow-store` - ワークフロー申請データ
- `organization-store` - 組織構造データ
- `user-store` - ユーザー情報
- `ui-store` - UI設定（テーマ、言語等）

### 🎉 解決済み問題

- ✅ Hydrationエラー（2025-09-27完全解決）
- ✅ UTF-8エンコーディングエラー
- ✅ 複数プロセス同時起動問題
- ✅ SSR/CSR不一致問題

### 🚨 認証関連の白画面問題の解決（2025-09-27）

#### 問題の概要
デモモード認証で白画面が表示され、ユーザーがアプリケーションにアクセスできない問題が発生。

#### 根本原因
1. **データソース不整合**: AppShellでlocalStorage `demo_user`を参照、API/ミドルウェアではCookie `demo_session`を使用
2. **Supabaseクライアント不備**: `onAuthStateChange`の戻り値に`unsubscribe`メソッドが欠けていた
3. **認証フック問題**: useAuthでも同様のデータソース不整合とunsubscribe問題

#### 実装した解決策

##### 1. Supabaseクライアントの修正 (`src/lib/supabase/client.ts`)
```typescript
onAuthStateChange: () => ({
  data: {
    subscription: {
      unsubscribe: () => {
        console.log('Demo mode: unsubscribe called');
      }
    }
  }
}),
```

##### 2. AppShellの修正 (`src/components/layout/app-shell.tsx`)
```typescript
// demo_session Cookieからユーザー情報を取得
const getDemoUserFromCookie = () => {
  try {
    const value = document.cookie
      .split('; ')
      .find(row => row.startsWith('demo_session='));

    if (value) {
      const cookieValue = value.split('=')[1];
      return JSON.parse(decodeURIComponent(cookieValue));
    }
    return null;
  } catch (error) {
    console.error('Failed to parse demo session cookie:', error);
    return null;
  }
};
```

##### 3. useAuthフックの修正 (`src/hooks/use-auth.ts`)
- localStorage `demo_user` → Cookie `demo_session`への変更
- 安全なunsubscribe処理の実装

#### 結果
- ✅ 白画面問題完全解決
- ✅ ダッシュボード正常表示
- ✅ デモユーザー認証正常動作
- ⚠️ Supabase警告が残るが機能には影響なし

---

### 🎁 賞与管理機能詳細（2025-09-27完成）

#### 実装済み機能
- **15名全員の詳細賞与明細表示** - 従業員別の詳細な賞与計算結果
- **賞与計算エンジン** - 基本賞与・査定賞与・控除額の完全計算
- **査定評価システム** - S/A/B/C/D評価とバッジ表示
- **賞与種別選択** - 夏季/冬季/特別賞与の複数種別対応
- **期間選択機能** - 支給期間の柔軟な選択
- **詳細モーダル連携** - PayrollDetailModalで賞与詳細表示
- **Hydrationエラー解決** - MountGateでSSR/CSR不一致完全対応

#### 技術仕様
```typescript
// 賞与データ構造
interface BonusCalculation {
  id: string;
  employeeId: string;
  bonusType: 'summer' | 'winter' | 'special';
  basicBonus: number;      // 基本賞与（基本給×月数）
  performanceBonus: number; // 査定賞与（S=50%, A=30%, B=15%, C=5%, D=0%）
  totalDeductions: number; // 控除額（社会保険・所得税）
  netBonus: number;        // 差引支給額
  performanceRating: 'S' | 'A' | 'B' | 'C' | 'D';
  // ...その他
}
```

#### 賞与計算ロジック
- **夏季賞与**: 基本給×2.5ヶ月 + 査定賞与
- **冬季賞与**: 基本給×3.0ヶ月 + 査定賞与
- **特別賞与**: 基本給×1.0ヶ月 + 査定賞与
- **控除計算**: 健康保険・厚生年金・雇用保険・所得税（賞与用税率10.21%）

#### 解決した課題
- ❌ **Before**: 「賞与は総額だけしか見れないではだめよね？」
- ✅ **After**: 従業員15名全員の詳細賞与明細完全対応

---

**最重要**: Hydrationエラーと白画面認証問題は完全に解決済み。再発防止策も実装済み。