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
 * GET /api/users/[id]/dependent-details - 扶養親族詳細一覧
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const tenantId = await getTenantIdFromRequest(request);

    const records = await prisma.employee_dependent_details.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'asc' },
    });

    return successResponse(records, { count: records.length });
  } catch (error) {
    return handleApiError(error, '扶養親族詳細の取得');
  }
}

/**
 * POST /api/users/[id]/dependent-details - 扶養親族追加
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    const validation = validateRequiredFields(body, ['dependentType', 'name']);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    const record = await prisma.employee_dependent_details.create({
      data: {
        id: `edd-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        userId,
        dependentType: body.dependentType,
        name: body.name,
        nameKana: body.nameKana || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        relationship: body.relationship || null,
        isLivingTogether: body.isLivingTogether ?? true,
        annualIncome: body.annualIncome != null ? parseInt(String(body.annualIncome)) : null,
        disabilityGrade: body.disabilityGrade || 'none',
        healthInsuranceType: body.healthInsuranceType || 'enrolled',
        updatedAt: new Date(),
      },
    });

    return successResponse(record);
  } catch (error) {
    return handleApiError(error, '扶養親族の追加');
  }
}

/**
 * PUT /api/users/[id]/dependent-details - 扶養親族更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    if (!body.recordId) {
      return errorResponse('recordIdが必要です', 400);
    }

    const existing = await prisma.employee_dependent_details.findFirst({
      where: { id: body.recordId, tenantId, userId },
    });
    if (!existing) {
      return errorResponse('扶養親族情報が見つかりません', 404);
    }

    const record = await prisma.employee_dependent_details.update({
      where: { id: body.recordId },
      data: {
        ...(body.dependentType !== undefined && { dependentType: body.dependentType }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.nameKana !== undefined && { nameKana: body.nameKana || null }),
        ...(body.birthDate !== undefined && { birthDate: body.birthDate ? new Date(body.birthDate) : null }),
        ...(body.relationship !== undefined && { relationship: body.relationship || null }),
        ...(body.isLivingTogether !== undefined && { isLivingTogether: body.isLivingTogether }),
        ...(body.annualIncome !== undefined && { annualIncome: body.annualIncome != null ? parseInt(String(body.annualIncome)) : null }),
        ...(body.disabilityGrade !== undefined && { disabilityGrade: body.disabilityGrade }),
        ...(body.healthInsuranceType !== undefined && { healthInsuranceType: body.healthInsuranceType }),
        updatedAt: new Date(),
      },
    });

    return successResponse(record);
  } catch (error) {
    return handleApiError(error, '扶養親族の更新');
  }
}

/**
 * DELETE /api/users/[id]/dependent-details - 扶養親族削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const recordId = searchParams.get('recordId');

    if (!recordId) {
      return errorResponse('recordIdが必要です', 400);
    }

    const existing = await prisma.employee_dependent_details.findFirst({
      where: { id: recordId, tenantId, userId },
    });
    if (!existing) {
      return errorResponse('扶養親族情報が見つかりません', 404);
    }

    await prisma.employee_dependent_details.delete({ where: { id: recordId } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '扶養親族の削除');
  }
}
