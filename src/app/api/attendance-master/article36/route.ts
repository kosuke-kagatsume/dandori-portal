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
 * GET /api/attendance-master/article36 - 36協定一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const fiscalYear = searchParams.get('fiscalYear');

    const where: { tenantId: string; fiscalYear?: number } = { tenantId };
    if (fiscalYear) {
      where.fiscalYear = parseInt(fiscalYear, 10);
    }

    const agreements = await prisma.article36_agreements.findMany({
      where,
      orderBy: { fiscalYear: 'desc' },
    });

    return successResponse({ agreements }, { count: agreements.length });
  } catch (error) {
    return handleApiError(error, '36協定一覧の取得');
  }
}

/**
 * POST /api/attendance-master/article36 - 36協定作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    const validation = validateRequiredFields(body, ['fiscalYear', 'effectiveStartDate', 'effectiveEndDate']);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    // 同一年度の協定が既にあるかチェック
    const existing = await prisma.article36_agreements.findFirst({
      where: { tenantId, fiscalYear: body.fiscalYear },
    });
    if (existing) {
      return errorResponse('この年度の36協定は既に存在します', 409);
    }

    const agreement = await prisma.article36_agreements.create({
      data: {
        id: `a36-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        fiscalYear: body.fiscalYear,
        effectiveStartDate: new Date(body.effectiveStartDate),
        effectiveEndDate: new Date(body.effectiveEndDate),
        monthlyOvertimeLimit: body.monthlyOvertimeLimit ?? 45,
        yearlyOvertimeLimit: body.yearlyOvertimeLimit ?? 360,
        specialClauseEnabled: body.specialClauseEnabled ?? false,
        specialMonthlyLimit: body.specialMonthlyLimit || null,
        specialYearlyLimit: body.specialYearlyLimit || null,
        specialMonthsPerYear: body.specialMonthsPerYear || null,
        holidayWorkLimit: body.holidayWorkLimit || null,
        lateNightWorkRestriction: body.lateNightWorkRestriction ?? false,
        healthCheckupRequired: body.healthCheckupRequired ?? true,
        doctorInterviewRequired: body.doctorInterviewRequired ?? true,
        workerRepresentativeName: body.workerRepresentativeName || null,
        workerRepresentativeDate: body.workerRepresentativeDate ? new Date(body.workerRepresentativeDate) : null,
        employerRepresentativeName: body.employerRepresentativeName || null,
        employerRepresentativeDate: body.employerRepresentativeDate ? new Date(body.employerRepresentativeDate) : null,
        submittedToLabor: body.submittedToLabor ?? false,
        laborSubmissionDate: body.laborSubmissionDate ? new Date(body.laborSubmissionDate) : null,
        isActive: body.isActive ?? true,
        notes: body.notes || null,
        updatedAt: new Date(),
      },
    });

    return successResponse({ agreement }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '36協定の作成');
  }
}

/**
 * PATCH /api/attendance-master/article36 - 36協定更新
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

    const existing = await prisma.article36_agreements.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('36協定が見つかりません', 404);
    }

    // 日付フィールドの変換
    const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.effectiveStartDate) updateData.effectiveStartDate = new Date(body.effectiveStartDate);
    if (body.effectiveEndDate) updateData.effectiveEndDate = new Date(body.effectiveEndDate);
    if (body.workerRepresentativeDate) updateData.workerRepresentativeDate = new Date(body.workerRepresentativeDate);
    if (body.employerRepresentativeDate) updateData.employerRepresentativeDate = new Date(body.employerRepresentativeDate);
    if (body.laborSubmissionDate) updateData.laborSubmissionDate = new Date(body.laborSubmissionDate);

    const agreement = await prisma.article36_agreements.update({
      where: { id },
      data: updateData,
    });

    return successResponse({ agreement });
  } catch (error) {
    return handleApiError(error, '36協定の更新');
  }
}

/**
 * DELETE /api/attendance-master/article36 - 36協定削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.article36_agreements.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('36協定が見つかりません', 404);
    }

    await prisma.article36_agreements.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '36協定の削除');
  }
}
