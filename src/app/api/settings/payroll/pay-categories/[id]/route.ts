import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

/**
 * PATCH /api/settings/payroll/pay-categories/[id] - 給与カテゴリ更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    const existing = await prisma.pay_categories.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('給与カテゴリが見つかりません', 404);
    }

    // コード変更時の重複チェック
    if (body.code && body.code !== existing.code) {
      const duplicate = await prisma.pay_categories.findFirst({
        where: { tenantId, code: body.code, id: { not: id } },
      });
      if (duplicate) {
        return errorResponse('このコードは既に使用されています', 409);
      }
    }

    const item = await prisma.pay_categories.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return successResponse({ item });
  } catch (error) {
    return handleApiError(error, '給与カテゴリの更新');
  }
}

/**
 * DELETE /api/settings/payroll/pay-categories/[id] - 給与カテゴリ削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);

    const existing = await prisma.pay_categories.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('給与カテゴリが見つかりません', 404);
    }

    await prisma.pay_categories.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '給与カテゴリの削除');
  }
}
