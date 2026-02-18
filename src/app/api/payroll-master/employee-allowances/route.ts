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
 * GET /api/payroll-master/employee-allowances - 従業員手当設定一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
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

    const allowances = await prisma.employee_allowances.findMany({
      where,
      orderBy: [{ userId: 'asc' }, { allowanceCode: 'asc' }, { effectiveFrom: 'desc' }],
    });

    // 手当種別名を取得
    const codes = Array.from(new Set(allowances.map((a) => a.allowanceCode)));
    const allowanceTypes = await prisma.allowance_types.findMany({
      where: { tenantId, code: { in: codes } },
      select: { code: true, name: true },
    });
    const typeMap = new Map(allowanceTypes.map((t) => [t.code, t.name]));

    const enrichedAllowances = allowances.map((a) => ({
      ...a,
      allowanceName: typeMap.get(a.allowanceCode) || a.allowanceCode,
    }));

    return successResponse({ allowances: enrichedAllowances }, { count: enrichedAllowances.length });
  } catch (error) {
    return handleApiError(error, '従業員手当設定の取得');
  }
}

/**
 * POST /api/payroll-master/employee-allowances - 従業員手当設定作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);

    const validation = validateRequiredFields(body, ['userId', 'allowanceCode', 'amount', 'effectiveFrom']);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    const effectiveFrom = new Date(body.effectiveFrom);

    // 手当種別の存在チェック
    const allowanceType = await prisma.allowance_types.findFirst({
      where: { tenantId, code: body.allowanceCode },
    });
    if (!allowanceType) {
      return errorResponse('手当種別が見つかりません', 404);
    }

    // 同一ユーザー・手当コード・適用開始日の重複チェック
    const existing = await prisma.employee_allowances.findFirst({
      where: {
        tenantId,
        userId: body.userId,
        allowanceCode: body.allowanceCode,
        effectiveFrom,
      },
    });
    if (existing) {
      return errorResponse('この手当設定は既に存在します', 409);
    }

    const allowance = await prisma.employee_allowances.create({
      data: {
        id: `ea-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        userId: body.userId,
        allowanceCode: body.allowanceCode,
        amount: body.amount,
        effectiveFrom,
        effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : null,
        notes: body.notes || null,
        isActive: body.isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return successResponse({ allowance }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '従業員手当設定の作成');
  }
}

/**
 * PATCH /api/payroll-master/employee-allowances - 従業員手当設定更新
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

    const existing = await prisma.employee_allowances.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('従業員手当設定が見つかりません', 404);
    }

    const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.effectiveFrom) updateData.effectiveFrom = new Date(body.effectiveFrom);
    if (body.effectiveTo) updateData.effectiveTo = new Date(body.effectiveTo);

    const allowance = await prisma.employee_allowances.update({
      where: { id },
      data: updateData,
    });

    return successResponse({ allowance });
  } catch (error) {
    return handleApiError(error, '従業員手当設定の更新');
  }
}

/**
 * DELETE /api/payroll-master/employee-allowances - 従業員手当設定削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.employee_allowances.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('従業員手当設定が見つかりません', 404);
    }

    await prisma.employee_allowances.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '従業員手当設定の削除');
  }
}
