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
 * GET /api/payroll-master/employee-deductions - 従業員控除設定一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const userId = searchParams.get('userId');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const asOfDate = searchParams.get('asOfDate');

    const where: {
      tenantId: string;
      userId?: string;
      isActive?: boolean;
      effectiveFrom?: { lte: Date };
      OR?: Array<{ effectiveTo: null } | { effectiveTo: { gte: Date } }>;
    } = { tenantId };

    if (userId) where.userId = userId;
    if (activeOnly) where.isActive = true;

    if (asOfDate) {
      const targetDate = new Date(asOfDate);
      where.effectiveFrom = { lte: targetDate };
      where.OR = [
        { effectiveTo: null },
        { effectiveTo: { gte: targetDate } },
      ];
    }

    const deductions = await prisma.employee_deductions.findMany({
      where,
      orderBy: [{ userId: 'asc' }, { deductionCode: 'asc' }, { effectiveFrom: 'desc' }],
    });

    // 控除種別名を取得
    const codes = Array.from(new Set(deductions.map((d) => d.deductionCode)));
    const deductionTypes = await prisma.deduction_types.findMany({
      where: { tenantId, code: { in: codes } },
      select: { code: true, name: true },
    });
    const typeMap = new Map(deductionTypes.map((t) => [t.code, t.name]));

    const enrichedDeductions = deductions.map((d) => ({
      ...d,
      deductionName: typeMap.get(d.deductionCode) || d.deductionCode,
    }));

    return successResponse({ deductions: enrichedDeductions }, { count: enrichedDeductions.length });
  } catch (error) {
    return handleApiError(error, '従業員控除設定の取得');
  }
}

/**
 * POST /api/payroll-master/employee-deductions - 従業員控除設定作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    const validation = validateRequiredFields(body, ['userId', 'deductionCode', 'amount', 'effectiveFrom']);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    const effectiveFrom = new Date(body.effectiveFrom);

    // 控除種別の存在チェック
    const deductionType = await prisma.deduction_types.findFirst({
      where: { tenantId, code: body.deductionCode },
    });
    if (!deductionType) {
      return errorResponse('控除種別が見つかりません', 404);
    }

    // 同一ユーザー・控除コード・適用開始日の重複チェック
    const existing = await prisma.employee_deductions.findFirst({
      where: {
        tenantId,
        userId: body.userId,
        deductionCode: body.deductionCode,
        effectiveFrom,
      },
    });
    if (existing) {
      return errorResponse('この控除設定は既に存在します', 409);
    }

    const deduction = await prisma.employee_deductions.create({
      data: {
        id: `ed-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        userId: body.userId,
        deductionCode: body.deductionCode,
        amount: body.amount,
        effectiveFrom,
        effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : null,
        notes: body.notes || null,
        isActive: body.isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return successResponse({ deduction }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '従業員控除設定の作成');
  }
}

/**
 * PATCH /api/payroll-master/employee-deductions - 従業員控除設定更新
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

    const existing = await prisma.employee_deductions.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('従業員控除設定が見つかりません', 404);
    }

    const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.effectiveFrom) updateData.effectiveFrom = new Date(body.effectiveFrom);
    if (body.effectiveTo) updateData.effectiveTo = new Date(body.effectiveTo);

    const deduction = await prisma.employee_deductions.update({
      where: { id },
      data: updateData,
    });

    return successResponse({ deduction });
  } catch (error) {
    return handleApiError(error, '従業員控除設定の更新');
  }
}

/**
 * DELETE /api/payroll-master/employee-deductions - 従業員控除設定削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.employee_deductions.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('従業員控除設定が見つかりません', 404);
    }

    await prisma.employee_deductions.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '従業員控除設定の削除');
  }
}
