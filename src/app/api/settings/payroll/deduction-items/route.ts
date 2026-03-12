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
 * GET /api/settings/payroll/deduction-items - 控除項目一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const category = searchParams.get('category'); // social_insurance, tax, other

    const where: { tenantId: string; isActive?: boolean; deductionCategory?: string } = {
      tenantId,
    };
    if (activeOnly) where.isActive = true;
    if (category) where.deductionCategory = category;

    const items = await prisma.deduction_types.findMany({
      where,
      orderBy: [{ deductionCategory: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    return successResponse(items, { count: items.length });
  } catch (error) {
    return handleApiError(error, '控除項目一覧の取得');
  }
}

/**
 * POST /api/settings/payroll/deduction-items - 控除項目作成
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
    const existing = await prisma.deduction_types.findFirst({
      where: { tenantId, code: body.code },
    });
    if (existing) {
      return errorResponse('このコードは既に使用されています', 409);
    }

    const item = await prisma.deduction_types.create({
      data: {
        id: `dt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        code: body.code,
        name: body.name,
        calculationType: body.calculationType || 'fixed',
        deductionCategory: body.deductionCategory || 'other',
        defaultAmount: body.defaultAmount ?? null,
        rate: body.rate ?? null,
        isPreTax: body.isPreTax ?? true,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
        description: body.description || null,
        updatedAt: new Date(),
      },
    });

    return successResponse({ item }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '控除項目の作成');
  }
}
