/**
 * 従業員同期サービス
 *
 * Dandori Portal ↔ DRM Suite 間の従業員データ同期
 */

import { prisma } from '@/lib/prisma';
import {
  type EmployeeSyncData,
  type EmployeeSyncRequest,
  type EmployeeSyncResponse,
} from './types';
import { sendWebhookToDrm } from './webhook';
import { drmService } from './client';

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * ユーザーデータを同期データに変換
 */
function userToSyncData(user: {
  id: string;
  employeeNumber: string | null;
  name: string;
  nameKana: string | null;
  email: string;
  department: string | null;
  position: string | null;
  hireDate: Date | null;
  retiredDate: Date | null;
  status: string;
  employmentType: string | null;
  roles: string[];
}): EmployeeSyncData {
  return {
    employeeNumber: user.employeeNumber || user.id,
    name: user.name || '',
    nameKana: user.nameKana || undefined,
    email: user.email,
    departmentName: user.department || undefined,
    positionName: user.position || undefined,
    hireDate: user.hireDate?.toISOString().split('T')[0],
    retirementDate: user.retiredDate?.toISOString().split('T')[0],
    status: user.status === 'active' ? 'active' : 'inactive',
    employmentType: user.employmentType || undefined,
    roles: user.roles,
  };
}

// ============================================================
// Portal → DRM 同期（Push）
// ============================================================

/**
 * Portal の従業員データを DRM に同期（プッシュ）
 */
export async function pushEmployeesToDrm(
  tenantId: string,
  options: {
    syncType?: 'full' | 'incremental';
    lastSyncAt?: Date;
    employeeNumbers?: string[];
  } = {}
): Promise<EmployeeSyncResponse> {
  const { syncType = 'full', lastSyncAt, employeeNumbers } = options;

  // 同期対象の従業員を取得
  const whereClause: Record<string, unknown> = { tenantId };

  if (syncType === 'incremental' && lastSyncAt) {
    whereClause.updatedAt = { gte: lastSyncAt };
  }

  if (employeeNumbers && employeeNumbers.length > 0) {
    whereClause.employeeNumber = { in: employeeNumbers };
  }

  const users = await prisma.users.findMany({
    where: whereClause,
  });

  // 同期データに変換
  const employees: EmployeeSyncData[] = users.map(userToSyncData);

  // DRM API に送信
  const request: EmployeeSyncRequest = {
    tenantId,
    employees,
    syncType,
    lastSyncAt: lastSyncAt?.toISOString(),
  };

  const response = await drmService.syncEmployees(request);

  if (!response.success) {
    return {
      success: false,
      syncedCount: 0,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: [{ employeeNumber: '*', error: response.error || 'Unknown error' }],
      syncedAt: new Date().toISOString(),
    };
  }

  return response.data as EmployeeSyncResponse;
}

/**
 * 単一従業員の変更を DRM に通知（Webhook）
 */
export async function notifyEmployeeChange(
  tenantId: string,
  employeeNumber: string,
  changeType: 'created' | 'updated' | 'retired' | 'department_changed'
): Promise<{ success: boolean; error?: string }> {
  // 従業員データを取得
  const user = await prisma.users.findFirst({
    where: { tenantId, employeeNumber },
  });

  if (!user) {
    return { success: false, error: 'Employee not found' };
  }

  const employeeData = userToSyncData(user);

  const eventType = `employee.${changeType}` as const;
  const result = await sendWebhookToDrm(eventType, tenantId, employeeData);

  return result;
}

// ============================================================
// DRM → Portal 同期（Pull）
// ============================================================

/**
 * Portal の従業員データを取得（DRM からの Pull 用）
 */
export async function getEmployeesForSync(
  tenantId: string,
  options: {
    lastSyncAt?: Date;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{
  employees: EmployeeSyncData[];
  total: number;
  hasMore: boolean;
}> {
  const { lastSyncAt, limit = 100, offset = 0 } = options;

  const whereClause: Record<string, unknown> = { tenantId };

  if (lastSyncAt) {
    whereClause.updatedAt = { gte: lastSyncAt };
  }

  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.users.count({ where: whereClause }),
  ]);

  const employees: EmployeeSyncData[] = users.map(userToSyncData);

  return {
    employees,
    total,
    hasMore: offset + users.length < total,
  };
}

/**
 * DRM から従業員データを受信して Portal に反映
 */
export async function receiveEmployeesFromDrm(
  request: EmployeeSyncRequest
): Promise<EmployeeSyncResponse> {
  const { tenantId, employees, syncType } = request;

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors: Array<{ employeeNumber: string; error: string }> = [];

  for (const employee of employees) {
    try {
      // 既存ユーザーを検索
      const existingUser = await prisma.users.findFirst({
        where: {
          tenantId,
          OR: [
            { employeeNumber: employee.employeeNumber },
            { email: employee.email },
          ],
        },
      });

      const userData = {
        name: employee.name,
        nameKana: employee.nameKana || null,
        email: employee.email,
        employeeNumber: employee.employeeNumber,
        department: employee.departmentName || null,
        position: employee.positionName || null,
        hireDate: employee.hireDate ? new Date(employee.hireDate) : null,
        retiredDate: employee.retirementDate
          ? new Date(employee.retirementDate)
          : null,
        status: employee.status === 'active' ? 'active' : 'inactive',
        employmentType: employee.employmentType || null,
        roles: employee.roles || ['employee'],
        updatedAt: new Date(),
      };

      if (existingUser) {
        // 更新
        await prisma.users.update({
          where: { id: existingUser.id },
          data: userData,
        });
        updatedCount++;
      } else if (syncType === 'full') {
        // 新規作成（フル同期時のみ）
        await prisma.users.create({
          data: {
            id: crypto.randomUUID(),
            tenantId,
            ...userData,
            role: (employee.roles?.[0] as string) || 'employee',
            createdAt: new Date(),
          },
        });
        createdCount++;
      } else {
        // インクリメンタル同期で新規ユーザーはスキップ
        skippedCount++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push({
        employeeNumber: employee.employeeNumber,
        error: errorMessage,
      });
    }
  }

  return {
    success: errors.length === 0,
    syncedCount: createdCount + updatedCount,
    createdCount,
    updatedCount,
    skippedCount,
    errors: errors.length > 0 ? errors : undefined,
    syncedAt: new Date().toISOString(),
  };
}

// ============================================================
// 同期状態管理
// ============================================================

/**
 * 最終同期日時を取得
 */
export async function getLastSyncTime(
  _tenantId: string,
  _direction: 'push' | 'pull'
): Promise<Date | null> {
  // メタデータテーブルから取得（将来的に実装）
  // 現在は null を返す
  return null;
}

/**
 * 最終同期日時を更新
 */
export async function updateLastSyncTime(
  _tenantId: string,
  _direction: 'push' | 'pull',
  _syncedAt: Date
): Promise<void> {
  // メタデータテーブルに保存（将来的に実装）
}
