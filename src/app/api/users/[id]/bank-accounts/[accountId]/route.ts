import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/api-helpers';
import { requireUserAccess } from '@/lib/auth/user-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/users/[id]/bank-accounts/[accountId] - 振込口座を更新（本人 or admin/hr）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; accountId: string }> }
) {
  const { id: userId, accountId } = await params;
  const access = await requireUserAccess(request, userId, 'self_or_hr');
  if (access.errorResponse) return access.errorResponse;

  try {
    const tenantId = access.targetUser.tenantId;
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
        ...(body.bankCode !== undefined && { bankCode: body.bankCode ?? null }),
        ...(body.bankName !== undefined && { bankName: body.bankName }),
        ...(body.branchCode !== undefined && { branchCode: body.branchCode ?? null }),
        ...(body.branchName !== undefined && { branchName: body.branchName }),
        ...(body.accountType !== undefined && { accountType: body.accountType }),
        ...(body.accountNumber !== undefined && { accountNumber: body.accountNumber }),
        ...(body.accountHolder !== undefined && { accountHolder: body.accountHolder }),
        ...(body.isPrimary !== undefined && { isPrimary: body.isPrimary }),
        ...(body.transferAmount !== undefined && { transferAmount: body.transferAmount }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
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
  const { id: userId, accountId } = await params;
  const access = await requireUserAccess(request, userId, 'self_or_hr');
  if (access.errorResponse) return access.errorResponse;

  try {
    const tenantId = access.targetUser.tenantId;

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
