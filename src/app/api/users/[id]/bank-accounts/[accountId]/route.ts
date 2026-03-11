import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError, getTenantIdFromRequest } from '@/lib/api/api-helpers';

/**
 * PATCH /api/users/[id]/bank-accounts/[accountId] - 振込口座を更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; accountId: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { id: userId, accountId } = await params;
    const body = await request.json();

    // 存在確認
    const existing = await prisma.employee_bank_accounts.findFirst({
      where: { id: accountId, tenantId, userId },
    });

    if (!existing) {
      return errorResponse('振込口座が見つかりません', 404);
    }

    // メイン口座に変更する場合、他のメイン口座を解除
    if (body.isPrimary) {
      await prisma.employee_bank_accounts.updateMany({
        where: { tenantId, userId, isPrimary: true, id: { not: accountId } },
        data: { isPrimary: false, updatedAt: new Date() },
      });
    }

    const account = await prisma.employee_bank_accounts.update({
      where: { id: accountId },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return successResponse(account);
  } catch (error) {
    return handleApiError(error, '振込口座の更新');
  }
}

/**
 * DELETE /api/users/[id]/bank-accounts/[accountId] - 振込口座を削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; accountId: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { id: userId, accountId } = await params;

    // 存在確認
    const existing = await prisma.employee_bank_accounts.findFirst({
      where: { id: accountId, tenantId, userId },
    });

    if (!existing) {
      return errorResponse('振込口座が見つかりません', 404);
    }

    await prisma.employee_bank_accounts.delete({
      where: { id: accountId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '振込口座の削除');
  }
}
