import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET /api/assets/pc-assets - PC資産一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const status = searchParams.get('status');
    const ownershipType = searchParams.get('ownershipType');
    const includeDetails = searchParams.get('include') === 'details';
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;
    if (ownershipType) where.ownershipType = ownershipType;

    // 総件数取得（ページネーション用）
    const total = await prisma.pCAsset.count({ where });

    // 一覧用：必要最小限のフィールドのみ取得
    const pcAssets = await prisma.pCAsset.findMany({
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
        monthlyLeaseCost: true,
        purchaseDate: true,
        purchasePrice: true,
        warrantyExpiry: true,
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
    const body = await request.json();
    const {
      tenantId = 'tenant-demo-001',
      assetNumber,
      manufacturer,
      model,
      serialNumber,
      cpu,
      memory,
      storage,
      os,
      assignedUserId,
      assignedUserName,
      assignedDate,
      ownershipType = 'owned',
      leaseCompany,
      leaseStartDate,
      leaseEndDate,
      monthlyLeaseCost,
      purchaseDate,
      purchasePrice,
      warrantyExpiry,
      status = 'active',
      notes,
    } = body;

    // バリデーション
    if (!assetNumber || !manufacturer || !model || !serialNumber) {
      return handleApiError(
        new Error('資産番号、メーカー、モデル、シリアル番号は必須です'),
        'PC資産登録'
      );
    }

    const pcAsset = await prisma.pCAsset.create({
      data: {
        tenantId,
        assetNumber,
        manufacturer,
        model,
        serialNumber,
        cpu,
        memory,
        storage,
        os,
        assignedUserId,
        assignedUserName,
        assignedDate: assignedDate ? new Date(assignedDate) : null,
        ownershipType,
        leaseCompany,
        leaseStartDate: leaseStartDate ? new Date(leaseStartDate) : null,
        leaseEndDate: leaseEndDate ? new Date(leaseEndDate) : null,
        monthlyLeaseCost,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        status,
        notes,
      },
    });

    return successResponse(pcAsset);
  } catch (error) {
    return handleApiError(error, 'PC資産登録');
  }
}
