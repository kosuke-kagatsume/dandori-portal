import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

/**
 * GET /api/settings/payroll/offices - 事業所一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    const offices = await prisma.offices.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
    });

    return successResponse({ offices }, { count: offices.length });
  } catch (error) {
    return handleApiError(error, '事業所一覧の取得');
  }
}

/**
 * POST /api/settings/payroll/offices - 事業所登録
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    if (!body.name?.trim()) {
      return errorResponse('事業所名は必須です', 400);
    }

    const office = await prisma.offices.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        name: body.name.trim(),
        nameKana: body.nameKana || null,
        isHeadquarters: body.isHeadquarters ?? false,
        postalCode: body.postalCode || null,
        prefecture: body.prefecture || null,
        address1: body.address1 || null,
        address1Kana: body.address1Kana || null,
        address2: body.address2 || null,
        address2Kana: body.address2Kana || null,
        tel: body.tel || null,
        fax: body.fax || null,
        url: body.url || null,
        ownerTitle: body.ownerTitle || null,
        ownerName: body.ownerName || null,
        ownerNameKana: body.ownerNameKana || null,
        sortOrder: body.sortOrder ?? 0,
        socialInsuranceSettings: body.socialInsuranceSettings || null,
        laborInsuranceSettings: body.laborInsuranceSettings || null,
      },
    });

    return successResponse({ office });
  } catch (error) {
    return handleApiError(error, '事業所の登録');
  }
}

/**
 * PATCH /api/settings/payroll/offices - 事業所更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.offices.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('事業所が見つかりません', 404);
    }

    const office = await prisma.offices.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.nameKana !== undefined && { nameKana: body.nameKana }),
        ...(body.isHeadquarters !== undefined && { isHeadquarters: body.isHeadquarters }),
        ...(body.postalCode !== undefined && { postalCode: body.postalCode }),
        ...(body.prefecture !== undefined && { prefecture: body.prefecture }),
        ...(body.address1 !== undefined && { address1: body.address1 }),
        ...(body.address1Kana !== undefined && { address1Kana: body.address1Kana }),
        ...(body.address2 !== undefined && { address2: body.address2 }),
        ...(body.address2Kana !== undefined && { address2Kana: body.address2Kana }),
        ...(body.tel !== undefined && { tel: body.tel }),
        ...(body.fax !== undefined && { fax: body.fax }),
        ...(body.url !== undefined && { url: body.url }),
        ...(body.ownerTitle !== undefined && { ownerTitle: body.ownerTitle }),
        ...(body.ownerName !== undefined && { ownerName: body.ownerName }),
        ...(body.ownerNameKana !== undefined && { ownerNameKana: body.ownerNameKana }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.socialInsuranceSettings !== undefined && { socialInsuranceSettings: body.socialInsuranceSettings }),
        ...(body.laborInsuranceSettings !== undefined && { laborInsuranceSettings: body.laborInsuranceSettings }),
      },
    });

    return successResponse({ office });
  } catch (error) {
    return handleApiError(error, '事業所の更新');
  }
}

/**
 * DELETE /api/settings/payroll/offices - 事業所削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.offices.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('事業所が見つかりません', 404);
    }

    await prisma.offices.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '事業所の削除');
  }
}
