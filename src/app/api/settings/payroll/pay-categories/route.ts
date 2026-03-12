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
 * GET /api/settings/payroll/pay-categories - 給与カテゴリ一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: { tenantId: string; isActive?: boolean } = { tenantId };
    if (activeOnly) where.isActive = true;

    const items = await prisma.pay_categories.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return successResponse(items, { count: items.length });
  } catch (error) {
    return handleApiError(error, '給与カテゴリ一覧の取得');
  }
}

/**
 * POST /api/settings/payroll/pay-categories - 給与カテゴリ作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    const validation = validateRequiredFields(body, ['name', 'code']);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    // コード重複チェック
    const existing = await prisma.pay_categories.findFirst({
      where: { tenantId, code: body.code },
    });
    if (existing) {
      return errorResponse('このコードは既に使用されています', 409);
    }

    const item = await prisma.pay_categories.create({
      data: {
        id: `pc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        name: body.name,
        code: body.code,
        description: body.description || null,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return successResponse({ item }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '給与カテゴリの作成');
  }
}
