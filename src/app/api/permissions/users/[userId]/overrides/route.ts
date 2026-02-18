import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
  errorResponse,
} from '@/lib/api/api-helpers';

// GET /api/permissions/users/[userId]/overrides - オーバーライド取得
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    const overrides = await prisma.user_permission_overrides.findMany({
      where: { tenantId, userId: params.userId },
      include: {
        permissions: true,
        roles: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(overrides, { count: overrides.length });
  } catch (error) {
    return handleApiError(error, 'オーバーライド取得');
  }
}

// POST /api/permissions/users/[userId]/overrides - オーバーライド追加
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    const { permissionId, overrideType, reason, grantedBy, roleId, expiresAt } = body;

    if (!permissionId || !overrideType || !grantedBy) {
      return errorResponse('permissionId, overrideType, grantedBy は必須です', 400);
    }

    if (!['grant', 'revoke'].includes(overrideType)) {
      return errorResponse('overrideType は grant または revoke を指定してください', 400);
    }

    const override = await prisma.user_permission_overrides.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        userId: params.userId,
        permissionId,
        roleId: roleId || null,
        overrideType,
        reason: reason || null,
        grantedBy,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        permissions: true,
      },
    });

    return successResponse(override);
  } catch (error) {
    return handleApiError(error, 'オーバーライド追加');
  }
}
