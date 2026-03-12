import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withDWAdminAuth } from '@/lib/auth/api-auth';
import { createSuccessResponse, handleError, notFoundError } from '@/lib/api/response';

const prisma = new PrismaClient();

/**
 * DW管理 - テナント削除API
 * DELETE /api/dw-admin/tenants/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await withDWAdminAuth();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const { id: tenantId } = await params;

    // テナント存在確認
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
      include: { _count: { select: { users: true } } },
    });

    if (!tenant) {
      return notFoundError('テナント');
    }

    // トランザクションで関連データを含めて削除
    await prisma.$transaction(async (tx) => {
      // 関連データを先に削除（外部キー制約対応）
      // role_permissions はroles経由で削除
      const tenantRoles = await tx.roles.findMany({ where: { tenantId }, select: { id: true } });
      const roleIds = tenantRoles.map(r => r.id);
      if (roleIds.length > 0) {
        await tx.role_permissions.deleteMany({ where: { roleId: { in: roleIds } } });
        await tx.roles.deleteMany({ where: { tenantId } });
      }
      await tx.tenant_settings.deleteMany({ where: { tenantId } });
      await tx.users.deleteMany({ where: { tenantId } });
      await tx.invoices.deleteMany({ where: { tenantId } });

      // テナント本体を削除
      await tx.tenants.delete({ where: { id: tenantId } });
    });

    return createSuccessResponse(
      { id: tenantId, name: tenant.name },
      { message: `テナント「${tenant.name}」を削除しました` }
    );
  } catch (error) {
    return handleError(error, 'テナントの削除');
  }
}
