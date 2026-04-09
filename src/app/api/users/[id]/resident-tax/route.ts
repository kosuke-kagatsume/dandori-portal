import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

/**
 * GET /api/users/[id]/resident-tax - 住民税情報取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const tenantId = await getTenantIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const fiscalYear = parseInt(searchParams.get('fiscalYear') || '') || new Date().getFullYear();

    const record = await prisma.employee_resident_tax.findUnique({
      where: { tenantId_userId_fiscalYear: { tenantId, userId, fiscalYear } },
    });

    return successResponse(record);
  } catch (error) {
    return handleApiError(error, '住民税情報の取得');
  }
}

/**
 * PUT /api/users/[id]/resident-tax - 住民税情報の作成/更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);
    const fiscalYear = body.fiscalYear || new Date().getFullYear();

    if (!fiscalYear) {
      return errorResponse('fiscalYearが必要です', 400);
    }

    const record = await prisma.employee_resident_tax.upsert({
      where: { tenantId_userId_fiscalYear: { tenantId, userId, fiscalYear } },
      create: {
        id: `ert-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        userId,
        fiscalYear,
        municipalityId: body.municipalityId || null,
        collectionMethod: body.collectionMethod || 'special',
        monthlyAmounts: body.monthlyAmounts || null,
        updatedAt: new Date(),
      },
      update: {
        ...(body.municipalityId !== undefined && { municipalityId: body.municipalityId || null }),
        ...(body.collectionMethod !== undefined && { collectionMethod: body.collectionMethod }),
        ...(body.monthlyAmounts !== undefined && { monthlyAmounts: body.monthlyAmounts }),
        updatedAt: new Date(),
      },
    });

    return successResponse(record);
  } catch (error) {
    return handleApiError(error, '住民税情報の保存');
  }
}
