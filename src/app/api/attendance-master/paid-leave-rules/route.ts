import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
} from '@/lib/api/api-helpers';

/**
 * GET /api/attendance-master/paid-leave-rules - 有給休暇ルール取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    let rules = await prisma.paid_leave_rules.findUnique({
      where: { tenantId },
    });

    // 存在しない場合はデフォルト値で作成
    if (!rules) {
      rules = await prisma.paid_leave_rules.create({
        data: {
          id: `plr-${tenantId}`,
          tenantId,
          updatedAt: new Date(),
        },
      });
    }

    // 付与テーブルも取得
    const grantTable = await prisma.paid_leave_grant_table.findMany({
      where: { tenantId },
      orderBy: { yearsOfService: 'asc' },
    });

    return successResponse({ rules, grantTable });
  } catch (error) {
    return handleApiError(error, '有給休暇ルールの取得');
  }
}

/**
 * PATCH /api/attendance-master/paid-leave-rules - 有給休暇ルール更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    const rules = await prisma.paid_leave_rules.upsert({
      where: { tenantId },
      create: {
        id: `plr-${tenantId}`,
        tenantId,
        ...body,
        updatedAt: new Date(),
      },
      update: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return successResponse({ rules });
  } catch (error) {
    return handleApiError(error, '有給休暇ルールの更新');
  }
}

/**
 * PUT /api/attendance-master/paid-leave-rules - 付与テーブル更新
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    if (!Array.isArray(body.grantTable)) {
      // 既存のテーブルを全削除して再作成
      await prisma.paid_leave_grant_table.deleteMany({
        where: { tenantId },
      });

      // 法定基準のデフォルトテーブルを作成
      const defaultTable = [
        { yearsOfService: 0.5, grantDays: 10 },
        { yearsOfService: 1.5, grantDays: 11 },
        { yearsOfService: 2.5, grantDays: 12 },
        { yearsOfService: 3.5, grantDays: 14 },
        { yearsOfService: 4.5, grantDays: 16 },
        { yearsOfService: 5.5, grantDays: 18 },
        { yearsOfService: 6.5, grantDays: 20 },
      ];

      for (const row of defaultTable) {
        await prisma.paid_leave_grant_table.create({
          data: {
            id: `plgt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            tenantId,
            yearsOfService: row.yearsOfService,
            grantDays: row.grantDays,
            updatedAt: new Date(),
          },
        });
      }

      const grantTable = await prisma.paid_leave_grant_table.findMany({
        where: { tenantId },
        orderBy: { yearsOfService: 'asc' },
      });

      return successResponse({ grantTable, message: 'デフォルトテーブルを作成しました' });
    }

    // 付与テーブルの更新
    await prisma.paid_leave_grant_table.deleteMany({
      where: { tenantId },
    });

    for (const row of body.grantTable) {
      await prisma.paid_leave_grant_table.create({
        data: {
          id: `plgt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tenantId,
          yearsOfService: row.yearsOfService,
          grantDays: row.grantDays,
          updatedAt: new Date(),
        },
      });
    }

    const grantTable = await prisma.paid_leave_grant_table.findMany({
      where: { tenantId },
      orderBy: { yearsOfService: 'asc' },
    });

    return successResponse({ grantTable });
  } catch (error) {
    return handleApiError(error, '付与テーブルの更新');
  }
}
