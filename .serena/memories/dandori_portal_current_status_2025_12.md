# DandoriPortal 実装状況（2025年12月）

## 本番環境
- **URL**: https://dandori-portal.com
- **インフラ**: AWS Amplify（Vercelから移行完了）
- **データベース**: AWS RDS PostgreSQL
- **認証**: AWS Cognito

## 実装済みページ一覧（39ページ）

### HR領域（ポータル）
| ページ | パス | 説明 |
|--------|------|------|
| ダッシュボード | /dashboard | 統計・グラフ表示 |
| ユーザー管理 | /users | ユーザーCRUD・退職処理 |
| ユーザー詳細 | /users/[id] | 個別ユーザー詳細 |
| メンバー管理 | /members | メンバー一覧 |
| 勤怠管理 | /attendance | 打刻・カレンダー |
| 休暇管理 | /leave | 申請・残数管理 |
| 給与管理 | /payroll | 給与・賞与・年末調整 |
| 人事評価 | /evaluation | 評価管理 |
| 組織管理 | /organization | 組織図・部門管理 |
| ワークフロー | /workflow | 申請フロー |
| 設定 | /settings | 各種設定（10タブ） |
| プロフィール | /profile | 個人設定 |
| 監査ログ | /audit | 操作履歴 |

### 健康管理（Phase 2 完了）
| ページ | パス | 説明 |
|--------|------|------|
| 健康管理 | /health | 健康診断・ストレスチェック管理 |
| ストレスチェック受検 | /health/stress-check/take | 従業員向け受検画面 |

### 資産管理
| ページ | パス | 説明 |
|--------|------|------|
| 資産管理 | /assets | PC・車両管理 |
| SaaS管理 | /saas | ライセンス管理 |
| SaaS詳細 | /saas/[id] | サービス詳細 |
| SaaS部門別 | /saas/departments | 部門別利用状況 |
| SaaSユーザー別 | /saas/users | ユーザー別利用状況 |

### 入社手続き（オンボーディング）
| ページ | パス | 説明 |
|--------|------|------|
| 入社手続き | /onboarding | 新入社員向けダッシュボード |
| 基本情報 | /onboarding/[id]/basic-info | 基本情報入力 |
| 家族情報 | /onboarding/[id]/family-info | 家族情報入力 |
| 口座情報 | /onboarding/[id]/bank-account | 銀行口座入力 |
| 通勤経路 | /onboarding/[id]/commute-route | 通勤経路入力 |
| 入社管理（HR） | /onboarding-admin | HR向け管理画面 |
| 入社詳細（HR） | /onboarding-admin/[id] | 申請詳細・承認 |

### その他
| ページ | パス | 説明 |
|--------|------|------|
| お知らせ | /announcements | 社内お知らせ閲覧 |
| お知らせ管理 | /announcements-admin | お知らせ作成・管理 |
| 法令・制度更新 | /legal-updates | 法改正情報 |
| 予定変更 | /scheduled-changes | 予定変更管理 |
| 請求書（テナント） | /billing | テナント向け請求書閲覧 |

### DW管理機能（Super Admin）
| ページ | パス | 説明 |
|--------|------|------|
| DW管理ダッシュボード | /dw-admin/dashboard | 統計・概要 |
| テナント一覧 | /dw-admin/tenants | テナント管理 |
| テナント詳細 | /dw-admin/tenants/[id] | テナント詳細・編集 |
| 請求書詳細 | /dw-admin/invoices/[id] | 請求書詳細 |
| 通知詳細 | /dw-admin/notifications/[id] | 通知詳細 |

### 認証
| ページ | パス | 説明 |
|--------|------|------|
| ログイン | /auth/login | ログイン画面 |

## Zustandストア一覧（30+）
- admin-tenant-store - DW管理テナント
- announcements-store - お知らせ
- approval-flow-store - 承認フロー
- attendance-history-store - 勤怠履歴
- audit-store - 監査ログ
- company-settings-store - 会社設定
- invoice-auto-generation-store - 請求書自動生成
- invoice-store - 請求書
- leave-management-store - 休暇管理
- legal-updates-store - 法令更新
- master-data-store - マスターデータ
- notification-history-store - 通知履歴
- notification-store - 通知
- onboarding-store - 入社手続き
- organization-store - 組織
- payment-reminder-store - 支払いリマインダー
- payroll-store - 給与
- pc-store - PC資産
- performance-evaluation-store - 人事評価
- retired-yearend-store - 退職者年末調整
- saas-store - SaaS管理
- scheduled-changes-store - 予定変更
- tenant-context-store - テナントコンテキスト
- tenant-store - テナント
- todo-store - ToDo
- ui-store - UI設定
- user-store - ユーザー
- vehicle-store - 車両

## マルチテナント機能
- ✅ サブドメインベースのテナント識別
- ✅ MiddlewareでのDB動的検索
- ✅ メモリキャッシュ（TTL 5分）
- ✅ テナント解決API `/api/tenant/resolve`

## 技術スタック
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Zustand (状態管理)
- Tailwind CSS + shadcn/ui
- Prisma (ORM)
- AWS Amplify / RDS / Cognito
