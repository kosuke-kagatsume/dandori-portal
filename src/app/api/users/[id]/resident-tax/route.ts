import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
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

    // fiscalYear=0 を固定キーとして使用（1ユーザー1レコード）
    const record = await prisma.employee_resident_tax.findUnique({
      where: { tenantId_userId_fiscalYear: { tenantId, userId, fiscalYear: 0 } },
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

    const record = await prisma.employee_resident_tax.upsert({
      where: { tenantId_userId_fiscalYear: { tenantId, userId, fiscalYear: 0 } },
      create: {
        id: `ert-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        userId,
        fiscalYear: 0,
        reportMunicipalityId: body.reportMunicipalityId || null,
        paymentMunicipalityId: body.paymentMunicipalityId || null,
        addressNumber: body.addressNumber || null,
        recipientNumber: body.recipientNumber || null,
        updatedAt: new Date(),
      },
      update: {
        ...(body.reportMunicipalityId !== undefined && { reportMunicipalityId: body.reportMunicipalityId || null }),
        ...(body.paymentMunicipalityId !== undefined && { paymentMunicipalityId: body.paymentMunicipalityId || null }),
        ...(body.addressNumber !== undefined && { addressNumber: body.addressNumber || null }),
        ...(body.recipientNumber !== undefined && { recipientNumber: body.recipientNumber || null }),
        updatedAt: new Date(),
      },
    });

    return successResponse(record);
  } catch (error) {
    return handleApiError(error, '住民税情報の保存');
  }
}
