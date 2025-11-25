# Dandori Portal - 機能一覧（メモリ保存版）

## 最終更新
- **日付**: 2025-11-25
- **バージョン**: v2.5
- **全体進捗**: 82% (実装済み333項目 / 全406項目)

## 最新の実装状況

### ✅ 完全実装済み（2025-11-25追加）

#### DW管理者ダッシュボード
- ✅ テナント管理機能
- ✅ 収益状況カード（総収益、今月の収益）
- ✅ 契約テナント数カード（アクティブテナント数表示）
- ✅ 未払い金額カード（期限超過：0件）
- ✅ 通知送信状況（送信成功12件、失敗0件、請求書発行6件、リマインダー4件、入金確認2件）
- ✅ 最近の支払い状況テーブル（支払日、テナント名、請求書番号、請求月、金額表示）
- ✅ タブナビゲーション（ダッシュボード、テナント管理、支払い管理、自動生成、リマインダー、通知履歴）
- ✅ `/dw-admin/dashboard` ページ実装済み

#### アナウンス機能（完全実装）
- ✅ アナウンス管理画面（HR・管理者のみ）
  - `/announcements-admin` ページ実装済み
  - アナウンスCRUD機能（作成・編集・削除）
  - 公開・非公開切り替え
  - 優先度設定（urgent/high/normal/low）
  - 種別設定（general/deadline/system/event/policy/emergency）
  - 対象ユーザー設定（all/employee/manager/hr/executive/custom）
  - Markdown対応のコンテンツエディタ
  - 掲載期間設定（開始日・終了日）
  - 対応期限設定
  - ユーザーごとの既読/未読管理
  
- ✅ アナウンス一覧画面（全社員）
  - `/announcements` ページ実装済み
  - フィルター機能（検索・優先度・種類・既読/未読）
  - 統計カード（全体・未読・緊急・要対応）
  - カード形式一覧表示
  - 詳細モーダル（Markdown表示）
  - 自動既読マーク機能
  - react-markdown/remark-gfm統合
  
- ✅ ダッシュボード連携
  - 最新アナウンスカード表示
  - サイドバーメニュー追加
  - RBAC権限設定（全ロール対応）

#### Zustandストア
- ✅ `announcements-store.ts` (690行)
  - fetchAnnouncements
  - createAnnouncement / updateAnnouncement / deleteAnnouncement
  - publishAnnouncement / unpublishAnnouncement
  - markAsRead / markAsCompleted
  - getUserStatus（ユーザーごとの既読/未読状態取得）
  - getActiveAnnouncements / getUnreadAnnouncements
  - getStats（統計情報取得）
  - LocalStorage永続化対応

### 実装済み主要機能（既存）
- ⭕ ダッシュボード（14ページ完全実装）
- ⭕ ユーザー管理（CSV I/O、退職処理、詳細タブ）
- ⭕ メンバー管理（6ステータス、カード/テーブル切替）
- ⭕ 勤怠管理（打刻、カレンダー、残業計算）
- ⭕ 休暇管理（6種類、残数管理、承認フロー）
- ⭕ ワークフロー（6種類申請タイプ）
- ⭕ 給与管理（年末調整計算機含む）
- ⭕ 賞与管理（査定評価システム）
- ⭕ 組織管理（4階層組織図）
- ⭕ 資産管理（PC・車両、業者管理）
- ⭕ SaaS管理（ライセンス、コスト分析、部門別・ユーザー別）
- ⭕ 設定（11タブ・68設定項目）
- ⭕ オンボーディング（新入社員・HR管理）

### 技術スタック
- Next.js 14.2.15 (App Router)
- TypeScript (Strict Mode)
- Zustand + Persist (19ストア)
- React Hook Form + Zod
- shadcn/ui + Tailwind CSS
- react-markdown (Markdown表示)
- Recharts (グラフ)
- Supabase (準備中、デモモード有効)
