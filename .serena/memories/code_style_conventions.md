# Dandori Portal コーディング規約

## TypeScript設定
- **strict**: true (厳格な型チェック有効)
- **モジュール解決**: bundler
- **パスエイリアス**: `@/` -> `./src/`

## コード規約
### ファイル命名
- コンポーネント: `PascalCase.tsx` (例: `DashboardPage.tsx`)
- ユーティリティ: `kebab-case.ts` (例: `workflow-store.ts`)
- 型定義: `index.ts` または `types.ts`

### コンポーネント規約
- 関数コンポーネントを使用
- 'use client' ディレクティブを必要に応じて使用
- Propsインターフェースを明示的に定義

```typescript
'use client';

interface Props {
  params: { locale: string };
}

export default function ComponentName({ params }: Props) {
  // 実装
}
```

### インポート順序
1. React/Next.js関連
2. 外部ライブラリ
3. UIコンポーネント (@/components/ui)
4. 機能コンポーネント (@/features)
5. ユーティリティ (@/lib)
6. 型定義 (@/types)

### スタイリング
- Tailwind CSSクラスを使用
- shadcn/uiコンポーネントをベースに拡張
- カスタムスタイルは最小限に
- ダークモード対応 (dark: プレフィックス)

### 状態管理
- Zustandストアを使用
- ストアファイルは `/lib/store/` に配置
- 命名規則: `use〇〇Store` (例: `useWorkflowStore`)

### 国際化
- next-intlを使用（現在一部無効化中）
- メッセージファイル: `/messages/[locale].json`
- 動的ルート: `[locale]/` パラメータ使用

### フォームバリデーション
- React Hook Form + Zodスキーマ
- エラーメッセージは日本語対応

### Linting
- ESLint設定: Next.js Core Web Vitals
- Prettier設定あり（自動フォーマット）

## ベストプラクティス
1. 型安全性を重視（any使用禁止）
2. コンポーネントは小さく保つ
3. カスタムフックで複雑なロジックを分離
4. Mockデータは `/mocks/` に集約
5. エラーハンドリングを適切に実装
6. パフォーマンス最適化（メモ化、遅延読み込み）