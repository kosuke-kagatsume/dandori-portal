/**
 * 組織同期サービス
 *
 * Dandori Portal ↔ DRM Suite 間の部署・役職データ同期
 */

import { prisma } from '@/lib/prisma';
import {
  type DepartmentSyncData,
  type PositionSyncData,
  type IntegrationApiResponse,
} from './types';
import { sendWebhookToDrm } from './webhook';
import { createDrmClient } from './client';

// ============================================================
// 部署同期
// ============================================================

/**
 * 部署データを同期データに変換
 */
function departmentToSyncData(dept: {
  id: string;
  code: string | null;
  name: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
}): DepartmentSyncData {
  return {
    code: dept.code || dept.id,
    name: dept.name,
    parentCode: dept.parentId || undefined,
    sortOrder: dept.sortOrder,
    isActive: dept.isActive,
  };
}

/**
 * Portal の部署データを取得（DRM からの Pull 用）
 */
export async function getDepartmentsForSync(
  tenantId: string,
  options: {
    lastSyncAt?: Date;
    activeOnly?: boolean;
  } = {}
): Promise<{
  departments: DepartmentSyncData[];
  total: number;
}> {
  const { lastSyncAt, activeOnly = false } = options;

  const whereClause: Record<string, unknown> = { tenantId };

  if (lastSyncAt) {
    whereClause.updatedAt = { gte: lastSyncAt };
  }

  if (activeOnly) {
    whereClause.isActive = true;
  }

  const [departments, total] = await Promise.all([
    prisma.departments.findMany({
      where: whereClause,
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.departments.count({ where: whereClause }),
  ]);

  return {
    departments: departments.map(departmentToSyncData),
    total,
  };
}

/**
 * Portal の部署データを DRM に同期（プッシュ）
 */
export async function pushDepartmentsToDrm(
  tenantId: string,
  options: {
    lastSyncAt?: Date;
    activeOnly?: boolean;
  } = {}
): Promise<IntegrationApiResponse<{ syncedCount: number; syncedAt: string }>> {
  const { departments } = await getDepartmentsForSync(tenantId, options);

  const client = createDrmClient(tenantId);
  const response = await client.post('/departments/sync', {
    tenantId,
    departments,
    syncedAt: new Date().toISOString(),
  });

  return response as IntegrationApiResponse<{ syncedCount: number; syncedAt: string }>;
}

/**
 * DRM から部署データを受信して Portal に反映
 */
export async function receiveDepartmentsFromDrm(
  tenantId: string,
  departments: DepartmentSyncData[]
): Promise<{
  success: boolean;
  createdCount: number;
  updatedCount: number;
  errors?: Array<{ code: string; error: string }>;
}> {
  let createdCount = 0;
  let updatedCount = 0;
  const errors: Array<{ code: string; error: string }> = [];

  for (const dept of departments) {
    try {
      // 既存部署を検索
      const existing = await prisma.departments.findFirst({
        where: {
          tenantId,
          OR: [{ code: dept.code }, { name: dept.name }],
        },
      });

      // 親部署のIDを取得
      let parentId: string | null = null;
      if (dept.parentCode) {
        const parent = await prisma.departments.findFirst({
          where: {
            tenantId,
            OR: [{ code: dept.parentCode }, { id: dept.parentCode }],
          },
        });
        parentId = parent?.id || null;
      }

      const deptData = {
        code: dept.code,
        name: dept.name,
        parentId,
        sortOrder: dept.sortOrder ?? 0,
        isActive: dept.isActive,
        updatedAt: new Date(),
      };

      if (existing) {
        await prisma.departments.update({
          where: { id: existing.id },
          data: deptData,
        });
        updatedCount++;
      } else {
        await prisma.departments.create({
          data: {
            id: crypto.randomUUID(),
            tenantId,
            ...deptData,
            createdAt: new Date(),
          },
        });
        createdCount++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push({ code: dept.code, error: errorMessage });
    }
  }

  return {
    success: errors.length === 0,
    createdCount,
    updatedCount,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * 部署変更を DRM に通知（Webhook）
 */
export async function notifyDepartmentChange(
  tenantId: string,
  departmentId: string,
  changeType: 'created' | 'updated' | 'deleted'
): Promise<{ success: boolean; error?: string }> {
  const dept = await prisma.departments.findUnique({
    where: { id: departmentId },
  });

  if (!dept && changeType !== 'deleted') {
    return { success: false, error: 'Department not found' };
  }

  const eventType = `department.${changeType}` as const;
  const data = dept ? departmentToSyncData(dept) : { code: departmentId };

  return sendWebhookToDrm(eventType, tenantId, data);
}

// ============================================================
// 役職同期
// ============================================================

/**
 * 役職データを同期データに変換
 */
function positionToSyncData(pos: {
  id: string;
  name: string;
  level: number;
  sortOrder: number;
  isActive: boolean;
}): PositionSyncData {
  return {
    code: pos.id,
    name: pos.name,
    level: pos.level,
    sortOrder: pos.sortOrder,
    isActive: pos.isActive,
  };
}

/**
 * Portal の役職データを取得（DRM からの Pull 用）
 */
export async function getPositionsForSync(
  tenantId: string,
  options: {
    lastSyncAt?: Date;
    activeOnly?: boolean;
  } = {}
): Promise<{
  positions: PositionSyncData[];
  total: number;
}> {
  const { lastSyncAt, activeOnly = false } = options;

  const whereClause: Record<string, unknown> = { tenantId };

  if (lastSyncAt) {
    whereClause.updatedAt = { gte: lastSyncAt };
  }

  if (activeOnly) {
    whereClause.isActive = true;
  }

  const [positions, total] = await Promise.all([
    prisma.positions.findMany({
      where: whereClause,
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.positions.count({ where: whereClause }),
  ]);

  return {
    positions: positions.map(positionToSyncData),
    total,
  };
}

/**
 * Portal の役職データを DRM に同期（プッシュ）
 */
export async function pushPositionsToDrm(
  tenantId: string,
  options: {
    lastSyncAt?: Date;
    activeOnly?: boolean;
  } = {}
): Promise<IntegrationApiResponse<{ syncedCount: number; syncedAt: string }>> {
  const { positions } = await getPositionsForSync(tenantId, options);

  const client = createDrmClient(tenantId);
  const response = await client.post('/positions/sync', {
    tenantId,
    positions,
    syncedAt: new Date().toISOString(),
  });

  return response as IntegrationApiResponse<{ syncedCount: number; syncedAt: string }>;
}

/**
 * DRM から役職データを受信して Portal に反映
 */
export async function receivePositionsFromDrm(
  tenantId: string,
  positions: PositionSyncData[]
): Promise<{
  success: boolean;
  createdCount: number;
  updatedCount: number;
  errors?: Array<{ code: string; error: string }>;
}> {
  let createdCount = 0;
  let updatedCount = 0;
  const errors: Array<{ code: string; error: string }> = [];

  for (const pos of positions) {
    try {
      // 既存役職を検索
      const existing = await prisma.positions.findFirst({
        where: {
          tenantId,
          OR: [{ id: pos.code }, { name: pos.name }],
        },
      });

      const posData = {
        name: pos.name,
        level: pos.level ?? 1,
        sortOrder: pos.sortOrder ?? 0,
        isActive: pos.isActive,
        updatedAt: new Date(),
      };

      if (existing) {
        await prisma.positions.update({
          where: { id: existing.id },
          data: posData,
        });
        updatedCount++;
      } else {
        await prisma.positions.create({
          data: {
            id: pos.code || crypto.randomUUID(),
            tenantId,
            ...posData,
            createdAt: new Date(),
          },
        });
        createdCount++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push({ code: pos.code, error: errorMessage });
    }
  }

  return {
    success: errors.length === 0,
    createdCount,
    updatedCount,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * 役職変更を DRM に通知（Webhook）
 */
export async function notifyPositionChange(
  tenantId: string,
  positionId: string,
  changeType: 'created' | 'updated'
): Promise<{ success: boolean; error?: string }> {
  const pos = await prisma.positions.findUnique({
    where: { id: positionId },
  });

  if (!pos) {
    return { success: false, error: 'Position not found' };
  }

  const eventType = `position.${changeType}` as const;
  return sendWebhookToDrm(eventType, tenantId, positionToSyncData(pos));
}
