import { prisma } from '@/lib/prisma';

/**
 * 部署(departments) ↔ 組織ユニット(org_units) 同期ユーティリティ
 * departments の変更を org_units に反映する
 */

/** 部署作成時に対応する org_unit を作成 */
export async function syncDepartmentToOrgUnit(
  tenantId: string,
  department: {
    id: string;
    name: string;
    parentId?: string | null;
    isActive?: boolean;
  }
) {
  // 親部署に対応する org_unit の ID を検索
  let parentOrgUnitId: string | null = null;
  let parentLevel = 0;

  if (department.parentId) {
    const parentUnit = await prisma.org_units.findFirst({
      where: {
        tenantId,
        name: (await prisma.departments.findFirst({
          where: { id: department.parentId, tenantId },
          select: { name: true },
        }))?.name ?? '',
      },
      select: { id: true, level: true },
    });
    if (parentUnit) {
      parentOrgUnitId = parentUnit.id;
      parentLevel = parentUnit.level;
    }
  }

  // 同名の org_unit が既にあれば更新、なければ作成
  const existing = await prisma.org_units.findFirst({
    where: { tenantId, name: department.name },
  });

  if (existing) {
    await prisma.org_units.update({
      where: { id: existing.id },
      data: {
        parentId: parentOrgUnitId,
        level: parentLevel + 1,
        isActive: department.isActive ?? true,
        updatedAt: new Date(),
      },
    });
  } else {
    await prisma.org_units.create({
      data: {
        id: department.id, // 同じIDを使用
        tenantId,
        name: department.name,
        type: 'department',
        parentId: parentOrgUnitId,
        level: parentLevel + 1,
        isActive: department.isActive ?? true,
        updatedAt: new Date(),
      },
    });
  }
}

/** 部署更新時に対応する org_unit を更新 */
export async function syncDepartmentUpdate(
  tenantId: string,
  oldName: string,
  updates: {
    name?: string;
    parentId?: string | null;
    isActive?: boolean;
  }
) {
  const orgUnit = await prisma.org_units.findFirst({
    where: { tenantId, name: oldName },
  });

  if (!orgUnit) return;

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }

  if (updates.isActive !== undefined) {
    updateData.isActive = updates.isActive;
  }

  if (updates.parentId !== undefined) {
    if (updates.parentId) {
      const parentDept = await prisma.departments.findFirst({
        where: { id: updates.parentId, tenantId },
        select: { name: true },
      });
      if (parentDept) {
        const parentUnit = await prisma.org_units.findFirst({
          where: { tenantId, name: parentDept.name },
          select: { id: true, level: true },
        });
        if (parentUnit) {
          updateData.parentId = parentUnit.id;
          updateData.level = parentUnit.level + 1;
        }
      }
    } else {
      updateData.parentId = null;
      updateData.level = 1;
    }
  }

  await prisma.org_units.update({
    where: { id: orgUnit.id },
    data: updateData,
  });
}

/** 部署削除時に対応する org_unit を削除（または無効化） */
export async function syncDepartmentDelete(
  tenantId: string,
  departmentName: string
) {
  const orgUnit = await prisma.org_units.findFirst({
    where: { tenantId, name: departmentName },
  });

  if (!orgUnit) return;

  // メンバーが所属していれば無効化、いなければ削除
  const memberCount = await prisma.users.count({
    where: { tenantId, unitId: orgUnit.id },
  });

  if (memberCount > 0) {
    await prisma.org_units.update({
      where: { id: orgUnit.id },
      data: { isActive: false, updatedAt: new Date() },
    });
  } else {
    await prisma.org_units.delete({
      where: { id: orgUnit.id },
    });
  }
}
