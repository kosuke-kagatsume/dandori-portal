import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
  getPaginationParams,
} from '@/lib/api/api-helpers';
import { createPCAssetSchema, validateWithSchema } from '@/lib/validation/asset-schemas';

// GET /api/assets/pc-assets - PC資産一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const status = searchParams.get('status');
    const ownershipType = searchParams.get('ownershipType');
    const includeDetails = searchParams.get('include') === 'details';
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;
    if (ownershipType) where.ownershipType = ownershipType;

    // 総件数取得（ページネーション用）
    const total = await prisma.pc_assets.count({ where });

    // 一覧用：必要最小限のフィールドのみ取得
    const pcAssets = await prisma.pc_assets.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        assetNumber: true,
        manufacturer: true,
        model: true,
        serialNumber: true,
        cpu: true,
        memory: true,
        storage: true,
        os: true,
        assignedUserId: true,
        assignedUserName: true,
        assignedDate: true,
        ownershipType: true,
        leaseCompany: true,
        leaseStartDate: true,
        leaseEndDate: true,
        leaseMonthlyCost: true,
        leaseContact: true,
        leasePhone: true,
        purchaseDate: true,
        purchaseCost: true,
        warrantyExpiration: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        // 詳細リクエスト時のみソフトウェアライセンスを含める
        ...(includeDetails && {
          softwareLicenses: {
            select: {
              id: true,
              name: true,
              licenseKey: true,
              expiryDate: true,
              status: true,
            },
          },
        }),
      },
      orderBy: { assetNumber: 'asc' },
      skip,
      take: limit,
    });

    return successResponse(pcAssets, {
      count: pcAssets.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 60, // 1分キャッシュ
    });
  } catch (error) {
    return handleApiError(error, 'PC資産一覧の取得');
  }
}

// POST /api/assets/pc-assets - PC資産登録
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    // Zodバリデーション
    const validation = validateWithSchema(createPCAssetSchema, body);
    if (!validation.success) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    const data = validation.data;

    const pcAsset = await prisma.pc_assets.create({
      data: {
        id: randomUUID(),
        tenantId: data.tenantId || tenantId,
        assetNumber: data.assetNumber,
        manufacturer: data.manufacturer,
        model: data.model,
        serialNumber: data.serialNumber || '',
        cpu: data.cpu || null,
        memory: data.memory || null,
        storage: data.storage || null,
        os: data.os || null,
        assignedUserId: data.assignedUserId || null,
        assignedUserName: data.assignedUserName || null,
        assignedDate: data.assignedDate ? new Date(data.assignedDate) : null,
        ownershipType: data.ownershipType,
        leaseCompany: data.leaseCompany || null,
        leaseStartDate: data.leaseStartDate ? new Date(data.leaseStartDate) : null,
        leaseEndDate: data.leaseEndDate ? new Date(data.leaseEndDate) : null,
        leaseMonthlyCost: data.leaseMonthlyCost || null,
        leaseContact: data.leaseContact || null,
        leasePhone: data.leasePhone || null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchaseCost: data.purchaseCost || null,
        warrantyExpiration: data.warrantyExpiration ? new Date(data.warrantyExpiration) : null,
        status: data.status,
        notes: data.notes || null,
        updatedAt: new Date(),
      },
    });

    return successResponse(pcAsset);
  } catch (error) {
    return handleApiError(error, 'PC資産登録');
  }
}
