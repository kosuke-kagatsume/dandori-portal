import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

/**
 * GET /api/users/[id]/income-tax - 所得税情報取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const tenantId = await getTenantIdFromRequest(request);

    const record = await prisma.employee_income_tax_info.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });

    return successResponse(record);
  } catch (error) {
    return handleApiError(error, '所得税情報の取得');
  }
}

/**
 * PUT /api/users/[id]/income-tax - 所得税情報の作成/更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    const record = await prisma.employee_income_tax_info.upsert({
      where: { tenantId_userId: { tenantId, userId } },
      create: {
        id: `eit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        userId,
        taxClassification: body.taxClassification || 'kou',
        isSecondaryIncome: body.isSecondaryIncome ?? false,
        isDisasterVictim: body.isDisasterVictim ?? false,
        isForeigner: body.isForeigner ?? false,
        disabilityGrade: body.disabilityGrade || 'none',
        widowCategory: body.widowCategory || 'none',
        isWorkingStudent: body.isWorkingStudent ?? false,
        residencyStatus: body.residencyStatus || 'resident',
        updatedAt: new Date(),
      },
      update: {
        ...(body.taxClassification !== undefined && { taxClassification: body.taxClassification }),
        ...(body.isSecondaryIncome !== undefined && { isSecondaryIncome: body.isSecondaryIncome }),
        ...(body.isDisasterVictim !== undefined && { isDisasterVictim: body.isDisasterVictim }),
        ...(body.isForeigner !== undefined && { isForeigner: body.isForeigner }),
        ...(body.disabilityGrade !== undefined && { disabilityGrade: body.disabilityGrade }),
        ...(body.widowCategory !== undefined && { widowCategory: body.widowCategory }),
        ...(body.isWorkingStudent !== undefined && { isWorkingStudent: body.isWorkingStudent }),
        ...(body.residencyStatus !== undefined && { residencyStatus: body.residencyStatus }),
        updatedAt: new Date(),
      },
    });

    return successResponse(record);
  } catch (error) {
    return handleApiError(error, '所得税情報の保存');
  }
}
