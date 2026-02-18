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
 * GET /api/payroll-master/salary-items - 給与項目一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const category = searchParams.get('category'); // earning or deduction
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: { tenantId: string; category?: string; isActive?: boolean } = { tenantId };
    if (category) where.category = category;
    if (activeOnly) where.isActive = true;

    const items = await prisma.salary_items.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    return successResponse({ items }, { count: items.length });
  } catch (error) {
    return handleApiError(error, '給与項目一覧の取得');
  }
}

/**
 * POST /api/payroll-master/salary-items - 給与項目作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    const validation = validateRequiredFields(body, ['code', 'name', 'category', 'itemType']);
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
        category: body.category,
        itemType: body.itemType,
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
    return handleApiError(error, '給与項目の作成');
  }
}

/**
 * PATCH /api/payroll-master/salary-items - 給与項目更新
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

    const existing = await prisma.salary_items.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('給与項目が見つかりません', 404);
    }

    // コード変更時の重複チェック
    if (body.code && body.code !== existing.code) {
      const duplicate = await prisma.salary_items.findFirst({
        where: { tenantId, code: body.code, id: { not: id } },
      });
      if (duplicate) {
        return errorResponse('このコードは既に使用されています', 409);
      }
    }

    const item = await prisma.salary_items.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return successResponse({ item });
  } catch (error) {
    return handleApiError(error, '給与項目の更新');
  }
}

/**
 * DELETE /api/payroll-master/salary-items - 給与項目削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.salary_items.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('給与項目が見つかりません', 404);
    }

    // 必須項目は削除不可
    if (existing.isRequired) {
      return errorResponse('必須項目は削除できません', 400);
    }

    await prisma.salary_items.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '給与項目の削除');
  }
}
