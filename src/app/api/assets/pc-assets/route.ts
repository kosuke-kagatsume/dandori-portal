import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import {
  successResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// デモ用PC資産データ
const demoPCAssets = [
  {
    id: 'pc-001',
    tenantId: 'tenant-demo-001',
    assetNumber: 'PC-001',
    manufacturer: 'Dell',
    model: 'Latitude 5520',
    serialNumber: 'DELL12345',
    cpu: 'Intel Core i7-1185G7',
    memory: '16GB',
    storage: '512GB SSD',
    os: 'Windows 11 Pro',
    assignedUserId: 'user-001',
    assignedUserName: '田中太郎',
    assignedDate: new Date('2023-04-01'),
    ownershipType: 'owned',
    purchaseDate: new Date('2023-03-15'),
    purchaseCost: 180000,
    warrantyExpiration: new Date('2026-03-14'),
    status: 'active',
    notes: '営業部用ノートPC',
    createdAt: new Date('2023-03-15'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'pc-002',
    tenantId: 'tenant-demo-001',
    assetNumber: 'PC-002',
    manufacturer: 'Apple',
    model: 'MacBook Pro 14"',
    serialNumber: 'APPLE67890',
    cpu: 'Apple M2 Pro',
    memory: '32GB',
    storage: '1TB SSD',
    os: 'macOS Sonoma',
    assignedUserId: 'user-003',
    assignedUserName: '佐藤次郎',
    assignedDate: new Date('2023-06-01'),
    ownershipType: 'leased',
    leaseCompany: 'オリックスレンテック',
    leaseStartDate: new Date('2023-06-01'),
    leaseEndDate: new Date('2026-05-31'),
    leaseMonthlyCost: 12000,
    status: 'active',
    notes: '開発部用MacBook',
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2024-02-20'),
  },
];

// GET /api/assets/pc-assets - PC資産一覧取得
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return successResponse(demoPCAssets, {
        count: demoPCAssets.length,
        pagination: { page: 1, limit: 20, total: demoPCAssets.length, totalPages: 1 },
        cacheSeconds: 60,
      });
    }

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
      leaseMonthlyCost,
      leaseContact,
      leasePhone,
      purchaseDate,
      purchaseCost,
      warrantyExpiration,
      status = 'active',
      notes,
    } = body;

    // バリデーション
    if (!assetNumber || !manufacturer || !model) {
      return handleApiError(
        new Error('資産番号、メーカー、モデルは必須です'),
        'PC資産登録'
      );
    }

    const pcAsset = await prisma.pc_assets.create({
      data: {
        id: randomUUID(),
        tenantId,
        assetNumber,
        manufacturer,
        model,
        serialNumber: serialNumber || '',
        cpu: cpu || null,
        memory: memory || null,
        storage: storage || null,
        os: os || null,
        assignedUserId: assignedUserId || null,
        assignedUserName: assignedUserName || null,
        assignedDate: assignedDate ? new Date(assignedDate) : null,
        ownershipType,
        leaseCompany: leaseCompany || null,
        leaseStartDate: leaseStartDate ? new Date(leaseStartDate) : null,
        leaseEndDate: leaseEndDate ? new Date(leaseEndDate) : null,
        leaseMonthlyCost: leaseMonthlyCost || null,
        leaseContact: leaseContact || null,
        leasePhone: leasePhone || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseCost: purchaseCost || null,
        warrantyExpiration: warrantyExpiration ? new Date(warrantyExpiration) : null,
        status,
        notes: notes || null,
        updatedAt: new Date(),
      },
    });

    return successResponse(pcAsset);
  } catch (error) {
    return handleApiError(error, 'PC資産登録');
  }
}
