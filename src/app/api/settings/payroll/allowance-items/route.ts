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
 * GET /api/settings/payroll/allowance-items - 支給項目一覧取得
 * salary_items テーブルから category='earning' のレコードを取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: { tenantId: string; category: string; isActive?: boolean } = {
      tenantId,
      category: 'earning',
    };
    if (activeOnly) where.isActive = true;

    const items = await prisma.salary_items.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return successResponse({ items }, { count: items.length });
  } catch (error) {
    return handleApiError(error, '支給項目一覧の取得');
  }
}

/**
 * POST /api/settings/payroll/allowance-items - 支給項目作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    const validation = validateRequiredFields(body, ['code', 'name']);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    // コード重複チェック
    const existing = await prisma.salary_items.findFirst({
      where: { tenantId, code: body.code },
    });
    if (existing) {
      return errorResponse('このコードは既に使用されています', 409);
    }

    const item = await prisma.salary_items.create({
      data: {
        id: `si-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        code: body.code,
        name: body.name,
        category: 'earning',
        itemType: body.itemType || 'fixed',
        calculationType: body.calculationType || null,
        defaultAmount: body.defaultAmount ?? null,
        isRequired: body.isRequired ?? false,
        isTaxable: body.isTaxable ?? true,
        isInsuranceTarget: body.isInsuranceTarget ?? true,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
        description: body.description || null,
        updatedAt: new Date(),
      },
    });

    return successResponse({ item }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '支給項目の作成');
  }
}
