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
 * GET /api/payroll-master/employee-salary-settings - 従業員給与設定一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const userId = searchParams.get('userId');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const asOfDate = searchParams.get('asOfDate'); // 特定日時点の有効設定を取得

    const where: {
      tenantId: string;
      userId?: string;
      isActive?: boolean;
      effectiveFrom?: { lte: Date };
      OR?: Array<{ effectiveTo: null } | { effectiveTo: { gte: Date } }>;
    } = { tenantId };

    if (userId) where.userId = userId;
    if (activeOnly) where.isActive = true;

    // 特定日時点の設定を取得
    if (asOfDate) {
      const targetDate = new Date(asOfDate);
      where.effectiveFrom = { lte: targetDate };
      where.OR = [
        { effectiveTo: null },
        { effectiveTo: { gte: targetDate } },
      ];
    }

    const settings = await prisma.employee_salary_settings.findMany({
      where,
      orderBy: [{ userId: 'asc' }, { effectiveFrom: 'desc' }],
    });

    // ユーザー情報を結合
    const userIds = Array.from(new Set(settings.map((s) => s.userId)));
    const users = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, department: true, position: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedSettings = settings.map((s) => ({
      ...s,
      user: userMap.get(s.userId) || null,
    }));

    return successResponse({ settings: enrichedSettings }, { count: enrichedSettings.length });
  } catch (error) {
    return handleApiError(error, '従業員給与設定の取得');
  }
}

/**
 * POST /api/payroll-master/employee-salary-settings - 従業員給与設定作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    const validation = validateRequiredFields(body, ['userId', 'effectiveFrom', 'basicSalary']);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    const effectiveFrom = new Date(body.effectiveFrom);

    // ユーザー存在チェック
    const user = await prisma.users.findFirst({
      where: { id: body.userId, tenantId },
    });
    if (!user) {
      return errorResponse('ユーザーが見つかりません', 404);
    }

    // 同一ユーザー・適用開始日の重複チェック
    const existing = await prisma.employee_salary_settings.findFirst({
      where: { tenantId, userId: body.userId, effectiveFrom },
    });
    if (existing) {
      return errorResponse('この適用開始日の設定は既に存在します', 409);
    }

    // 前の設定の終了日を更新
    const previousSetting = await prisma.employee_salary_settings.findFirst({
      where: {
        tenantId,
        userId: body.userId,
        effectiveFrom: { lt: effectiveFrom },
        isActive: true,
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (previousSetting && !previousSetting.effectiveTo) {
      // 前の設定の終了日を新設定の前日に設定
      const endDate = new Date(effectiveFrom);
      endDate.setDate(endDate.getDate() - 1);
      await prisma.employee_salary_settings.update({
        where: { id: previousSetting.id },
        data: { effectiveTo: endDate, updatedAt: new Date() },
      });
    }

    const setting = await prisma.employee_salary_settings.create({
      data: {
        id: `ess-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        userId: body.userId,
        employeeNumber: body.employeeNumber || null,
        effectiveFrom,
        effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : null,
        paymentType: body.paymentType || 'monthly',
        basicSalary: body.basicSalary,
        hourlyRate: body.hourlyRate ?? null,
        dailyRate: body.dailyRate ?? null,
        socialInsuranceGrade: body.socialInsuranceGrade ?? null,
        employmentInsuranceRate: body.employmentInsuranceRate ?? 0.006,
        residentTaxAmount: body.residentTaxAmount ?? 0,
        dependentCount: body.dependentCount ?? 0,
        bankName: body.bankName || null,
        bankBranchName: body.bankBranchName || null,
        bankAccountType: body.bankAccountType || null,
        bankAccountNumber: body.bankAccountNumber || null,
        bankAccountHolder: body.bankAccountHolder || null,
        notes: body.notes || null,
        isActive: body.isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return successResponse({ setting }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '従業員給与設定の作成');
  }
}

/**
 * PATCH /api/payroll-master/employee-salary-settings - 従業員給与設定更新
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

    const existing = await prisma.employee_salary_settings.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('従業員給与設定が見つかりません', 404);
    }

    const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.effectiveFrom) updateData.effectiveFrom = new Date(body.effectiveFrom);
    if (body.effectiveTo) updateData.effectiveTo = new Date(body.effectiveTo);

    const setting = await prisma.employee_salary_settings.update({
      where: { id },
      data: updateData,
    });

    return successResponse({ setting });
  } catch (error) {
    return handleApiError(error, '従業員給与設定の更新');
  }
}

/**
 * DELETE /api/payroll-master/employee-salary-settings - 従業員給与設定削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.employee_salary_settings.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('従業員給与設定が見つかりません', 404);
    }

    await prisma.employee_salary_settings.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '従業員給与設定の削除');
  }
}
