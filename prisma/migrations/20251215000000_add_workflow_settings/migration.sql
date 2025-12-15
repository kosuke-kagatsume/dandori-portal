-- CreateTable
CREATE TABLE IF NOT EXISTS "workflow_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "defaultApprovalDeadlineDays" INTEGER NOT NULL DEFAULT 3,
    "enableAutoEscalation" BOOLEAN NOT NULL DEFAULT false,
    "escalationReminderDays" INTEGER NOT NULL DEFAULT 1,
    "enableAutoApproval" BOOLEAN NOT NULL DEFAULT false,
    "autoApprovalThreshold" INTEGER NOT NULL DEFAULT 10000,
    "requireCommentOnReject" BOOLEAN NOT NULL DEFAULT true,
    "allowParallelApproval" BOOLEAN NOT NULL DEFAULT false,
    "enableProxyApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "workflow_settings_tenantId_key" ON "workflow_settings"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "workflow_settings_tenantId_idx" ON "workflow_settings"("tenantId");
