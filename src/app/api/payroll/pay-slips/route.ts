import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
  getPaginationParams,
} from '@/lib/api/api-helpers';

/**
 * GET /api/payroll/pay-slips - 給与明細一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const userId = searchParams.get('userId');
    const payPeriod = searchParams.get('payPeriod');
    const status = searchParams.get('status');
    const yearMonth = searchParams.get('yearMonth'); // YYYY-MM形式で月指定

    const where: {
      tenantId: string;
      userId?: string;
      payPeriod?: string;
      status?: string;
    } = { tenantId };

    if (userId) where.userId = userId;
    if (payPeriod) where.payPeriod = payPeriod;
    if (status) where.status = status;
    if (yearMonth) where.payPeriod = yearMonth;

    const [paySlips, total] = await Promise.all([
      prisma.pay_slips.findMany({
        where,
        orderBy: [{ payPeriod: 'desc' }, { userId: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.pay_slips.count({ where }),
    ]);

    // ユーザー情報を結合
    const userIds = Array.from(new Set(paySlips.map((p) => p.userId)));
    const users = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, department: true, position: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedSlips = paySlips.map((p) => ({
      ...p,
      user: userMap.get(p.userId) || null,
    }));

    return successResponse(
      { paySlips: enrichedSlips },
      {
        count: enrichedSlips.length,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    return handleApiError(error, '給与明細一覧の取得');
  }
}

/**
 * POST /api/payroll/pay-slips - 給与明細作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);

    if (!body.userId || !body.payPeriod || !body.paymentDate) {
      return errorResponse('userId, payPeriod, paymentDateは必須です', 400);
    }

    // 同一ユーザー・期間の重複チェック
    const existing = await prisma.pay_slips.findFirst({
      where: { tenantId, userId: body.userId, payPeriod: body.payPeriod },
    });
    if (existing) {
      return errorResponse('この期間の給与明細は既に存在します', 409);
    }

    const paySlip = await prisma.pay_slips.create({
      data: {
        id: `ps-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        userId: body.userId,
        payPeriod: body.payPeriod,
        paymentDate: new Date(body.paymentDate),
        basicSalary: body.basicSalary ?? 0,
        positionAllowance: body.positionAllowance ?? 0,
        overtimeAllowance: body.overtimeAllowance ?? 0,
        lateNightAllowance: body.lateNightAllowance ?? 0,
        holidayAllowance: body.holidayAllowance ?? 0,
        commuteAllowance: body.commuteAllowance ?? 0,
        housingAllowance: body.housingAllowance ?? 0,
        familyAllowance: body.familyAllowance ?? 0,
        qualificationAllowance: body.qualificationAllowance ?? 0,
        otherAllowances: body.otherAllowances ?? 0,
        allowancesJson: body.allowancesJson || null,
        grossPay: body.grossPay ?? 0,
        healthInsurance: body.healthInsurance ?? 0,
        pensionInsurance: body.pensionInsurance ?? 0,
        employmentInsurance: body.employmentInsurance ?? 0,
        incomeTax: body.incomeTax ?? 0,
        residentTax: body.residentTax ?? 0,
        otherDeductions: body.otherDeductions ?? 0,
        deductionsJson: body.deductionsJson || null,
        totalDeductions: body.totalDeductions ?? 0,
        workingDays: body.workingDays ?? 0,
        actualWorkingDays: body.actualWorkingDays ?? 0,
        absenceDays: body.absenceDays ?? 0,
        paidLeaveDays: body.paidLeaveDays ?? 0,
        overtimeHours: body.overtimeHours ?? 0,
        lateNightHours: body.lateNightHours ?? 0,
        holidayWorkHours: body.holidayWorkHours ?? 0,
        netPay: body.netPay ?? 0,
        status: body.status || 'draft',
        notes: body.notes || null,
        updatedAt: new Date(),
      },
    });

    return successResponse({ paySlip }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '給与明細の作成');
  }
}

/**
 * PATCH /api/payroll/pay-slips - 給与明細更新
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

    const existing = await prisma.pay_slips.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('給与明細が見つかりません', 404);
    }

    // 確定済みは更新不可（訂正フラグを立てる必要あり）
    if (existing.status === 'paid' && body.status !== 'corrected') {
      return errorResponse('支払済みの給与明細は更新できません', 400);
    }

    const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.paymentDate) updateData.paymentDate = new Date(body.paymentDate);
    if (body.confirmedAt) updateData.confirmedAt = new Date(body.confirmedAt);
    if (body.paidAt) updateData.paidAt = new Date(body.paidAt);

    const paySlip = await prisma.pay_slips.update({
      where: { id },
      data: updateData,
    });

    return successResponse({ paySlip });
  } catch (error) {
    return handleApiError(error, '給与明細の更新');
  }
}

/**
 * DELETE /api/payroll/pay-slips - 給与明細削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.pay_slips.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('給与明細が見つかりません', 404);
    }

    // 支払済みは削除不可
    if (existing.status === 'paid') {
      return errorResponse('支払済みの給与明細は削除できません', 400);
    }

    await prisma.pay_slips.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '給与明細の削除');
  }
}
