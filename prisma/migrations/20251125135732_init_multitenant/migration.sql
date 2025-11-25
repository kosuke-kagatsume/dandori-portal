-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "checkInLocation" JSONB,
ADD COLUMN     "checkOutLocation" JSONB;

-- CreateTable
CREATE TABLE "workflow_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "department" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION,
    "days" INTEGER,
    "hours" DOUBLE PRECISION,
    "details" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_steps" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "approverRole" TEXT NOT NULL,
    "approverId" TEXT,
    "approverName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "actionDate" TIMESTAMP(3),
    "comments" TEXT,
    "executionMode" TEXT NOT NULL DEFAULT 'sequential',
    "timeoutHours" INTEGER,
    "isEscalated" BOOLEAN NOT NULL DEFAULT false,
    "escalatedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_entries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "days" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "attachments" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approver" TEXT,
    "approverName" TEXT,
    "approvedDate" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "paidLeaveTotal" INTEGER NOT NULL DEFAULT 0,
    "paidLeaveUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidLeaveRemaining" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidLeaveExpiry" DATE NOT NULL,
    "sickLeaveTotal" INTEGER NOT NULL DEFAULT 0,
    "sickLeaveUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sickLeaveRemaining" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "specialLeaveTotal" INTEGER NOT NULL DEFAULT 0,
    "specialLeaveUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "specialLeaveRemaining" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "compensatoryLeaveTotal" INTEGER NOT NULL DEFAULT 0,
    "compensatoryLeaveUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "compensatoryLeaveRemaining" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_requests_tenantId_idx" ON "workflow_requests"("tenantId");

-- CreateIndex
CREATE INDEX "workflow_requests_requesterId_idx" ON "workflow_requests"("requesterId");

-- CreateIndex
CREATE INDEX "workflow_requests_tenantId_requesterId_idx" ON "workflow_requests"("tenantId", "requesterId");

-- CreateIndex
CREATE INDEX "workflow_requests_tenantId_status_idx" ON "workflow_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "workflow_requests_status_idx" ON "workflow_requests"("status");

-- CreateIndex
CREATE INDEX "workflow_requests_type_idx" ON "workflow_requests"("type");

-- CreateIndex
CREATE INDEX "workflow_requests_createdAt_idx" ON "workflow_requests"("createdAt");

-- CreateIndex
CREATE INDEX "approval_steps_tenantId_idx" ON "approval_steps"("tenantId");

-- CreateIndex
CREATE INDEX "approval_steps_workflowId_idx" ON "approval_steps"("workflowId");

-- CreateIndex
CREATE INDEX "approval_steps_tenantId_approverId_idx" ON "approval_steps"("tenantId", "approverId");

-- CreateIndex
CREATE INDEX "approval_steps_tenantId_status_idx" ON "approval_steps"("tenantId", "status");

-- CreateIndex
CREATE INDEX "approval_steps_approverId_idx" ON "approval_steps"("approverId");

-- CreateIndex
CREATE INDEX "approval_steps_status_idx" ON "approval_steps"("status");

-- CreateIndex
CREATE INDEX "timeline_entries_tenantId_idx" ON "timeline_entries"("tenantId");

-- CreateIndex
CREATE INDEX "timeline_entries_workflowId_idx" ON "timeline_entries"("workflowId");

-- CreateIndex
CREATE INDEX "timeline_entries_tenantId_createdAt_idx" ON "timeline_entries"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "timeline_entries_createdAt_idx" ON "timeline_entries"("createdAt");

-- CreateIndex
CREATE INDEX "leave_requests_tenantId_idx" ON "leave_requests"("tenantId");

-- CreateIndex
CREATE INDEX "leave_requests_userId_idx" ON "leave_requests"("userId");

-- CreateIndex
CREATE INDEX "leave_requests_tenantId_userId_idx" ON "leave_requests"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "leave_requests_tenantId_status_idx" ON "leave_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "leave_requests_tenantId_startDate_idx" ON "leave_requests"("tenantId", "startDate");

-- CreateIndex
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");

-- CreateIndex
CREATE INDEX "leave_requests_startDate_idx" ON "leave_requests"("startDate");

-- CreateIndex
CREATE INDEX "leave_requests_endDate_idx" ON "leave_requests"("endDate");

-- CreateIndex
CREATE INDEX "leave_balances_tenantId_idx" ON "leave_balances"("tenantId");

-- CreateIndex
CREATE INDEX "leave_balances_userId_idx" ON "leave_balances"("userId");

-- CreateIndex
CREATE INDEX "leave_balances_tenantId_userId_idx" ON "leave_balances"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_userId_year_key" ON "leave_balances"("userId", "year");

-- CreateIndex
CREATE INDEX "attendance_tenantId_userId_idx" ON "attendance"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "attendance_tenantId_date_idx" ON "attendance"("tenantId", "date");

-- CreateIndex
CREATE INDEX "invoices_tenantId_billingMonth_idx" ON "invoices"("tenantId", "billingMonth");

-- CreateIndex
CREATE INDEX "invoices_tenantId_status_idx" ON "invoices"("tenantId", "status");

-- CreateIndex
CREATE INDEX "org_units_tenantId_parentId_idx" ON "org_units"("tenantId", "parentId");

-- CreateIndex
CREATE INDEX "org_units_tenantId_isActive_idx" ON "org_units"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "user_histories_tenantId_date_idx" ON "user_histories"("tenantId", "date");

-- CreateIndex
CREATE INDEX "users_tenantId_status_idx" ON "users"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
