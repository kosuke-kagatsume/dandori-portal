-- AlterTable: users に positionId / departmentId FK カラムを追加
ALTER TABLE "users" ADD COLUMN "positionId" TEXT;
ALTER TABLE "users" ADD COLUMN "departmentId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "users_positionId_idx" ON "users"("positionId");
CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");

-- バックフィル: positionId (users.position名 → positions.id)
UPDATE "users" u
SET "positionId" = p.id
FROM "positions" p
WHERE u."tenantId" = p."tenantId"
  AND u."position" = p."name"
  AND u."positionId" IS NULL;

-- バックフィル: departmentId (users.department名 → departments.id)
UPDATE "users" u
SET "departmentId" = d.id
FROM "departments" d
WHERE u."tenantId" = d."tenantId"
  AND u."department" = d."name"
  AND u."departmentId" IS NULL;
