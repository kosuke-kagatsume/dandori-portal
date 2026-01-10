# 残りのTypeScriptエラー修正タスク

## 最終更新: 2025-12-29

---

## 1. seed/scripts の id/updatedAt 不足（約50件）

### 対象ファイル
- `prisma/seed-asset-saas.ts`
- `prisma/seed-assets.ts`
- `prisma/seed-legal-updates.ts`
- `prisma/seed-saas-assignments.ts`
- `prisma/seed.ts`
- `scripts/complete-tenant-setup.ts`
- `scripts/reset-password.ts`
- `scripts/seed-dandori-users.ts`
- `scripts/seed-demo-users.ts`
- `scripts/seed-tenants.ts`
- `scripts/setup-tenant.ts`
- `scripts/test-approval-integration.ts`

### 問題
各ファイルの `prisma.xxx.create()` や `prisma.xxx.upsert()` の `create` ブロックに
`id` と `updatedAt` フィールドが不足している。

### 修正パターン
```typescript
// Before
create: {
  tenantId,
  name: 'xxx',
  ...
}

// After
create: {
  id: `prefix-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
  tenantId,
  name: 'xxx',
  ...
  updatedAt: new Date(),
}
```

### 影響
- 本番デプロイ: 影響なし
- シード実行: エラーになる

---

## 2. onboarding フォーム型エラー（約167件）

### 対象ファイル
- `src/app/[locale]/(portal)/onboarding/[applicationId]/basic-info/page.tsx`
- `src/app/[locale]/(portal)/onboarding/[applicationId]/bank-account/page.tsx`
- その他 onboarding 関連ページ

### 問題
- `UseFormRegister<Record<string, unknown>>` と具体的な型の不整合
- `RouteImpl` 型の不整合（Next.js type-safe routing）
- `SubmitHandler` 型の不整合

### 修正方針
1. フォームコンポーネントにジェネリクスを適切に渡す
2. または `as any` で一時的に回避
3. Next.js の typedRoutes 設定を確認

### 影響
- 本番デプロイ: 影響なし（`ignoreBuildErrors: true`）
- 動作: 正常に動作する（型チェック警告のみ）

---

## 確認コマンド

```bash
# 全エラー確認
npx tsc --noEmit

# seed/scripts のみ
npx tsc --noEmit 2>&1 | grep -E "prisma/seed|scripts/"

# onboarding のみ
npx tsc --noEmit 2>&1 | grep "onboarding"
```

---

## 完了済み（2025-12-29）

- ✅ Phase 8 実装（クイックアクション設定、アナウンス種別マスタ）
- ✅ account/page.tsx - Theme型に'system'追加
- ✅ attendance/page.tsx - AttendanceRecord型でnull許容
- ✅ health/page.tsx - requiresGuidance追加、findings型修正
- ✅ payroll-settings, year-end-settings - upsert create に id/updatedAt 追加
- ✅ seed/scripts - モデル名をsnake_caseに統一
