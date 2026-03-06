-- AlterTable
ALTER TABLE "scheduled_changes" ADD COLUMN "newEmploymentType" TEXT;
ALTER TABLE "scheduled_changes" ADD COLUMN "newWorkRuleId" TEXT;
ALTER TABLE "scheduled_changes" ADD COLUMN "currentEmploymentType" TEXT;
ALTER TABLE "scheduled_changes" ADD COLUMN "currentWorkRuleName" TEXT;
