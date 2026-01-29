import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  errorResponse,
} from '@/lib/api/api-helpers';

// PUT /api/permissions/roles/[id] - ロール更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const existing = await prisma.roles.findUnique({ where: { id: params.id } });

    if (!existing) {
      return errorResponse('ロールが見つかりません', 404);
    }

    const role = await prisma.roles.update({
      where: { id: params.id },
      data: {
        name: body.name ?? existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
        sortOrder: body.sortOrder ?? existing.sortOrder,
        color: body.color !== undefined ? body.color : existing.color,
        updatedAt: new Date(),
      },
    });

    return successResponse(role);
  } catch (error) {
    return handleApiError(error, 'ロール更新');
  }
}

// DELETE /api/permissions/roles/[id] - カスタムロール削除
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.roles.findUnique({ where: { id: params.id } });

    if (!existing) {
      return errorResponse('ロールが見つかりません', 404);
    }

    if (existing.isSystem) {
      return errorResponse('システムロールは削除できません', 403);
    }

    // 関連する role_permissions も Cascade で削除される
    await prisma.roles.delete({ where: { id: params.id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'ロール削除');
  }
}
