# シードデータ整理計画

## 概要

現在、`ユーザー管理`には正しい29人のダンドリワーク社員データが入っているが、
他の機能（勤怠管理、組織管理、ワークフロー等）では古いシードデータ（田中太郎、佐藤花子など）が表示されている。

この計画では、これらの不整合を安全に解消する。

---

## 問題の分類

### カテゴリ1: デモモード用のハードコードされたデータ（APIルート）

`NEXT_PUBLIC_DEMO_MODE === 'true'` の場合に返されるデモデータ。

| ファイル                                         | 内容                                         |
| ------------------------------------------------ | -------------------------------------------- |
| `src/app/api/health/stress-checks/route.ts`      | demoStressChecks（田中太郎、山田花子等 8名） |
| `src/app/api/health/stress-checks/[id]/route.ts` | 同上（一部）                                 |
| `src/app/api/health/checkups/route.ts`           | demoHealthCheckups（田中太郎等 8名）         |
| `src/app/api/health/checkups/[id]/route.ts`      | 同上（一部）                                 |
| `src/app/api/health/schedules/route.ts`          | demoSchedules（田中太郎等）                  |
| `src/app/api/health/schedules/[id]/route.ts`     | 同上                                         |
| `src/app/api/assets/pc-assets/route.ts`          | demoPCAssets（田中太郎）                     |
| `src/app/api/assets/vehicles/route.ts`           | demoVehicles（田中太郎）                     |
| `src/app/api/saas/assignments/route.ts`          | demoAssignments（田中太郎、山田花子）        |
| `src/app/api/saas/services/route.ts`             | デモSaaSサービス                             |

### カテゴリ2: フロントエンドのハードコードされたデモデータ

| ファイル                                                           | 内容                   |
| ------------------------------------------------------------------ | ---------------------- |
| `src/app/[locale]/(portal)/dashboard/components/activity-feed.tsx` | アクティビティフィード |
| `src/app/[locale]/(portal)/workflow/page.tsx`                      | ワークフローページ     |
| `src/app/[locale]/(portal)/leave/page.tsx`                         | 休暇ページ             |
| `src/features/attendance/shift-management.tsx`                     | シフト管理             |
| `src/features/attendance/team-attendance.tsx`                      | チーム勤怠             |
| `src/features/dashboard/dashboard-content.tsx`                     | ダッシュボード         |
| `src/features/workflow/delegate-settings-dialog.tsx`               | 委任設定               |
| `src/features/leave/leave-request-dialog.tsx`                      | 休暇申請               |

### カテゴリ3: ライブラリ/ストア内のモックデータ

| ファイル                                  | 内容                         |
| ----------------------------------------- | ---------------------------- |
| `src/lib/mock-data/user-mock-data.ts`     | ユーザーモックデータ（15名） |
| `src/lib/demo-users.ts`                   | デモユーザー定義             |
| `src/lib/workflow-demo-data.ts`           | ワークフローデモデータ       |
| `src/lib/realistic-mock-data.ts`          | リアルモックデータ           |
| `src/lib/demo-onboarding-applications.ts` | 入社手続きデモ               |
| `src/lib/approval-system.ts`              | 承認システムデモ             |
| `src/lib/attendance-store.ts`             | 勤怠ストア                   |
| `src/lib/payroll/salary-master-data.ts`   | 給与マスターデータ           |

### カテゴリ4: テストファイル（変更不要の可能性あり）

| ファイル                                             |
| ---------------------------------------------------- |
| `src/features/workflow/approval-card.test.tsx`       |
| `src/features/workflow/approval-dialog.test.tsx`     |
| `src/lib/csv/csv-export.test.ts`                     |
| `src/lib/store/payroll-store.test.ts`                |
| `src/lib/store/organization-store.test.ts`           |
| `src/lib/store/performance-evaluation-store.test.ts` |
| `src/lib/store/audit-store.test.ts`                  |
| `src/lib/store/tenant-store.test.ts`                 |

### カテゴリ5: tenant-1 ハードコード（フォールバック）

多数のファイルで `tenant-1` がデモモード時のフォールバックとして使用されている。
これは現状維持でも良いが、デモモードが本番では無効なら問題ない。

---

## 対応方針の選択肢

### 選択肢A: デモデータをダンドリワーク社員に置き換える

**メリット**:

- デモモードでもリアルなデータが表示される
- 一貫性が保たれる

**デメリット**:

- 29人分のデータを全ファイルに反映する作業量が多い
- デモデータと本番データの境界が曖昧になる

### 選択肢B: デモモードを廃止してDBデータのみを使用

**メリット**:

- シンプルで保守性が高い
- ハードコードされたデータがなくなる

**デメリット**:

- デモモードが使えなくなる
- ローカル開発時にDBが必要

### 選択肢C: デモデータを最小限に整理（推奨）

**メリット**:

- 本番環境では問題なし（デモモード無効）
- 変更範囲を最小限に抑えられる
- 段階的に対応可能

**デメリット**:

- デモモードでは古いデータが残る

---

## 推奨アプローチ（選択肢C + 段階対応）

### Phase 1: 影響調査（完了）

ハードコードされたデータの全容を把握。

### Phase 2: 本番環境の確認

```bash
# 本番でデモモードが無効であることを確認
echo $NEXT_PUBLIC_DEMO_MODE
# → 'true' でなければ問題なし
```

### Phase 3: 優先度の高いファイルを修正

本番環境に影響する箇所のみ修正:

1. **API routes** - デモモード判定後のデータを実データに置き換え
2. **フロントエンド** - currentUser のフォールバックを修正

### Phase 4: モックデータの統一（オプション）

`src/lib/mock-data/` 配下のファイルを統一:

- `user-mock-data.ts` をダンドリワーク社員データに更新
- 他のモックデータも連動して更新

---

## 安全な実装手順

### 事前準備

```bash
# 1. 現在の状態をコミット
git status
git add .
git commit -m "feat: checkpoint before seed data cleanup"

# 2. 新しいブランチを作成
git checkout -b fix/seed-data-cleanup
```

### 修正手順

#### Step 1: ユーザーモックデータの更新

`src/lib/mock-data/user-mock-data.ts` を更新:

```typescript
// ダンドリワーク社員データ（tenant-006）を反映
export const mockUsers = [
  {
    id: "DW-001",
    tenantId: "tenant-006",
    name: "渡邉翔太", // 実際のダンドリワーク社員名
    email: "watanabe@dandori-work.com",
    // ...
  },
  // ...29名分
];
```

#### Step 2: デモユーザー定義の更新

`src/lib/demo-users.ts` を更新して `tenant-006` のユーザーを参照。

#### Step 3: APIデモデータの更新

`src/app/api/health/*/route.ts` 等のデモデータを更新。

#### Step 4: フロントエンドのフォールバック修正

`田中太郎` → `現在のユーザー名` のフォールバックを修正。

### テスト

```bash
# ビルド確認
npm run build

# 型チェック
npx tsc --noEmit

# リント
npm run lint
```

---

## 注意事項

1. **テストファイルは慎重に**
   - テストデータは機能的には問題ない
   - 統一したい場合は別タスクとして実施

2. **tenant-1 のフォールバック**
   - 本番では `getTenantIdFromRequest` で正しいテナントIDを取得
   - フォールバックはデモモード時のみ使用

3. **段階的にコミット**
   - 1ファイルずつ修正してコミット
   - 問題があればすぐに切り戻せる

4. **データベースは変更しない**
   - DBのシードデータ（tenant-1用）はそのまま
   - 本番の tenant-006 データも変更しない

---

## 質問事項

実装を進める前に確認したいこと:

1. **本番環境の `NEXT_PUBLIC_DEMO_MODE` の値は？**
   - `true` → デモデータの修正が必要
   - `false` または未設定 → 修正は低優先度

2. **ダンドリワーク社員29名のリストは取得可能か？**
   - 名前、部署、役職、メールアドレス等

3. **デモモード自体は今後も必要か？**
   - 不要なら、デモモード関連のコードを削除する選択肢もあり

---

## 次のアクション

上記の質問への回答を踏まえて:

1. 本番でデモモード無効 → 現状維持でOK、必要に応じて段階修正
2. デモモード有効 → Phase 3-4を実施
3. デモモード廃止 → 選択肢Bを実施
