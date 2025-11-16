-- ========================================
-- テナント管理・請求書機能テーブル追加
-- ========================================

-- 1. 料金テーブル（各テナントごとにカスタマイズ可能）
CREATE TABLE IF NOT EXISTS "pricing_tiers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "minUsers" INTEGER NOT NULL,
    "maxUsers" INTEGER,
    "pricePerUser" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_tiers_pkey" PRIMARY KEY ("id")
);

-- 2. 請求書
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "billingMonth" DATE NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "dueDate" DATE NOT NULL,
    "paidDate" DATE,
    "sentDate" TIMESTAMP(3),
    "billingEmail" TEXT NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- 3. 請求明細
CREATE TABLE IF NOT EXISTS "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "period" TEXT,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- 4. ユーザー履歴（日割り計算用）
CREATE TABLE IF NOT EXISTS "user_histories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "userCount" INTEGER NOT NULL,
    "dailyCharge" INTEGER NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_histories_pkey" PRIMARY KEY ("id")
);

-- 5. テナント設定
CREATE TABLE IF NOT EXISTS "tenant_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "trialEndDate" DATE,
    "contractStartDate" DATE,
    "contractEndDate" DATE,
    "billingEmail" TEXT,
    "customPricing" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'trial',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);

-- ========================================
-- ユニーク制約
-- ========================================

CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_settings_tenantId_key" ON "tenant_settings"("tenantId");

-- ========================================
-- インデックス
-- ========================================

-- pricing_tiers
CREATE INDEX IF NOT EXISTS "pricing_tiers_tenantId_idx" ON "pricing_tiers"("tenantId");

-- invoices
CREATE INDEX IF NOT EXISTS "invoices_tenantId_idx" ON "invoices"("tenantId");
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices"("status");
CREATE INDEX IF NOT EXISTS "invoices_billingMonth_idx" ON "invoices"("billingMonth");
CREATE INDEX IF NOT EXISTS "invoices_invoiceNumber_idx" ON "invoices"("invoiceNumber");

-- invoice_items
CREATE INDEX IF NOT EXISTS "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");

-- user_histories
CREATE INDEX IF NOT EXISTS "user_histories_tenantId_idx" ON "user_histories"("tenantId");
CREATE INDEX IF NOT EXISTS "user_histories_userId_idx" ON "user_histories"("userId");
CREATE INDEX IF NOT EXISTS "user_histories_date_idx" ON "user_histories"("date");

-- ========================================
-- 外部キー制約
-- ========================================

-- pricing_tiers → tenants
ALTER TABLE "pricing_tiers"
ADD CONSTRAINT "pricing_tiers_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- invoices → tenants
ALTER TABLE "invoices"
ADD CONSTRAINT "invoices_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- invoice_items → invoices
ALTER TABLE "invoice_items"
ADD CONSTRAINT "invoice_items_invoiceId_fkey"
FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- user_histories → tenants
ALTER TABLE "user_histories"
ADD CONSTRAINT "user_histories_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- tenant_settings → tenants
ALTER TABLE "tenant_settings"
ADD CONSTRAINT "tenant_settings_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================
-- 完了
-- ========================================
-- 新しいテーブルの追加が完了しました
-- 次のステップ: Supabase SQL Editorでこのファイルを実行してください
