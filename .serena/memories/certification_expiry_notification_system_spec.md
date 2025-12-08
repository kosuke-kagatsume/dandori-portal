# 資格有効期限通知・更新確認システム仕様

## 1. システム概要

```
[取得] → [有効] → [期限接近通知] → [更新申請] → [承認] → [有効]
                       ↓
                  [期限切れ]
                       ↓
                  [再取得申請]
```

## 2. 通知タイミング設計

| 通知タイプ | 期限前日数 | 対象者 | 通知方法 | 緊急度 |
|-----------|-----------|--------|---------|-------|
| 早期通知 | 90日前 | 本人 | アプリ内 | 低 |
| 標準通知 | 60日前 | 本人 | アプリ内 + メール | 中 |
| 警告通知 | 30日前 | 本人 + 上長 | アプリ内 + メール | 高 |
| 緊急通知 | 14日前 | 本人 + 上長 + 人事 | アプリ内 + メール + プッシュ | 緊急 |
| 最終通知 | 7日前 | 本人 + 上長 + 人事 | 全チャネル | 緊急 |
| 期限切れ | 0日 | 本人 + 人事 | 全チャネル | 緊急 |

## 3. データベーススキーマ

### CertificationNotificationSettings（テナント単位）
- notificationDays: Int[] @default([90, 60, 30, 14, 7])
- enableEmailNotification: Boolean @default(true)
- enablePushNotification: Boolean @default(true)
- enableInAppNotification: Boolean @default(true)
- escalateToManagerDays: Int @default(30)
- escalateToHrDays: Int @default(14)

### CertificationNotification（通知履歴）
- certificationId, userId
- notificationType: early, standard, warning, urgent, final, expired
- daysUntilExpiry: Int
- sentAt, readAt, acknowledgedAt
- emailSent, pushSent, inAppSent: Boolean
- escalatedToManager, escalatedToHr: Boolean

### CertificationRenewal（更新申請）
- certificationId, userId
- newIssueDate, newExpiryDate
- newDocumentUrl, newDocumentName
- status: pending, under_review, approved, rejected
- reviewedBy, reviewedAt, reviewComment
- 確認チェック: documentVerified, dateVerified, organizationVerified

## 4. APIエンドポイント

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | /api/certifications/expiring | 期限接近資格一覧 |
| GET | /api/certifications/notifications | 通知履歴一覧 |
| POST | /api/certifications/notifications/send | 通知手動送信 |
| PATCH | /api/certifications/notifications/:id/read | 通知既読 |
| GET | /api/certifications/renewals | 更新申請一覧 |
| POST | /api/certifications/renewals | 更新申請作成 |
| PATCH | /api/certifications/renewals/:id | 申請審査 |
| GET | /api/admin/certifications/dashboard | 管理ダッシュボード |
| GET | /api/admin/certifications/settings | 通知設定取得 |
| PUT | /api/admin/certifications/settings | 通知設定更新 |

## 5. 画面構成

### 従業員向け
- 通知センター（ヘッダーベル）
- 資格更新申請画面

### 管理者向け
- 資格管理ダッシュボード（期限切れ/接近/申請中のカウント）
- 更新申請審査画面（チェックリスト付き）

## 6. 実装優先順位
1. DBスキーマ追加・マイグレーション
2. 更新申請API・画面
3. 管理者審査画面
4. 通知履歴API・表示
5. 管理ダッシュボード
6. バッチ処理（Vercel Cron）
7. メール通知連携
8. プッシュ通知連携

## 7. 技術選定
- バッチ処理: Vercel Cron Jobs
- メール送信: AWS SES または SendGrid
- プッシュ通知: Firebase Cloud Messaging
- ファイルストレージ: AWS S3
- 通知UI: Radix UI Toast + カスタム通知センター
