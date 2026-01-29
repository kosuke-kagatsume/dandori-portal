import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
} from '@/lib/api/api-helpers';

// GET /api/permissions/master - 権限マスタ一覧
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // menu | feature
    const resource = searchParams.get('resource');

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (resource) where.resource = resource;

    const permissions = await prisma.permissions.findMany({
      where,
      orderBy: [{ resource: 'asc' }, { action: 'asc' }, { scope: 'asc' }],
    });

    return successResponse(permissions, { count: permissions.length, cacheSeconds: 300 });
  } catch (error) {
    return handleApiError(error, '権限マスタ取得');
  }
}
