import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

/**
 * PATCH /api/settings/payroll/closing-day-groups/[id] - 締め日グループ更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    const existing = await prisma.closing_day_groups.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('締め日グループが見つかりません', 404);
    }

    // 名前変更時の重複チェック
    if (body.name && body.name !== existing.name) {
      const duplicate = await prisma.closing_day_groups.findFirst({
        where: { tenantId, name: body.name, id: { not: id } },
      });
      if (duplicate) {
        return errorResponse('このグループ名は既に使用されています', 409);
      }
    }

    const item = await prisma.closing_day_groups.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return successResponse({ item });
  } catch (error) {
    return handleApiError(error, '締め日グループの更新');
  }
}

/**
 * DELETE /api/settings/payroll/closing-day-groups/[id] - 締め日グループ削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);

    const existing = await prisma.closing_day_groups.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('締め日グループが見つかりません', 404);
    }

    await prisma.closing_day_groups.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '締め日グループの削除');
  }
}
