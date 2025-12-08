# ダッシュボード本番実装計画

## 作成日: 2025-12-08
## ステータス: 計画中

---

## 📊 現状サマリー

| ダッシュボード | 現状 | 目標 |
|---------------|------|------|
| メインダッシュボード | 100%モック | 100%実DB |
| 健康管理 | 60%モック | 100%実DB |
| DW管理 | 100%モック | 100%実DB |
| 資格管理 | 80%モック | 100%実DB |
| 人事評価 | 未実装 | ロードマップ（後回し） |

---

## 🏗️ フェーズ別実装計画

### Phase 1: DBスキーマ拡張（優先度：高）

#### 1.1 追加が必要なモデル

```prisma
// 支払い管理（DW-Admin用）
model Payment {
  id              String    @id @default(cuid())
  tenantId        String
  invoiceId       String
  amount          Int
  paymentMethod   String    // bank_transfer, credit_card, cash
  paymentDate     DateTime
  referenceNumber String?
  status          String    @default("pending") // pending, confirmed, disputed
  confirmedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  invoice         Invoice   @relation(fields: [invoiceId], references: [id])
}

// 請求リマインダー
model InvoiceReminder {
  id           String    @id @default(cuid())
  tenantId     String
  invoiceId    String
  reminderDate DateTime
  sentCount    Int       @default(0)
  status       String    @default("pending") // pending, sent, paid
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  tenant       Tenant    @relation(fields: [tenantId], references: [id])
  invoice      Invoice   @relation(fields: [invoiceId], references: [id])
}

// 統合アクティビティフィード
model ActivityFeed {
  id           String    @id @default(cuid())
  tenantId     String
  userId       String?
  actorId      String
  actorType    String    // user, system
  action       String    // attendance_checkin, leave_approved, announcement, etc
  resourceType String    // attendance, leave_request, announcement, etc
  resourceId   String?
  metadata     Json?
  createdAt    DateTime  @default(now())
  
  tenant       Tenant    @relation(fields: [tenantId], references: [id])
  user         User?     @relation("ActivityTarget", fields: [userId], references: [id])
  actor        User      @relation("ActivityActor", fields: [actorId], references: [id])
  
  @@index([tenantId, createdAt])
  @@index([userId, createdAt])
}

// DW管理通知
model DWNotification {
  id          String    @id @default(cuid())
  tenantId    String?   // nullの場合は全テナント向け
  type        String    // contract_expiry, payment_overdue, license_issue, system_alert
  title       String
  message     String
  severity    String    @default("info") // info, warning, error, critical
  read        Boolean   @default(false)
  actionUrl   String?
  createdAt   DateTime  @default(now())
  
  tenant      Tenant?   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId, read])
}

// 日次勤怠集計（パフォーマンス用）
model DailyAttendanceMetric {
  id                String    @id @default(cuid())
  tenantId          String
  date              DateTime  @db.Date
  presentCount      Int       @default(0)
  absentCount       Int       @default(0)
  lateCount         Int       @default(0)
  earlyLeaveCount   Int       @default(0)
  remoteCount       Int       @default(0)
  avgWorkMinutes    Int       @default(0)
  avgOvertimeMinutes Int      @default(0)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  tenant            Tenant    @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, date])
}

// 健康診断集計
model HealthCheckupSummary {
  id              String    @id @default(cuid())
  tenantId        String
  month           DateTime  @db.Date  // 月初日
  totalCheckups   Int       @default(0)
  resultA         Int       @default(0)
  resultB         Int       @default(0)
  resultC         Int       @default(0)
  resultD         Int       @default(0)
  resultE         Int       @default(0)
  pendingCount    Int       @default(0)
  overdueCount    Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, month])
}

// ストレスチェック集計
model StressCheckSummary {
  id                String    @id @default(cuid())
  tenantId          String
  month             DateTime  @db.Date
  totalParticipants Int       @default(0)
  highStressCount   Int       @default(0)
  interviewCount    Int       @default(0)
  avgStressScore    Float     @default(0)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  tenant            Tenant    @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, month])
}
```

#### 1.2 既存モデルへの追加フィールド

```prisma
// Invoice に Payment リレーション追加
model Invoice {
  // ... 既存フィールド ...
  payments    Payment[]
  reminders   InvoiceReminder[]
}

// Tenant に新リレーション追加
model Tenant {
  // ... 既存フィールド ...
  payments              Payment[]
  invoiceReminders      InvoiceReminder[]
  activityFeeds         ActivityFeed[]
  dwNotifications       DWNotification[]
  dailyAttendanceMetrics DailyAttendanceMetric[]
  healthCheckupSummaries HealthCheckupSummary[]
  stressCheckSummaries   StressCheckSummary[]
}
```

---

### Phase 2: API実装

#### 2.1 メインダッシュボードAPI

| エンドポイント | 機能 | 優先度 |
|---------------|------|--------|
| `GET /api/dashboard/stats` | KPIカード用統計 | 高 |
| `GET /api/dashboard/attendance-trend` | 勤怠推移グラフ | 高 |
| `GET /api/dashboard/leave-summary` | 休暇サマリー | 高 |
| `GET /api/dashboard/pending-approvals` | 承認待ち一覧 | 高 |
| `GET /api/dashboard/activity-feed` | 最近のアクティビティ | 中 |
| `GET /api/dashboard/system-status` | システムステータス | 低 |

**実装詳細: `/api/dashboard/stats`**
```typescript
// 返却データ
{
  totalEmployees: number,      // User.count where tenantId
  attendanceRate: number,      // 今日の出勤率
  pendingApprovals: number,    // 未承認ワークフロー数
  leaveBalance: {
    remaining: number,
    used: number,
    pending: number
  },
  // ロール別追加データ
  teamMembers?: number,        // マネージャー向け
  systemHealth?: number,       // 管理者向け
}
```

#### 2.2 健康管理ダッシュボードAPI

| エンドポイント | 機能 | 優先度 |
|---------------|------|--------|
| `GET /api/health/dashboard/stats` | 健診KPI | 高 |
| `GET /api/health/dashboard/checkup-trend` | 健診推移 | 中 |
| `GET /api/health/dashboard/stress-trend` | ストレス推移 | 中 |
| `GET /api/health/dashboard/department-analysis` | 部門別分析 | 中 |

#### 2.3 DW管理ダッシュボードAPI

| エンドポイント | 機能 | 優先度 |
|---------------|------|--------|
| `GET /api/dw-admin/dashboard/stats` | 売上KPI | 高 |
| `GET /api/dw-admin/dashboard/revenue-trend` | 売上推移 | 高 |
| `GET /api/dw-admin/invoices` | 請求書CRUD | 高 |
| `GET /api/dw-admin/payments` | 支払いCRUD | 高 |
| `POST /api/dw-admin/invoices/generate` | 請求書自動生成 | 中 |
| `POST /api/dw-admin/reminders/send` | リマインダー送信 | 中 |
| `GET /api/dw-admin/notifications` | DW通知一覧 | 中 |

---

### Phase 3: フロントエンド接続

#### 3.1 ダッシュボードコンポーネント更新

| ファイル | 変更内容 |
|---------|---------|
| `dashboard/page.tsx` | モックデータ → API呼び出し |
| `dashboard/dashboard-optimized.tsx` | useSWR/React Query導入 |
| `components/dashboard/role-based-charts.tsx` | API連携 |
| `health/page.tsx` | 健康管理API連携 |
| `dw-admin/dashboard/page.tsx` | DW管理API連携 |

#### 3.2 Hooks実装

```typescript
// src/hooks/use-dashboard-stats.ts
export function useDashboardStats() {
  return useSWR('/api/dashboard/stats', fetcher, {
    refreshInterval: 60000, // 1分ごと更新
  });
}

// src/hooks/use-attendance-trend.ts
export function useAttendanceTrend(period: 'week' | 'month' | 'year') {
  return useSWR(`/api/dashboard/attendance-trend?period=${period}`, fetcher);
}

// src/hooks/use-dw-admin-stats.ts
export function useDWAdminStats() {
  return useSWR('/api/dw-admin/dashboard/stats', fetcher);
}
```

---

### Phase 4: データ集計バッチ

#### 4.1 日次バッチ処理

```typescript
// scripts/aggregate-daily-metrics.ts
// 毎日深夜に実行

async function aggregateDailyMetrics() {
  const tenants = await prisma.tenant.findMany({ where: { isActive: true } });
  
  for (const tenant of tenants) {
    // 勤怠集計
    await aggregateAttendanceMetrics(tenant.id, yesterday);
    
    // 健康診断集計（月次）
    if (isFirstDayOfMonth()) {
      await aggregateHealthMetrics(tenant.id, lastMonth);
    }
  }
}
```

#### 4.2 リアルタイム更新

- 勤怠登録時 → DailyAttendanceMetric更新
- ワークフロー承認時 → ActivityFeed追加
- 請求書支払い時 → Payment作成 + Invoice更新

---

## 📋 実装タスク一覧

### フェーズ1: DBスキーマ（所要時間: 1日）
- [ ] 1.1 新規モデル追加（Payment, InvoiceReminder, ActivityFeed, DWNotification）
- [ ] 1.2 集計モデル追加（DailyAttendanceMetric, HealthCheckupSummary, StressCheckSummary）
- [ ] 1.3 既存モデルリレーション追加
- [ ] 1.4 prisma db push 実行
- [ ] 1.5 インデックス最適化

### フェーズ2: API実装（所要時間: 3日）
- [ ] 2.1 メインダッシュボードAPI（5エンドポイント）
- [ ] 2.2 健康管理ダッシュボードAPI（4エンドポイント）
- [ ] 2.3 DW管理ダッシュボードAPI（6エンドポイント）
- [ ] 2.4 APIテスト

### フェーズ3: フロントエンド（所要時間: 2日）
- [ ] 3.1 メインダッシュボード接続
- [ ] 3.2 健康管理ダッシュボード接続
- [ ] 3.3 DW管理ダッシュボード接続
- [ ] 3.4 ローディング・エラー状態実装

### フェーズ4: バッチ・運用（所要時間: 1日）
- [ ] 4.1 日次集計バッチ作成
- [ ] 4.2 初期データ移行スクリプト
- [ ] 4.3 デモデータ投入スクリプト更新

---

## 🎯 優先順位

1. **最優先**: DW管理ダッシュボード（請求書・支払い管理は業務クリティカル）
2. **高**: メインダッシュボード（全ユーザーが使用）
3. **中**: 健康管理ダッシュボード
4. **低**: 人事評価（ロードマップ、今回は対象外）

---

## ⚠️ 注意事項

1. **パフォーマンス**: 集計テーブルを使用し、リアルタイム計算を避ける
2. **マルチテナント**: 全クエリにtenantIdフィルタ必須
3. **権限**: ロールに応じたデータアクセス制御
4. **キャッシュ**: SWRで適切なrevalidation設定
5. **エラーハンドリング**: API障害時のフォールバック表示

---

## 🔄 更新履歴

- 2025-12-08: 初版作成
