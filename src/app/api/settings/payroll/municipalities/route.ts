import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
  validateRequiredFields,
} from '@/lib/api/api-helpers';

/**
 * GET /api/settings/payroll/municipalities - 市区町村一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const prefecture = searchParams.get('prefecture');

    const where: { tenantId: string; isActive?: boolean; prefectureName?: string } = {
      tenantId,
    };
    if (activeOnly) where.isActive = true;
    if (prefecture) where.prefectureName = prefecture;

    const items = await prisma.municipalities.findMany({
      where,
      orderBy: [{ prefectureName: 'asc' }, { code: 'asc' }],
    });

    return successResponse(items, { count: items.length });
  } catch (error) {
    return handleApiError(error, '市区町村一覧の取得');
  }
}

/**
 * POST /api/settings/payroll/municipalities - 市区町村作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    const validation = validateRequiredFields(body, ['code', 'name', 'prefectureName']);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    // コード重複チェック
    const existing = await prisma.municipalities.findFirst({
      where: { tenantId, code: body.code },
    });
    if (existing) {
      return errorResponse('この市区町村コードは既に使用されています', 409);
    }

    const item = await prisma.municipalities.create({
      data: {
        id: `mun-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        code: body.code,
        name: body.name,
        prefectureName: body.prefectureName,
        isActive: body.isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return successResponse({ item }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '市区町村の作成');
  }
}
