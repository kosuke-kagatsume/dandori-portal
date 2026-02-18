import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

/**
 * GET /api/attendance-master/overtime-rules - 残業ルール取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);

    let rules = await prisma.overtime_rules.findUnique({
      where: { tenantId },
    });

    // 存在しない場合はデフォルト値で作成
    if (!rules) {
      rules = await prisma.overtime_rules.create({
        data: {
          id: `or-${tenantId}`,
          tenantId,
          updatedAt: new Date(),
        },
      });
    }

    return successResponse({ rules });
  } catch (error) {
    return handleApiError(error, '残業ルールの取得');
  }
}

/**
 * PATCH /api/attendance-master/overtime-rules - 残業ルール更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);

    const rules = await prisma.overtime_rules.upsert({
      where: { tenantId },
      create: {
        id: `or-${tenantId}`,
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
    return handleApiError(error, '残業ルールの更新');
  }
}
