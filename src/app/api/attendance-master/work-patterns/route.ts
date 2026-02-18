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
 * GET /api/attendance-master/work-patterns - 勤務パターン一覧取得
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

    const patterns = await prisma.work_patterns.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return successResponse({ patterns }, { count: patterns.length });
  } catch (error) {
    return handleApiError(error, '勤務パターン一覧の取得');
  }
}

/**
 * POST /api/attendance-master/work-patterns - 勤務パターン作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);

    const validation = validateRequiredFields(body, ['name', 'code', 'workStartTime', 'workEndTime']);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    // コード重複チェック
    const existing = await prisma.work_patterns.findFirst({
      where: { tenantId, code: body.code },
    });
    if (existing) {
      return errorResponse('このコードは既に使用されています', 409);
    }

    // デフォルトパターンの場合、他のデフォルトを解除
    if (body.isDefault) {
      await prisma.work_patterns.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const pattern = await prisma.work_patterns.create({
      data: {
        id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        name: body.name,
        code: body.code,
        description: body.description || null,
        workStartTime: body.workStartTime,
        workEndTime: body.workEndTime,
        breakStartTime: body.breakStartTime || null,
        breakEndTime: body.breakEndTime || null,
        breakDurationMinutes: body.breakDurationMinutes ?? 60,
        workingMinutes: body.workingMinutes ?? 480,
        isFlexTime: body.isFlexTime ?? false,
        coreTimeStart: body.coreTimeStart || null,
        coreTimeEnd: body.coreTimeEnd || null,
        isNightShift: body.isNightShift ?? false,
        isDefault: body.isDefault ?? false,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ?? 0,
        updatedAt: new Date(),
      },
    });

    return successResponse({ pattern }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '勤務パターンの作成');
  }
}

/**
 * PATCH /api/attendance-master/work-patterns - 勤務パターン更新
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

    const existing = await prisma.work_patterns.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('勤務パターンが見つかりません', 404);
    }

    // コード変更時の重複チェック
    if (body.code && body.code !== existing.code) {
      const duplicate = await prisma.work_patterns.findFirst({
        where: { tenantId, code: body.code, id: { not: id } },
      });
      if (duplicate) {
        return errorResponse('このコードは既に使用されています', 409);
      }
    }

    // デフォルトパターンの場合、他のデフォルトを解除
    if (body.isDefault && !existing.isDefault) {
      await prisma.work_patterns.updateMany({
        where: { tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const pattern = await prisma.work_patterns.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return successResponse({ pattern });
  } catch (error) {
    return handleApiError(error, '勤務パターンの更新');
  }
}

/**
 * DELETE /api/attendance-master/work-patterns - 勤務パターン削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.work_patterns.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('勤務パターンが見つかりません', 404);
    }

    // デフォルトパターンは削除不可
    if (existing.isDefault) {
      return errorResponse('デフォルトパターンは削除できません', 400);
    }

    await prisma.work_patterns.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '勤務パターンの削除');
  }
}
