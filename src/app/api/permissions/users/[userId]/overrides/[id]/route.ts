import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  errorResponse,
} from '@/lib/api/api-helpers';

// DELETE /api/permissions/users/[userId]/overrides/[id] - オーバーライド削除
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { userId: string; id: string } }
) {
  try {
    const existing = await prisma.user_permission_overrides.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return errorResponse('オーバーライドが見つかりません', 404);
    }

    if (existing.userId !== params.userId) {
      return errorResponse('ユーザーIDが一致しません', 400);
    }

    await prisma.user_permission_overrides.delete({ where: { id: params.id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'オーバーライド削除');
  }
}
