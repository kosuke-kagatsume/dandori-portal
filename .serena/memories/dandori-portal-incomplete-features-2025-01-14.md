# Dandori Portal - 未完成機能の完全リスト（2025-01-14調査）

## プロジェクトスコープ
**Dandori Portal = 最強のHR（人事）領域システム**

### 不要ページの削除完了
- customers（顧客管理）- 削除済み
- work-types（作業種別管理）- 削除済み
- workers（作業員管理）- 削除済み
- sites（現場管理）- 削除済み
→ 合計2,400行以上の不要コード削除完了

## 必要な機能（HR領域）- 14ページ
1. dashboard - ダッシュボード
2. users - ユーザー管理
3. members - メンバー管理
4. attendance - 勤怠管理
5. leave - 休暇管理
6. workflow - ワークフロー
7. approval - 承認管理
8. payroll - 給与管理
9. evaluation - 人事評価
10. organization - 組織管理
11. settings - 設定
12. profile - プロフィール
13. **assets** - 資産管理（人に紐づく：PC、車両）
14. **saas** - SaaS管理（人に紐づく：ライセンス）

## 🚨 重大な未完成項目（優先度: 最高）

### 1. 休暇管理（Leave）ページのストア未統合 ⚠️⚠️⚠️
**状況**:
- ✅ `leave-management-store.ts` は存在（350行、完全実装済み）
- ❌ `/app/[locale]/leave/page.tsx` がストアを使っていない
- ❌ モックデータ関数を使用中（`generateLeaveData`, `generateRealisticLeaveRequests`）

**影響**:
- データが永続化されない
- リロードするとすべての休暇申請データが消える
- LocalStorageに保存されない
- 本番環境で使用不可

**必要な作業**:
- leave/page.tsxを`useLeaveManagementStore`に統合
- モックデータ関数の呼び出しを削除
- ストアのCRUD操作に置き換え

**工数**: 2-3時間

## ⚠️ CSV/PDF出力機能の未実装（優先度: 高）

### 実装状況:

#### ✅ 完全実装済み:
- 勤怠管理: CSV ✅
- 給与管理: CSV ✅（給与・賞与）、PDF ✅（給与明細・賞与明細・源泉徴収票）
- 人事評価: CSV ✅、PDF ✅

#### ❌ 未実装:
1. **休暇管理**: CSV ❌、PDF ❌（重要：休暇申請データの出力必須）
2. ユーザー管理: CSV ❌、PDF ❌（従業員マスタのバックアップ・一括登録用）
3. 資産管理: CSV ❌、PDF ❌（PC・車両リストの出力）
4. SaaS管理: CSV ❌、PDF ❌（ライセンス割り当て状況の出力）
5. 組織管理: CSV ❌、PDF ❌（組織図・部門情報の出力）

## 🔧 その他の未完成・改善項目（優先度: 中）

### 3. ワークフローのユーザーID固定問題
- 場所: `/src/lib/workflow-store.ts:590, 604`
- 問題: `const userId = 'user1'; // TODO: 実際のユーザーIDを取得`
- 影響: 一括承認・一括却下時のユーザーIDが'user1'固定
- 工数: 30分

### 4. カレンダーレイアウト問題
- 場所: 勤怠カレンダー、休暇申請カレンダー
- 問題: 初回表示は正常、リロード後にレイアウト崩れ
- 状況: 12回以上の修正を実施済み、未解決
- 詳細: CLAUDE.md + CALENDAR_BUG_FINAL_REPORT_v3.md に記録済み

### 5. 監査ログ機能
- 状況: 完全未実装（sidebar.tsx:41でコメントアウト）
- 必要性: 中（コンプライアンス要件によって必須になる可能性）
- 工数: 1-2日

## 📈 完成度の全体像

### データ永続化（Zustand + LocalStorage）:
- ✅ 完全実装: 13/14ページ（92.9%）
- ❌ 未実装: 1/14ページ（7.1%）- **休暇管理のみ**

### CSV/PDF出力機能:
- ✅ 完全実装: 3/14ページ（21.4%）
- ❌ 未実装: 5/14ページ（35.7%）

## 🎯 推奨作業順序

### Phase 1: 緊急対応（即座に）
1. **休暇管理ページのストア統合** ⚠️⚠️⚠️ 工数: 2-3時間

### Phase 2: 重要機能の完成（今週中）
2. 休暇管理のCSV/PDF出力機能追加 工数: 2-3時間
3. ワークフローのユーザーID問題修正 工数: 30分

### Phase 3: データ出力機能の充実（今週～来週）
4. ユーザー管理のCSV出力 工数: 1-2時間
5. 資産管理のCSV出力 工数: 1-2時間
6. SaaS管理のCSV出力 工数: 1-2時間

### Phase 4: 追加機能（16日以降）
7. 新入社員オンボーディング機能（人事部・総務からのフィードバック待ち）
8. 監査ログ機能（必要に応じて）
9. カレンダー問題の最終解決（継続調査）

## デプロイ計画
- **最終段階**: AWS へデプロイ（費用発生するため最後に実施）
- **現在**: Vercel で開発・テスト継続

## ストア実装状況（完全実装済み）
1. attendance-history-store.ts
2. leave-management-store.ts ← **ページ統合が必要**
3. workflow-store.ts
4. payroll-store.ts
5. performance-evaluation-store.ts
6. pc-store.ts
7. vehicle-store.ts
8. saas-store.ts
9. user-store.ts
10. organization-store.ts
11. notification-store.ts
12. company-settings-store.ts
13. ui-store.ts
14. approval-store.ts
15. attendance-store.ts
