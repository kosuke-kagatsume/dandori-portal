import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
  errorResponse,
} from '@/lib/api/api-helpers';

// GET /api/permissions/roles - ロール一覧
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);

    const roles = await prisma.roles.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { role_permissions: true } },
      },
    });

    return successResponse(roles, { count: roles.length });
  } catch (error) {
    return handleApiError(error, 'ロール一覧取得');
  }
}

// POST /api/permissions/roles - カスタムロール作成
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    const { code, name, description, color } = body;
    if (!code || !name) {
      return errorResponse('code と name は必須です', 400);
    }

    const role = await prisma.roles.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        code,
        name,
        description: description || null,
        isSystem: false,
        isActive: true,
        sortOrder: body.sortOrder || 100,
        color: color || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return successResponse(role);
  } catch (error) {
    return handleApiError(error, 'カスタムロール作成');
  }
}
