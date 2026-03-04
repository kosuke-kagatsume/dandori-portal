import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
  validateRequiredFields,
} from '@/lib/api/api-helpers';

/**
 * GET /api/attendance-master/work-rules - 就業ルール一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: { tenantId: string; isActive?: boolean } = { tenantId };
    if (activeOnly) {
      where.isActive = true;
    }

    const rules = await prisma.work_rules.findMany({
      where,
      include: {
        _count: { select: { users: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const data = rules.map((rule) => ({
      ...rule,
      assignedCount: rule._count.users,
      _count: undefined,
    }));

    return successResponse(data, { count: data.length });
  } catch (error) {
    return handleApiError(error, '就業ルール一覧の取得');
  }
}

/**
 * POST /api/attendance-master/work-rules - 就業ルール作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    const validation = validateRequiredFields(body, ['name', 'type']);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    const rule = await prisma.work_rules.create({
      data: {
        id: `wr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        type: body.type,
        name: body.name,
        standardWorkHours: body.standardWorkHours ?? 480,
        breakMinutes: body.breakMinutes ?? 60,
        workStartTime: body.workStartTime || null,
        workEndTime: body.workEndTime || null,
        coreTimeStart: body.coreTimeStart || null,
        coreTimeEnd: body.coreTimeEnd || null,
        flexTimeStart: body.flexTimeStart || null,
        flexTimeEnd: body.flexTimeEnd || null,
        settings: body.settings || null,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ?? 0,
        updatedAt: new Date(),
      },
    });

    return successResponse(rule, { count: 1 });
  } catch (error) {
    return handleApiError(error, '就業ルールの作成');
  }
}

/**
 * PATCH /api/attendance-master/work-rules - 就業ルール更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.work_rules.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('就業ルールが見つかりません', 404);
    }

    // 安全なフィールドだけを取り出す（tenantId/id/createdAt の上書き防止）
    const safeFields: Record<string, unknown> = { updatedAt: new Date() };
    const allowedKeys = ['type', 'name', 'standardWorkHours', 'breakMinutes', 'workStartTime', 'workEndTime', 'coreTimeStart', 'coreTimeEnd', 'flexTimeStart', 'flexTimeEnd', 'settings', 'isActive', 'sortOrder'];
    for (const key of allowedKeys) {
      if (body[key] !== undefined) safeFields[key] = body[key];
    }

    const rule = await prisma.work_rules.update({
      where: { id },
      data: safeFields,
    });

    return successResponse(rule);
  } catch (error) {
    return handleApiError(error, '就業ルールの更新');
  }
}

/**
 * DELETE /api/attendance-master/work-rules - 就業ルール削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.work_rules.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { users: true } } },
    });
    if (!existing) {
      return errorResponse('就業ルールが見つかりません', 404);
    }

    if (existing._count.users > 0) {
      return errorResponse(
        `${existing._count.users}名の従業員に割り当てられているため削除できません`,
        400
      );
    }

    await prisma.work_rules.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '就業ルールの削除');
  }
}
