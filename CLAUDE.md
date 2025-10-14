# Dandori Portal - 開発ドキュメント

## 🎯 最終更新: 2025-10-14

---

## 🚀 重要な開発方針

### AWS デプロイのタイミング

**⚠️ 重要**: AWSへのデプロイは**最後**に実施する

**理由**:
- AWSデプロイ後は費用が継続的に発生する
- ローカル環境で完成度を最大限高めてからリリースすることで、運用コストを最小化

**開発フロー**:
1. ローカル環境で機能実装・テスト
2. 徹底的な品質確認（ビルド・動作確認）
3. 進捗率90%以上を目指す
4. **最後にAWSデプロイ** ← 費用発生開始

この方針により、無駄な費用を最小限に抑え、リリース時には完成度の高いシステムを提供できます。

---

## 📊 実装状況の全体像（2025-10-14調査）

### ✅ 完全実装済みの内容

#### 1. ページ実装: HR領域14ページ（合計10,149行）
- **settings**: 2,151行（11タブ完全実装）
- **workflow**: 1,338行（6種類の申請タイプ）
- **assets**: 1,117行（PC・車両管理）
- **payroll**: 903行（給与・賞与・年末調整）
- **attendance**: 645行（勤怠打刻・カレンダー）
- **leave**: 644行（休暇申請・残数管理）
- **dashboard**: 613行（統計・グラフ）
- **evaluation**: 581行（人事評価）
- **saas**: 546行（SaaS管理）
- **approval**: 499行（承認管理）
- **users**: 481行（ユーザー管理）
- **members**: 414行（メンバー管理）
- **organization**: 422行（組織図）
- **profile**: 395行（プロフィール）

#### 2. Zustandストア: 17ストア（合計6,047行）
- **payroll-store**: 1,024行（給与・賞与・年末調整）
- **vehicle-store**: 801行（車両管理・メンテナンス・業者管理）
- **workflow-store**: 700行（ワークフロー・承認）
- **saas-store**: 433行（SaaS・ライセンス管理）
- **leave-management-store**: 387行（休暇申請・残数）
- **attendance-history-store**: 366行（勤怠履歴）
- **performance-evaluation-store**: 353行（人事評価）
- **pc-store**: 335行（PC資産管理）
- **organization-store**: 331行（組織図）
- **todo-store**: 263行
- **attendance-store**: 262行
- **company-settings-store**: 174行
- **user-store**: 169行（ユーザー・退職処理）
- **approval-store**: 144行
- **ui-store**: 128行（テーマ・言語・通知）
- **notification-store**: 104行
- **tenant-store**: 73行

#### 3. CSV出力: 1ファイル（802行）
10種類のエクスポート関数実装済み：
- exportAttendanceToCSV（勤怠）
- exportPayrollToCSV（給与）
- exportBonusToCSV（賞与）
- exportEvaluationToCSV（人事評価）
- exportLeaveToCSV（休暇）
- exportUsersToCSV（ユーザー）
- exportVehiclesToCSV（車両）
- exportPCAssetsToCSV（PC資産）
- exportSaaSServicesToCSV（SaaSサービス）
- exportLicenseAssignmentsToCSV（ライセンス）

#### 4. PDF出力: 6ファイル（合計1,850行）
- **pdf-common.ts**: 385行（共通機能）
- **pdf-generator.ts**: 355行（汎用PDF生成）
- **pdf-batch.ts**: 316行（一括出力）
- **payroll-pdf.ts**: 285行（給与明細・賞与明細・源泉徴収票）
- **leave-pdf.ts**: 257行（休暇申請）
- **evaluation-pdf.ts**: 252行（人事評価）

### 📈 実装コード量の合計
**合計: 約18,848行のTypeScript/React実装**

### 🎯 現在の進捗
- **全体進捗**: 90% (380/422項目) ← 10/14更新: セキュリティ機能実装で33項目追加
- **実装済み**: HR領域の主要14ページ + 監査ログ管理画面
- **データ永続化**: 18ストア(監査ログ追加)でLocalStorage完全対応
- **データ出力**: CSV/PDF/JSON一括バックアップ完全対応
- **セキュリティ**: データマスキング・監査ログ・バックアップ完全実装

#### 最新の実装・確認（2025-10-14）
- ✅ **差し戻し機能** - 申請者への修正依頼機能
- ✅ **条件分岐ルール** - 金額・日数・時間に応じた自動承認ルート振り分け
  - 5日以上の休暇 → 人事部承認追加
  - 10万円以上の経費 → 経理部承認追加
  - 50万円以上の経費 → 人事部+経理部承認
  - 40時間以上の残業 → 人事部承認追加
  - 60時間以上の残業 → 人事部+経理部承認
  - 30日以上前の勤怠修正 → 人事部承認追加
- ✅ **エスカレーション機能** - 承認期限管理と自動エスカレーション
  - 緊急度別の期限設定（高:24h / 通常:48h / 低:72h）
  - 期限接近・超過の視覚的警告（AlertTriangle アイコン）
  - 上位承認者への自動エスカレーション（manager→hr→admin）
  - エスカレーション履歴の記録とUI表示
- ✅ **賞与明細PDF** - 賞与明細のPDF生成機能（既存実装確認）
  - generateBonusPDF関数完全実装済み
  - UI統合・ダウンロードボタン完備
- ✅ **ユーザー詳細の勤怠タブ** - 個別の勤怠履歴表示（既存実装確認）
  - 統計カード3つ（出勤日数、総労働時間、残業時間）
  - 直近6ヶ月の勤怠履歴テーブル
  - 日付・出退勤時刻・勤務時間・残業・勤務場所・ステータス表示
- ✅ **ユーザー詳細の給与タブ** - 個別の給与履歴表示（既存実装確認）
  - 統計カード3つ（平均月額、年間総額、最新月）
  - 直近12ヶ月の給与明細一覧
  - 期間・支給額・控除額・差引支給額・労働時間・残業時間・ステータス表示

#### セキュリティ機能実装（2025-10-14）
- ✅ **監査ログ管理画面** - システム操作履歴の完全管理
  - 新規ページ `/[locale]/audit` 作成
  - 100件のモックログデータ（10カテゴリ×10アクション）
  - フィルター機能（カテゴリ・操作・重要度・日付範囲・検索）
  - CSV出力機能
  - 統計カード（総ログ数、重大イベント、エラー、警告）
  - カテゴリ別統計表示
  - 30日以前ログの自動削除機能
- ✅ **データマスキング機能** - 機密情報の権限別保護
  - ユーティリティ関数ライブラリ作成
  - マイナンバー・口座番号のマスキング
  - メール・電話番号・住所のマスキング
  - 給与額の権限別マスキング（自分・チーム・全体）
  - IPアドレス・クレジットカード番号のマスキング
- ✅ **一括データバックアップ** - 運用データの完全保護
  - 全12ストアのJSON一括出力
  - リストア機能（バックアップからデータ復元）
  - バックアップサイズ計算機能
  - ファイル形式の自動検証
  - 設定画面の「データ」タブに統合

---

## 📋 プロジェクトスコープの明確化（2025-10-14）

### 🎯 プロジェクトの定義
**Dandori Portal = 最強のHR（人事）領域特化システム**

当初は建設現場管理などを含む広範なスコープで計画されていたが、**HR（人事）領域に特化**する方針に変更。

### ❌ 削除された機能（合計2,400行以上のコード削除）
1. **customers** - 顧客管理
2. **work-types** - 作業種別管理
3. **workers** - 作業員管理
4. **sites** - 現場管理

これらの機能は完全に削除され、HR領域に集中することで開発効率と品質を向上。

### ✅ HR領域の14ページに集中
1. **dashboard** - ダッシュボード
2. **users** - ユーザー管理
3. **members** - メンバー管理
4. **attendance** - 勤怠管理
5. **leave** - 休暇管理
6. **workflow** - ワークフロー
7. **approval** - 承認管理
8. **payroll** - 給与管理
9. **evaluation** - 人事評価
10. **organization** - 組織管理
11. **settings** - 設定
12. **profile** - プロフィール
13. **assets** - 資産管理（人に紐づく：PC、車両）
14. **saas** - SaaS管理（人に紐づく：ライセンス）

### 📊 進捗への影響
- 削除された機能は機能一覧に含まれていなかったため、進捗率に影響なし
- **現在の進捗**: 81% (342/422項目) ← 10/14更新
- **機能一覧**: v2.3に更新済み（2025-10-14）

---

### 🎉 Phase 1: 即効性重視機能の実装完了（2025-10-13）

Phase 1として計画された以下の3つの機能を全て実装完了しました：

#### 1. ✅ 通知機能（Notification System）
- **実装内容**:
  - ワークフロー承認時の通知（申請者への通知）
  - 次の承認者への通知（多段階承認時）
  - 却下時の通知（理由を含む）
  - 一括承認時の自動通知
- **実装ファイル**:
  - `src/lib/workflow-store.ts` - 承認・却下時の通知ロジック
  - `src/lib/store/notification-store.ts` - 通知ストア（既存）
  - `src/features/notifications/notification-center-v2.tsx` - 通知UI（既存）
- **特徴**:
  - 通知タイプ（success, info, warning, error）
  - 重要度フラグ
  - アクションURL（クリックでページ遷移）
  - 既読・未読管理

#### 2. ✅ PDF出力機能（PDF Export）
- **実装内容**:
  - 給与明細PDF（Salary Statement）
  - 賞与明細PDF（Bonus Statement）
  - 源泉徴収票PDF（Withholding Tax Slip）
- **実装ファイル**:
  - `src/lib/pdf/payroll-pdf.ts` - PDF生成ロジック
  - `src/app/[locale]/payroll/page.tsx` - ダウンロードボタン追加
- **使用ライブラリ**: jsPDF 3.0.3
- **特徴**:
  - BOM付きUTF-8（Excel対応）
  - 日本語ラベル + 英語ヘッダー
  - 詳細な内訳（支給項目・控除項目）
  - 生成日時の自動記録

#### 3. ✅ CSV出力機能（CSV Export）
- **実装内容**:
  - 勤怠データCSV出力
  - 給与データCSV出力
  - 賞与データCSV出力
- **実装ファイル**:
  - `src/lib/csv/csv-export.ts` - CSV生成ユーティリティ
  - `src/app/[locale]/attendance/page.tsx` - 勤怠CSV出力
  - `src/app/[locale]/payroll/page.tsx` - 給与・賞与CSV出力
- **特徴**:
  - BOM付きUTF-8（Excel対応）
  - カンマ・改行・引用符の自動エスケープ
  - 日本語ヘッダー
  - ファイル名に日付・期間を含む

#### 4. ✅ 一括承認機能（Bulk Approval）
- **状態**: 既存実装を確認（既に完成済み）
- **実装ファイル**:
  - `src/features/workflow/bulk-approval-bar.tsx`
  - `src/lib/workflow-store.ts` - bulkApprove/bulkReject メソッド

#### Phase 1の成果
- ✅ ワークフロー機能の実用性が大幅に向上（通知システム）
- ✅ 給与・勤怠データの外部活用が可能に（CSV/PDF出力）
- ✅ 管理者の作業効率が向上（一括承認）
- ✅ ビルド成功（警告のみ、エラーなし）

---

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

### 🔧 Hydrationエラー根本対策（2025-10-13完全解決）

#### 問題の経緯
ログインページで Hydration エラーが発生し、「4 errors」が表示される問題が発生。
- **症状**: Expected server HTML to contain a matching text node for ">" in <div>
- **原因**: SSR/CSR の不一致（特殊文字、クライアント専用API、古いキャッシュ）

#### 実施した対策

##### 1. useIsMounted フックの作成
SSR/CSR の不一致を防ぐための汎用フック：
```typescript
// src/hooks/useIsMounted.ts
"use client";
import { useEffect, useState } from "react";

export const useIsMounted = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
};
```

##### 2. ログインページの修正
マウント後のみレンダリング：
```tsx
export default function LoginPage() {
  const mounted = useIsMounted();
  if (!mounted) return null;
  return <ActualLoginForm />;
}
```

##### 3. ESLint 設定の強化
`.eslintrc.json` に以下を追加：
- 特殊文字（›, >, ⌘）の禁止
- localStorage/sessionStorage の直接参照を警告

##### 4. Calendar の Table 固定
- `classNames.row/head_row` に grid を渡さない
- `globals.css` で table 表示を `!important` で強制
- `styles` プロップで `display: 'table-row'` を明示的に設定

#### 再発防止策
1. ✅ クライアント専用API（localStorage, window, document）は必ず useEffect 内で使用
2. ✅ 特殊文字（⌘, ›, >）は使用せず、アイコンコンポーネントを使用
3. ✅ Calendar の row/head_row に grid を渡さない
4. ✅ ビルドキャッシュは定期的にクリア（`.next`, `.turbo`, `node_modules/.cache`）
5. ✅ `npm run lint:arrows` で定期チェック
6. ✅ `npm run lint:calendar` でカレンダー禁止パターンチェック
7. ✅ `npm run build:strict` で厳密ビルド（TypeScript + カレンダーチェック）

#### 保守ガイド
詳細は `CALENDAR_MAINTENANCE.md` を参照してください。

---

### 👥 ユーザー管理・退職処理機能（2025-10-08完成）

#### 実装済み機能
- **退職処理ダイアログ** - 削除→退職処理に変更、退職日・退職理由を記録
- **退職者フィルター** - 全ユーザー/有効/退職者/無効/停止の5種類フィルター
- **退職者一覧表示** - 入社日・退職日を並べて表示
- **退職者統計カード** - 退職者数の専用統計表示

#### ユーザーステータス種類
```typescript
type UserStatus =
  | 'active'      // 有効（現在勤務中）
  | 'inactive'    // 無効（一時無効化）
  | 'suspended'   // 停止（アカウント停止）
  | 'retired'     // 退職（退職処理済み、退職日・理由を記録）

type RetirementReason =
  | 'voluntary'       // 自己都合退職
  | 'company'         // 会社都合退職
  | 'contract_end'    // 契約期間満了
  | 'retirement_age'  // 定年退職
  | 'other'           // その他
```

#### 実装ファイル
- `src/features/users/retire-user-dialog.tsx` - 退職処理ダイアログ
- `src/app/[locale]/users/page.tsx` - ユーザー管理画面（フィルター・統計追加）
- `src/lib/store/user-store.ts` - retireUser(), getActiveUsers(), getRetiredUsers() 追加
- `src/types/index.ts` - UserSchema に retired ステータス、retiredDate、retirementReason 追加

---

### 🎨 Tabsレイアウト問題の恒久対策（2025-10-08）

#### 問題の概要
給与管理画面のタブ（給与明細一覧・給与計算・賞与管理・給与設定）が左寄りになり、画面幅いっぱいに広がらない問題が再発。

#### 根本原因
`<Tabs>` コンポーネント自体に `w-full` クラスが付いていなかった。`<TabsList>` に `grid w-full grid-cols-4` を指定していても、親要素に幅指定がないため左に寄ってしまう。

#### 解決策
```tsx
// ❌ Before - Tabsに幅指定なし
<Tabs defaultValue="overview" className="space-y-4">
  <TabsList className="grid w-full grid-cols-4">
    ...
  </TabsList>
</Tabs>

// ✅ After - Tabsに w-full を追加
<Tabs defaultValue="overview" className="space-y-4 w-full">
  <TabsList className="grid w-full grid-cols-4">
    ...
  </TabsList>
</Tabs>
```

#### 再発防止チェックリスト
- ✅ **親要素の幅**: `<Tabs className="w-full">` 必須
- ✅ **Grid設定**: `<TabsList className="grid w-full grid-cols-N">` でN等分
- ✅ **確認対象ファイル**:
  - `src/app/[locale]/payroll/page.tsx:257`
  - `src/app/[locale]/settings/page.tsx`（設定画面も同様）
  - その他Tabsを使用する全ページ

---

---

### 📅 カレンダーレイアウト問題（2025-10-12）- 未解決

#### 問題の症状
- **初回表示時**: カレンダーが正しく7列で表示される ✅
- **リロード後**: 左列だけが巨大化、または全体が崩れる ❌
- **パターン**: 「初回OK、リロード後NG」が一貫して再現

#### 根本原因の推測
react-day-pickerのハイドレーション時に、`row`/`head_row` に `grid grid-cols-7` が動的に適用され、table レイアウトが壊れる。

#### 実施した修正（12回以上）
1. globals.css への table 強制レイアウト（!important）
2. ボタンサイズの強制固定（CSS変数）
3. セル自体のサイズ制限
4. 選択状態のセル固定
5. calendar.tsx から `aspect-square h-full w-full` 削除
6. `defaultClassNames.day` 削除
7. attendance-calendar.tsx の `styles` プロパティでインラインスタイル
8. attendance-calendar.tsx のインラインCSS（`<style>`タグ）
9. useEffect でDOM直接操作（初回実行）
10. useEffect でDOM直接操作（遅延実行追加）
11. **NEW**: `not-prose` クラス追加（typography対策）
12. **NEW**: `styles` プロップで `display: table-row` をインラインスタイル強制

#### 現在のファイル状態
- ✅ `src/components/ui/calendar.tsx`: `not-prose` + inline styles
- ✅ `src/features/attendance/attendance-calendar.tsx`: `not-prose` + inline styles
- ✅ `src/app/globals.css`: table 強制 + `.rdp .rdp-day { all: unset; }`

#### 次回への引き継ぎ
- [ ] 本番ビルド（`npm run build && npm run start`）で確認
- [ ] DevTools で `tr.rdp-row` の Computed > display を確認
- [ ] react-day-picker のバージョン確認・アップデート検討
- [ ] 最終手段：完全自作カレンダーまたはライブラリ変更

#### 参考ドキュメント
- `CALENDAR_BUG_FINAL_REPORT_v3.md` - 全試行の詳細記録

---

**最重要**: Hydrationエラーと白画面認証問題は完全に解決済み。再発防止策も実装済み。Tabsレイアウト問題も恒久対策完了。カレンダー問題は継続調査中。