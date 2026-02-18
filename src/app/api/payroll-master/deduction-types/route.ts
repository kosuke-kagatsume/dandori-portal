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
 * GET /api/payroll-master/deduction-types - 控除種別一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const category = searchParams.get('category'); // social_insurance, tax, other

    const where: { tenantId: string; isActive?: boolean; deductionCategory?: string } = { tenantId };
    if (activeOnly) where.isActive = true;
    if (category) where.deductionCategory = category;

    const deductionTypes = await prisma.deduction_types.findMany({
      where,
      orderBy: [{ deductionCategory: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    return successResponse({ deductionTypes }, { count: deductionTypes.length });
  } catch (error) {
    return handleApiError(error, '控除種別一覧の取得');
  }
}

/**
 * POST /api/payroll-master/deduction-types - 控除種別作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
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

    const deductionType = await prisma.deduction_types.create({
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

    return successResponse({ deductionType }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '控除種別の作成');
  }
}

/**
 * PATCH /api/payroll-master/deduction-types - 控除種別更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.deduction_types.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('控除種別が見つかりません', 404);
    }

    // コード変更時の重複チェック
    if (body.code && body.code !== existing.code) {
      const duplicate = await prisma.deduction_types.findFirst({
        where: { tenantId, code: body.code, id: { not: id } },
      });
      if (duplicate) {
        return errorResponse('このコードは既に使用されています', 409);
      }
    }

    const deductionType = await prisma.deduction_types.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return successResponse({ deductionType });
  } catch (error) {
    return handleApiError(error, '控除種別の更新');
  }
}

/**
 * DELETE /api/payroll-master/deduction-types - 控除種別削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.deduction_types.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('控除種別が見つかりません', 404);
    }

    await prisma.deduction_types.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '控除種別の削除');
  }
}
