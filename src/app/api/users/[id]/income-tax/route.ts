import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
} from '@/lib/api/api-helpers';
import { requireUserAccess } from '@/lib/auth/user-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[id]/income-tax - 所得税情報取得（admin/hr限定）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  const access = await requireUserAccess(request, userId, 'hr_only');
  if (access.errorResponse) return access.errorResponse;

  try {
    const tenantId = access.targetUser.tenantId;

    const record = await prisma.employee_income_tax_info.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });

    return successResponse(record);
  } catch (error) {
    return handleApiError(error, '所得税情報の取得');
  }
}

/**
 * PUT /api/users/[id]/income-tax - 所得税情報の作成/更新（admin/hr限定）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  const access = await requireUserAccess(request, userId, 'hr_only');
  if (access.errorResponse) return access.errorResponse;

  try {
    const body = await request.json();
    const tenantId = access.targetUser.tenantId;

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
