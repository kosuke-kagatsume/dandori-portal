import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET /api/assets/vendors - 業者一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const category = searchParams.get('category');
    const includeDetails = searchParams.get('include') === 'details';
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };
    if (category) where.category = category;

    // 総件数取得（ページネーション用）
    const total = await prisma.vendor.count({ where });

    // 一覧用：必要最小限のフィールドのみ取得
    const vendors = await prisma.vendor.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        name: true,
        category: true,
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
    const {
      tenantId = 'tenant-demo-001',
      name,
      category,
      phone,
      address,
      contactPerson,
      email,
      rating,
      notes,
    } = body;

    if (!name) {
      return handleApiError(new Error('業者名は必須です'), '業者登録');
    }

    const vendor = await prisma.vendor.create({
      data: {
        tenantId,
        name,
        category,
        phone,
        address,
        contactPerson,
        email,
        rating,
        notes,
      },
    });

    return successResponse(vendor);
  } catch (error) {
    return handleApiError(error, '業者登録');
  }
}
