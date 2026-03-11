import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

/**
 * PATCH /api/settings/payroll/municipalities/[id] - 市区町村更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    const existing = await prisma.municipalities.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('市区町村が見つかりません', 404);
    }

    // コード変更時の重複チェック
    if (body.code && body.code !== existing.code) {
      const duplicate = await prisma.municipalities.findFirst({
        where: { tenantId, code: body.code, id: { not: id } },
      });
      if (duplicate) {
        return errorResponse('この市区町村コードは既に使用されています', 409);
      }
    }

    const item = await prisma.municipalities.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return successResponse({ item });
  } catch (error) {
    return handleApiError(error, '市区町村の更新');
  }
}

/**
 * DELETE /api/settings/payroll/municipalities/[id] - 市区町村削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);

    const existing = await prisma.municipalities.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('市区町村が見つかりません', 404);
    }

    await prisma.municipalities.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '市区町村の削除');
  }
}
