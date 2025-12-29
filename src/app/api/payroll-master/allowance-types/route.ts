import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantId,
  validateRequiredFields,
} from '@/lib/api/api-helpers';

/**
 * GET /api/payroll-master/allowance-types - 手当種別一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: { tenantId: string; isActive?: boolean } = { tenantId };
    if (activeOnly) where.isActive = true;

    const allowanceTypes = await prisma.allowance_types.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return successResponse({ allowanceTypes }, { count: allowanceTypes.length });
  } catch (error) {
    return handleApiError(error, '手当種別一覧の取得');
  }
}

/**
 * POST /api/payroll-master/allowance-types - 手当種別作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    const validation = validateRequiredFields(body, ['code', 'name']);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    // コード重複チェック
    const existing = await prisma.allowance_types.findFirst({
      where: { tenantId, code: body.code },
    });
    if (existing) {
      return errorResponse('このコードは既に使用されています', 409);
    }

    const allowanceType = await prisma.allowance_types.create({
      data: {
        id: `at-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        code: body.code,
        name: body.name,
        calculationType: body.calculationType || 'fixed',
        defaultAmount: body.defaultAmount ?? null,
        rate: body.rate ?? null,
        formula: body.formula || null,
        isTaxable: body.isTaxable ?? true,
        isInsuranceTarget: body.isInsuranceTarget ?? true,
        isCommuting: body.isCommuting ?? false,
        maxAmount: body.maxAmount ?? null,
        conditions: body.conditions || null,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
        description: body.description || null,
        updatedAt: new Date(),
      },
    });

    return successResponse({ allowanceType }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '手当種別の作成');
  }
}

/**
 * PATCH /api/payroll-master/allowance-types - 手当種別更新
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

    const existing = await prisma.allowance_types.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('手当種別が見つかりません', 404);
    }

    // コード変更時の重複チェック
    if (body.code && body.code !== existing.code) {
      const duplicate = await prisma.allowance_types.findFirst({
        where: { tenantId, code: body.code, id: { not: id } },
      });
      if (duplicate) {
        return errorResponse('このコードは既に使用されています', 409);
      }
    }

    const allowanceType = await prisma.allowance_types.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return successResponse({ allowanceType });
  } catch (error) {
    return handleApiError(error, '手当種別の更新');
  }
}

/**
 * DELETE /api/payroll-master/allowance-types - 手当種別削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.allowance_types.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('手当種別が見つかりません', 404);
    }

    await prisma.allowance_types.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '手当種別の削除');
  }
}
