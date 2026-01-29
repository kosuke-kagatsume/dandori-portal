import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  errorResponse,
} from '@/lib/api/api-helpers';

// GET /api/permissions/roles/[id]/permissions - ロールの権限取得
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rolePermissions = await prisma.role_permissions.findMany({
      where: { roleId: params.id },
      include: {
        permissions: true,
      },
    });

    const permissionList = rolePermissions.map((rp) => rp.permissions);

    return successResponse(permissionList, { count: permissionList.length });
  } catch (error) {
    return handleApiError(error, 'ロール権限取得');
  }
}

// PUT /api/permissions/roles/[id]/permissions - ロールの権限一括更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { permissionIds } = body as { permissionIds: string[] };

    if (!Array.isArray(permissionIds)) {
      return errorResponse('permissionIds は配列で指定してください', 400);
    }

    const role = await prisma.roles.findUnique({ where: { id: params.id } });
    if (!role) {
      return errorResponse('ロールが見つかりません', 404);
    }

    // トランザクションで既存を全削除→再作成
    await prisma.$transaction(async (tx) => {
      await tx.role_permissions.deleteMany({ where: { roleId: params.id } });

      if (permissionIds.length > 0) {
        await tx.role_permissions.createMany({
          data: permissionIds.map((permissionId) => ({
            id: crypto.randomUUID(),
            roleId: params.id,
            permissionId,
            createdAt: new Date(),
          })),
        });
      }
    });

    // 更新後の権限を返す
    const updated = await prisma.role_permissions.findMany({
      where: { roleId: params.id },
      include: { permissions: true },
    });

    return successResponse(updated.map((rp) => rp.permissions));
  } catch (error) {
    return handleApiError(error, 'ロール権限一括更新');
  }
}
