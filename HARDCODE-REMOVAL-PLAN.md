# ハードコード/デモデータ撤廃計画（Phase 2）

## 概要

Phase 1で完了した6機能に加え、残っているハードコード/デモデータを全て撤廃する。

---

## 完了状況

| #   | ファイル                                                  | 問題                                            | API状態    | ステータス               |
| --- | --------------------------------------------------------- | ----------------------------------------------- | ---------- | ------------------------ |
| 1   | `features/attendance/team-attendance.tsx`                 | `DEMO_TEAM_MEMBERS`, `generateDemoAttendance()` | ✅存在     | ✅ 完了                  |
| 2   | `components/organization/permission-management-panel.tsx` | `permissionDefinitions`, `roleDefinitions`      | ✅存在     | ✅ 完了                  |
| 3   | `lib/store/approval-flow-store.ts`                        | `generateDemoFlows()`                           | ✅存在     | ✅ 完了                  |
| 4   | `lib/store/onboarding-store.ts`                           | `DEMO_MODE`チェック                             | ✅存在     | ✅ 完了                  |
| 5   | `components/dashboard/role-based-charts.tsx`              | mock-data/dashboard-charts-data                 | ⚠️拡張必要 | ⏳ 保留（API拡張が必要） |

---

## ✅ Phase 2-1: チーム勤怠コンポーネント（完了）

### 実装内容

1. `DEMO_TEAM_MEMBERS` を削除 ✅
2. `generateDemoAttendance()` を削除 ✅
3. `/api/users` と `/api/attendance` からデータ取得 ✅
4. ローディング状態を追加 ✅

### 変更ファイル

| ファイル                                      | 変更内容      |
| --------------------------------------------- | ------------- |
| `src/features/attendance/team-attendance.tsx` | API連携に変更 |

---

## ✅ Phase 2-2: 権限管理パネル（完了）

### 実装内容

1. `demo-organization`からのインポートを削除 ✅
2. `/api/permissions/master` と `/api/permissions/roles` から権限とロールを取得 ✅
3. ローディング状態を追加 ✅

### 変更ファイル

| ファイル                                                      | 変更内容      |
| ------------------------------------------------------------- | ------------- |
| `src/components/organization/permission-management-panel.tsx` | API連携に変更 |

---

## ✅ Phase 2-3: 承認フローストア（完了）

### 実装内容

1. `generateDemoFlows()` を完全削除 ✅
2. `initializeDemoData()` を `initialize()` にリネーム ✅
3. フォールバックなしでAPIのみを使用 ✅

### 変更ファイル

| ファイル                                         | 変更内容                      |
| ------------------------------------------------ | ----------------------------- |
| `src/lib/store/approval-flow-store.ts`           | デモデータ削除、API連携のみに |
| `src/features/settings/tabs/ApprovalFlowTab.tsx` | `initialize()` に変更         |
| `src/features/settings/tabs/WorkflowTab.tsx`     | `initialize()` に変更         |

---

## ✅ Phase 2-4: オンボーディングストア（完了）

### 実装内容

1. `isDemoMode()` 関数を削除 ✅
2. 全てのDEMO_MODE分岐を削除 ✅
3. 常にAPIを呼び出すように変更 ✅

### 変更ファイル

| ファイル                            | 変更内容              |
| ----------------------------------- | --------------------- |
| `src/lib/store/onboarding-store.ts` | DEMO_MODEチェック削除 |

---

## ⏳ Phase 2-5: ダッシュボードチャート（保留）

### 現状

```typescript
// role-based-charts.tsx:35-44
import {
  generatePersonalAttendanceTrend,
  generatePersonalLeaveHistory,
  generateTeamAttendanceTrend,
  ...
} from '@/lib/mock-data/dashboard-charts-data';
```

### 必要な作業

この変更には以下のいずれかが必要：

**A. 新規API作成（推奨）**

- `GET /api/dashboard/charts/personal-attendance` - 個人勤怠トレンド
- `GET /api/dashboard/charts/personal-leave` - 個人休暇履歴
- `GET /api/dashboard/charts/team-attendance` - チーム勤怠
- `GET /api/dashboard/charts/approval-tasks` - 承認タスク
- `GET /api/dashboard/charts/company-attendance` - 全社勤怠
- `GET /api/dashboard/charts/department-leave` - 部署別休暇
- `GET /api/dashboard/charts/department-salary` - 部署別給与

**B. 既存APIを組み合わせ**

- `/api/attendance` + `/api/leave/requests` からクライアント側で集計
- 各ロール向けに異なるデータをフェッチして変換

### 作業見積もり

- API作成: 各チャートに1-2時間
- コンポーネント更新: 2-3時間
- 合計: 約1-2日の作業

### 変更ファイル

| ファイル                                         | 変更内容      |
| ------------------------------------------------ | ------------- |
| `src/app/api/dashboard/charts/[type]/route.ts`   | 新規作成      |
| `src/components/dashboard/role-based-charts.tsx` | API連携に変更 |
| `src/lib/mock-data/dashboard-charts-data.ts`     | 削除候補      |

---

## 削除対象ファイル

完了後、以下のファイルは不要になる可能性:

- `src/lib/demo-organization.ts` - ⚠️ 他箇所で使用確認後に削除
- `src/lib/unified-organization-data.ts` - ⚠️ 他箇所で使用確認後に削除
- `src/lib/mock-data.ts` - ⚠️ 他箇所で使用確認後に削除
- `src/lib/mock-data/dashboard-charts-data.ts` - Phase 2-5完了後に削除
- `src/lib/workflow-demo-data.ts` - ⚠️ 他箇所で使用確認後に削除

---

## 検証方法

各Phaseの完了時:

```bash
npm run build
npm run lint
```

機能検証:

1. 各画面でデータが表示されることを確認
2. ローディング/エラー状態が適切に表示されることを確認
3. CRUD操作が正常に動作することを確認
