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
 * GET /api/payroll/bonus-slips - 賞与明細一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const userId = searchParams.get('userId');
    const bonusType = searchParams.get('bonusType'); // summer, winter, special
    const payPeriod = searchParams.get('payPeriod');
    const status = searchParams.get('status');

    const where: {
      tenantId: string;
      userId?: string;
      bonusType?: string;
      payPeriod?: string;
      status?: string;
    } = { tenantId };

    if (userId) where.userId = userId;
    if (bonusType) where.bonusType = bonusType;
    if (payPeriod) where.payPeriod = payPeriod;
    if (status) where.status = status;

    const [bonusSlips, total] = await Promise.all([
      prisma.bonus_slips.findMany({
        where,
        orderBy: [{ payPeriod: 'desc' }, { bonusType: 'asc' }, { userId: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.bonus_slips.count({ where }),
    ]);

    // ユーザー情報を結合
    const userIds = Array.from(new Set(bonusSlips.map((b) => b.userId)));
    const users = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, department: true, position: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedSlips = bonusSlips.map((b) => ({
      ...b,
      user: userMap.get(b.userId) || null,
    }));

    return successResponse(
      { bonusSlips: enrichedSlips },
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
    return handleApiError(error, '賞与明細一覧の取得');
  }
}

/**
 * POST /api/payroll/bonus-slips - 賞与明細作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    if (!body.userId || !body.bonusType || !body.payPeriod || !body.paymentDate) {
      return errorResponse('userId, bonusType, payPeriod, paymentDateは必須です', 400);
    }

    // 同一ユーザー・種別・期間の重複チェック
    const existing = await prisma.bonus_slips.findFirst({
      where: {
        tenantId,
        userId: body.userId,
        bonusType: body.bonusType,
        payPeriod: body.payPeriod,
      },
    });
    if (existing) {
      return errorResponse('この期間の賞与明細は既に存在します', 409);
    }

    const bonusSlip = await prisma.bonus_slips.create({
      data: {
        id: `bs-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        userId: body.userId,
        bonusType: body.bonusType,
        payPeriod: body.payPeriod,
        paymentDate: new Date(body.paymentDate),
        basicBonus: body.basicBonus ?? 0,
        positionBonus: body.positionBonus ?? 0,
        performanceBonus: body.performanceBonus ?? 0,
        specialBonus: body.specialBonus ?? 0,
        grossBonus: body.grossBonus ?? 0,
        healthInsurance: body.healthInsurance ?? 0,
        pensionInsurance: body.pensionInsurance ?? 0,
        employmentInsurance: body.employmentInsurance ?? 0,
        incomeTax: body.incomeTax ?? 0,
        totalDeductions: body.totalDeductions ?? 0,
        performanceRating: body.performanceRating || null,
        performanceScore: body.performanceScore ?? null,
        evaluationComment: body.evaluationComment || null,
        netBonus: body.netBonus ?? 0,
        status: body.status || 'draft',
        notes: body.notes || null,
        updatedAt: new Date(),
      },
    });

    return successResponse({ bonusSlip }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '賞与明細の作成');
  }
}

/**
 * PATCH /api/payroll/bonus-slips - 賞与明細更新
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

    const existing = await prisma.bonus_slips.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('賞与明細が見つかりません', 404);
    }

    // 支払済みは更新不可
    if (existing.status === 'paid') {
      return errorResponse('支払済みの賞与明細は更新できません', 400);
    }

    const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.paymentDate) updateData.paymentDate = new Date(body.paymentDate);
    if (body.approvedAt) updateData.approvedAt = new Date(body.approvedAt);
    if (body.paidAt) updateData.paidAt = new Date(body.paidAt);

    const bonusSlip = await prisma.bonus_slips.update({
      where: { id },
      data: updateData,
    });

    return successResponse({ bonusSlip });
  } catch (error) {
    return handleApiError(error, '賞与明細の更新');
  }
}

/**
 * DELETE /api/payroll/bonus-slips - 賞与明細削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.bonus_slips.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('賞与明細が見つかりません', 404);
    }

    // 支払済みは削除不可
    if (existing.status === 'paid') {
      return errorResponse('支払済みの賞与明細は削除できません', 400);
    }

    await prisma.bonus_slips.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '賞与明細の削除');
  }
}
