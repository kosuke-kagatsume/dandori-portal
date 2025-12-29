import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantId,
  validateRequiredFields,
} from '@/lib/api/api-helpers';

/**
 * GET /api/attendance-master/leave-types - 休暇種別一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const category = searchParams.get('category');

    const where: { tenantId: string; isActive?: boolean; category?: string } = { tenantId };
    if (activeOnly) where.isActive = true;
    if (category) where.category = category;

    const leaveTypes = await prisma.leave_types.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return successResponse({ leaveTypes }, { count: leaveTypes.length });
  } catch (error) {
    return handleApiError(error, '休暇種別一覧の取得');
  }
}

/**
 * POST /api/attendance-master/leave-types - 休暇種別作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    const validation = validateRequiredFields(body, ['name', 'code', 'category']);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    // コード重複チェック
    const existing = await prisma.leave_types.findFirst({
      where: { tenantId, code: body.code },
    });
    if (existing) {
      return errorResponse('このコードは既に使用されています', 409);
    }

    const leaveType = await prisma.leave_types.create({
      data: {
        id: `lt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        name: body.name,
        code: body.code,
        description: body.description || null,
        category: body.category,
        isPaid: body.isPaid ?? true,
        defaultDays: body.defaultDays ?? 0,
        maxCarryoverDays: body.maxCarryoverDays ?? 0,
        carryoverMonths: body.carryoverMonths ?? 0,
        minRequestDays: body.minRequestDays ?? 0.5,
        requiresApproval: body.requiresApproval ?? true,
        requiresDocument: body.requiresDocument ?? false,
        documentTypes: body.documentTypes || [],
        allowHalfDay: body.allowHalfDay ?? true,
        allowHourly: body.allowHourly ?? false,
        isLegalLeave: body.isLegalLeave ?? false,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ?? 0,
        updatedAt: new Date(),
      },
    });

    return successResponse({ leaveType }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '休暇種別の作成');
  }
}

/**
 * PATCH /api/attendance-master/leave-types - 休暇種別更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.leave_types.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('休暇種別が見つかりません', 404);
    }

    // コード変更時の重複チェック
    if (body.code && body.code !== existing.code) {
      const duplicate = await prisma.leave_types.findFirst({
        where: { tenantId, code: body.code, id: { not: id } },
      });
      if (duplicate) {
        return errorResponse('このコードは既に使用されています', 409);
      }
    }

    const leaveType = await prisma.leave_types.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return successResponse({ leaveType });
  } catch (error) {
    return handleApiError(error, '休暇種別の更新');
  }
}

/**
 * DELETE /api/attendance-master/leave-types - 休暇種別削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.leave_types.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('休暇種別が見つかりません', 404);
    }

    // 法定休暇は削除不可
    if (existing.isLegalLeave) {
      return errorResponse('法定休暇は削除できません', 400);
    }

    await prisma.leave_types.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '休暇種別の削除');
  }
}
