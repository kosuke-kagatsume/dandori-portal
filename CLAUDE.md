# Dandori Portal - 開発ドキュメント

## 🎯 最終更新: 2025-12-07

---

## 🚀 本番環境

| 項目             | 値                             |
| ---------------- | ------------------------------ |
| **本番URL**      | https://dandori-portal.com     |
| **開発URL**      | https://dev.dandori-portal.com |
| **インフラ**     | AWS Amplify                    |
| **データベース** | AWS RDS PostgreSQL             |
| **認証**         | AWS Cognito                    |

### デプロイ方法

```bash
# 開発環境にデプロイ
git push origin develop

# 本番環境にデプロイ
git push origin main
```

---

## 📊 実装済み機能（39ページ）

### HR領域

- ダッシュボード、ユーザー管理、メンバー管理
- 勤怠管理、休暇管理、給与管理、人事評価
- 組織管理、ワークフロー、設定、プロフィール、監査ログ

### 健康管理 ✅ 完了

- 健康診断管理（受診記録・判定結果・フォローアップ）
- ストレスチェック（質問票・判定・高ストレス者管理）
- レポート機能

### 資産管理

- PC・車両管理、SaaS管理（ライセンス・部門別・ユーザー別）

### 入社手続き

- 新入社員向けフォーム（基本情報・家族・口座・通勤経路）
- HR向け管理・承認画面

### DW管理機能（Super Admin）

- テナント管理、請求書管理、通知管理

---

## ⚠️ Git操作ルール（必須）

**コミット・プッシュは必ずユーザーの許可を得てから実行すること**

1. コードの変更が完了したら、変更内容を説明する
2. 「コミット・プッシュしてよいですか？」と確認を取る
3. ユーザーの明示的な許可があるまで実行しない

---

## 🔧 開発環境

### 通常起動

```bash
cd /Users/dw100/dandori-portal
PORT=3001 npm run dev
```

### ビルド確認

```bash
npm run build
```

---

## 🏗️ 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript (strict mode)
- **状態管理**: Zustand
- **UI**: Tailwind CSS + shadcn/ui
- **ORM**: Prisma
- **テスト**: Jest + Playwright

---

## 📁 プロジェクト構成

```
src/
├── app/
│   ├── [locale]/(portal)/   # HR領域ページ
│   ├── [locale]/(auth)/     # 認証ページ
│   └── dw-admin/            # DW管理ページ
├── components/              # UIコンポーネント
├── features/                # 機能別コンポーネント
├── lib/
│   ├── store/              # Zustandストア（30+）
│   ├── api/                # APIクライアント
│   └── prisma/             # Prisma設定
└── middleware.ts           # マルチテナント処理
```

---

## 🔐 マルチテナント機能

- サブドメインベースのテナント識別
- MiddlewareでのDB動的検索
- メモリキャッシュ（TTL 5分）
- テナント解決API: `/api/tenant/resolve`

---

## 📝 コードスタイル

- ESLint + Prettier
- 日本語コメント推奨
- コンポーネントは機能別にfeatures/に配置
- ストアはlib/store/に配置

---

## 🛡️ TypeScript型安全性ルール（重要）

**2025-01-23追加**: 過去に133件の型エラーが蓄積した反省から、以下のルールを厳格化

### 禁止事項（ESLintでエラー）

| ルール        | 内容                           | 理由                                   |
| ------------- | ------------------------------ | -------------------------------------- |
| `@ts-nocheck` | ファイル全体の型チェック無効化 | 型エラーを隠蔽し技術的負債の温床になる |
| `@ts-ignore`  | 行単位の型チェック無効化       | 同上                                   |
| `as any`      | any型へのキャスト              | 型安全性を破壊する                     |
| 未使用変数    | 使われていない変数・引数       | コードの可読性低下                     |

### やむを得ない場合の対処法

```typescript
// ❌ NG: 絶対に使わない
// @ts-nocheck
// @ts-ignore
const x = value as any;

// ✅ OK: 理由を明記して@ts-expect-errorを使用（10文字以上）
// @ts-expect-error - Next.js dynamic の型制限: 戻り値の型が合わない
const LazyComponent = dynamic(() => import("./Component"));

// ✅ OK: unknown経由でキャスト（型が明確な場合のみ）
const data = value as unknown as SpecificType;

// ✅ OK: 型ガード関数を使用
function isPayroll(calc: Payroll | Bonus): calc is Payroll {
  return "workDays" in calc;
}
```

### Pre-commit Hook

コミット時に以下が自動実行される：

1. `eslint --fix` - コード品質チェック
2. `tsc --noEmit` - 型チェック（エラーがあるとコミット不可）

---

## 🚨 既知の警告（対応不要）

### React Hydration Error (#425, #422)

**状態**: 放置OK（対応不要）

**症状**: コンソールに `Minified React error #425` や `#422` が表示される

**原因**: Zustand の persist ミドルウェアが localStorage からデータを読み込む際、SSR時の初期状態とCSR時のhydrate後の状態が異なるため

**影響**:

- 機能への影響: なし
- ユーザー体験: 影響なし（コンソールに警告が出るだけ）

**対応方針**:

- 現時点では修正不要
- 30以上のZustandストアを修正する必要があり、デグレリスクが高い
- React 19で改善予定のため、将来的に自然解消の可能性あり

**修正を検討するタイミング**:

- SEOが重要でSSRを完璧にしたい場合
- コンソールをクリーンに保ちたい場合
- パフォーマンス最適化フェーズ
