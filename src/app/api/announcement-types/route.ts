import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantId,
} from '@/lib/api/api-helpers';

/**
 * GET /api/announcement-types - アナウンス種別一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: { tenantId: string; isActive?: boolean } = { tenantId };
    if (!includeInactive) {
      where.isActive = true;
    }

    const types = await prisma.announcement_types.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });

    return successResponse({ types }, { count: types.length });
  } catch (error) {
    return handleApiError(error, 'アナウンス種別一覧の取得');
  }
}

/**
 * POST /api/announcement-types - アナウンス種別作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    const { code, name, description, color, icon, sortOrder } = body;

    if (!code || !name) {
      return errorResponse('codeとnameは必須です', 400);
    }

    // 重複チェック
    const existing = await prisma.announcement_types.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
    if (existing) {
      return errorResponse('このコードは既に使用されています', 400);
    }

    const type = await prisma.announcement_types.create({
      data: {
        id: `at-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        code,
        name,
        description: description || null,
        color: color || '#3B82F6',
        icon: icon || null,
        sortOrder: sortOrder ?? 0,
        isActive: true,
        isSystem: false,
        updatedAt: new Date(),
      },
    });

    return successResponse({ type }, { count: 1 });
  } catch (error) {
    return handleApiError(error, 'アナウンス種別の作成');
  }
}

/**
 * PATCH /api/announcement-types - アナウンス種別更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.announcement_types.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('アナウンス種別が見つかりません', 404);
    }

    // コード変更時の重複チェック
    if (body.code && body.code !== existing.code) {
      const duplicate = await prisma.announcement_types.findUnique({
        where: { tenantId_code: { tenantId, code: body.code } },
      });
      if (duplicate) {
        return errorResponse('このコードは既に使用されています', 400);
      }
    }

    const type = await prisma.announcement_types.update({
      where: { id },
      data: {
        code: body.code ?? existing.code,
        name: body.name ?? existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        color: body.color ?? existing.color,
        icon: body.icon !== undefined ? body.icon : existing.icon,
        sortOrder: body.sortOrder ?? existing.sortOrder,
        isActive: body.isActive ?? existing.isActive,
        updatedAt: new Date(),
      },
    });

    return successResponse({ type });
  } catch (error) {
    return handleApiError(error, 'アナウンス種別の更新');
  }
}

/**
 * DELETE /api/announcement-types - アナウンス種別削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.announcement_types.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('アナウンス種別が見つかりません', 404);
    }

    // システム定義は削除不可
    if (existing.isSystem) {
      return errorResponse('システム定義のアナウンス種別は削除できません', 400);
    }

    await prisma.announcement_types.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'アナウンス種別の削除');
  }
}
