import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

/**
 * PATCH /api/settings/payroll/allowance-items/[id] - 支給項目更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    const existing = await prisma.salary_items.findFirst({
      where: { id, tenantId, category: 'earning' },
    });
    if (!existing) {
      return errorResponse('支給項目が見つかりません', 404);
    }

    // コード変更時の重複チェック
    if (body.code && body.code !== existing.code) {
      const duplicate = await prisma.salary_items.findFirst({
        where: { tenantId, code: body.code, id: { not: id } },
      });
      if (duplicate) {
        return errorResponse('このコードは既に使用されています', 409);
      }
    }

    const item = await prisma.salary_items.update({
      where: { id },
      data: {
        ...body,
        category: 'earning', // カテゴリ変更を防止
        updatedAt: new Date(),
      },
    });

    return successResponse({ item });
  } catch (error) {
    return handleApiError(error, '支給項目の更新');
  }
}

/**
 * DELETE /api/settings/payroll/allowance-items/[id] - 支給項目削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);

    const existing = await prisma.salary_items.findFirst({
      where: { id, tenantId, category: 'earning' },
    });
    if (!existing) {
      return errorResponse('支給項目が見つかりません', 404);
    }

    if (existing.isRequired) {
      return errorResponse('必須項目は削除できません', 400);
    }

    await prisma.salary_items.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '支給項目の削除');
  }
}
