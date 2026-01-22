import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';
import { createVendorSchema, validateWithSchema } from '@/lib/validation/asset-schemas';

// デモ用業者データ
const demoVendors = [
  {
    id: 'vendor-001',
    tenantId: 'tenant-1',
    name: 'トヨタモビリティサービス',
    phone: '03-1234-5678',
    address: '東京都港区芝浦1-1-1',
    contactPerson: '山田一郎',
    email: 'yamada@toyota-mobility.example.com',
    rating: 5,
    notes: '正規ディーラー。定期メンテナンス契約あり',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'vendor-002',
    tenantId: 'tenant-1',
    name: 'オートバックス品川店',
    phone: '03-9876-5432',
    address: '東京都品川区東品川2-2-2',
    contactPerson: '佐藤二郎',
    email: 'sato@autobacs-shinagawa.example.com',
    rating: 4,
    notes: 'タイヤ交換・オイル交換に利用',
    createdAt: new Date('2023-03-20'),
    updatedAt: new Date('2024-02-15'),
  },
];

// GET /api/assets/vendors - 業者一覧取得
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return successResponse(demoVendors, {
        count: demoVendors.length,
        pagination: { page: 1, limit: 20, total: demoVendors.length, totalPages: 1 },
        cacheSeconds: 60,
      });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const includeDetails = searchParams.get('include') === 'details';
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };

    // 総件数取得（ページネーション用）
    const total = await prisma.vendors.count({ where });

    // 一覧用：必要最小限のフィールドのみ取得
    const vendors = await prisma.vendors.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        name: true,
        phone: true,
        address: true,
        contactPerson: true,
        email: true,
        rating: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        // 詳細リクエスト時のみメンテナンス履歴を含める
        ...(includeDetails && {
          maintenanceRecords: {
            orderBy: { date: 'desc' as const },
            take: 5,
            select: {
              id: true,
              type: true,
              date: true,
              cost: true,
              description: true,
            },
          },
        }),
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    });

    return successResponse(vendors, {
      count: vendors.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 60, // 1分キャッシュ
    });
  } catch (error) {
    return handleApiError(error, '業者一覧の取得');
  }
}

// POST /api/assets/vendors - 業者登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Zodバリデーション
    const validation = validateWithSchema(createVendorSchema, body);
    if (!validation.success) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    const data = validation.data;

    const createData: Prisma.vendorsUncheckedCreateInput = {
      id: randomUUID(),
      tenantId: data.tenantId || 'tenant-1',
      name: data.name,
      phone: data.phone ?? undefined,
      address: data.address ?? undefined,
      contactPerson: data.contactPerson ?? undefined,
      email: data.email ?? undefined,
      rating: data.rating ?? undefined,
      notes: data.notes ?? undefined,
      updatedAt: new Date(),
    };

    const vendor = await prisma.vendors.create({
      data: createData,
    });

    return successResponse(vendor);
  } catch (error) {
    return handleApiError(error, '業者登録');
  }
}
