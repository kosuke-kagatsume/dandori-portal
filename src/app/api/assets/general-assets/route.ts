import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';
import { createGeneralAssetSchema, validateWithSchema } from '@/lib/validation/asset-schemas';

// GET: 汎用資産一覧を取得
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    const assets = await prisma.general_assets.findMany({
      where: { tenantId },
      include: {
        repair_records: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(assets, {
      count: assets.length,
      cacheSeconds: 60,
    });
  } catch (error) {
    return handleApiError(error, '汎用資産一覧取得');
  }
}

// POST: 汎用資産を作成
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    const body = await request.json();

    // Zodバリデーション
    const validation = validateWithSchema(createGeneralAssetSchema, body);
    if (!validation.success) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    const data = validation.data;

    const asset = await prisma.general_assets.create({
      data: {
        id: randomUUID(),
        tenantId: data.tenantId || tenantId,
        assetNumber: data.assetNumber,
        category: data.category,
        name: data.name,
        manufacturer: data.manufacturer || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        specifications: data.specifications ? JSON.parse(data.specifications) : null,
        assignedUserId: data.assignedUserId || null,
        assignedUserName: data.assignedUserName || null,
        assignedDate: data.assignedDate ? new Date(data.assignedDate) : null,
        ownershipType: data.ownershipType,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchaseCost: data.purchaseCost || null,
        leaseCompany: data.leaseCompany || null,
        leaseMonthlyCost: data.leaseMonthlyCost || null,
        leaseStartDate: data.leaseStartDate ? new Date(data.leaseStartDate) : null,
        leaseEndDate: data.leaseEndDate ? new Date(data.leaseEndDate) : null,
        warrantyExpiration: data.warrantyExpiration ? new Date(data.warrantyExpiration) : null,
        status: data.status,
        notes: data.notes || null,
        updatedAt: new Date(),
      },
    });

    return successResponse(asset);
  } catch (error) {
    return handleApiError(error, '汎用資産登録');
  }
}
