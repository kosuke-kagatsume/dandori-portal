import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantId,
} from '@/lib/api/api-helpers';
import { createGeneralAssetSchema, validateWithSchema } from '@/lib/validation/asset-schemas';

// デモ用汎用資産データ
const demoGeneralAssets = [
  {
    id: 'asset-001',
    tenantId: 'tenant-1',
    assetNumber: 'GA-001',
    category: 'office_equipment',
    name: '複合機 MX-3661',
    manufacturer: 'シャープ',
    model: 'MX-3661',
    serialNumber: 'SHARP001',
    assignedUserName: '総務部',
    ownershipType: 'leased',
    leaseMonthlyCost: 35000,
    leaseStartDate: new Date('2023-01-01'),
    leaseEndDate: new Date('2028-12-31'),
    status: 'active',
    notes: '本社3階設置',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-15'),
    repairRecords: [],
  },
  {
    id: 'asset-002',
    tenantId: 'tenant-1',
    assetNumber: 'GA-002',
    category: 'furniture',
    name: '会議テーブル（大）',
    manufacturer: 'オカムラ',
    model: 'CT-2400',
    assignedUserName: '会議室A',
    ownershipType: 'owned',
    purchaseDate: new Date('2022-06-15'),
    purchaseCost: 280000,
    status: 'active',
    notes: '12人用会議テーブル',
    createdAt: new Date('2022-06-15'),
    updatedAt: new Date('2022-06-15'),
    repairRecords: [],
  },
];

// GET: 汎用資産一覧を取得
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return successResponse(demoGeneralAssets, {
        count: demoGeneralAssets.length,
        cacheSeconds: 60,
      });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

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
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

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
