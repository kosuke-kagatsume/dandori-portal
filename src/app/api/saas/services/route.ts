import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET /api/saas/services - SaaSサービス一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const includeDetails = searchParams.get('include') === 'details';
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };
    if (category) where.category = category;
    if (isActive !== null) where.isActive = isActive === 'true';

    // 総件数取得（ページネーション用）
    const total = await prisma.saaSService.count({ where });

    // 一覧用：必要最小限のフィールドのみ取得
    const services = await prisma.saaSService.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        name: true,
        category: true,
        vendor: true,
        website: true,
        logo: true,
        description: true,
        licenseType: true,
        securityRating: true,
        ssoEnabled: true,
        mfaEnabled: true,
        adminEmail: true,
        supportUrl: true,
        contractStartDate: true,
        contractEndDate: true,
        autoRenew: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // 詳細リクエスト時のみ関連データを含める
        ...(includeDetails && {
          plans: {
            select: {
              id: true,
              planName: true,
              billingCycle: true,
              pricePerUser: true,
              fixedPrice: true,
              currency: true,
              maxUsers: true,
              features: true,
              isActive: true,
            },
          },
          assignments: {
            where: { status: 'active' },
            select: {
              id: true,
              userId: true,
              userName: true,
              userEmail: true,
              assignedDate: true,
              status: true,
            },
          },
          monthlyCosts: {
            orderBy: { period: 'desc' as const },
            take: 12,
            select: {
              id: true,
              period: true,
              totalCost: true,
              userLicenseCount: true,
              currency: true,
            },
          },
        }),
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    });

    return successResponse(services, {
      count: services.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 60, // 1分キャッシュ
    });
  } catch (error) {
    return handleApiError(error, 'SaaSサービス一覧の取得');
  }
}

// POST /api/saas/services - SaaSサービス登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-demo-001',
      name,
      category,
      vendor,
      website,
      logo,
      description,
      licenseType,
      securityRating,
      ssoEnabled = false,
      mfaEnabled = false,
      adminEmail,
      supportUrl,
      contractStartDate,
      contractEndDate,
      autoRenew = false,
      isActive = true,
    } = body;

    if (!name || !category || !licenseType) {
      return handleApiError(
        new Error('サービス名、カテゴリ、ライセンスタイプは必須です'),
        'SaaSサービス登録'
      );
    }

    const service = await prisma.saaSService.create({
      data: {
        tenantId,
        name,
        category,
        vendor,
        website,
        logo,
        description,
        licenseType,
        securityRating,
        ssoEnabled,
        mfaEnabled,
        adminEmail,
        supportUrl,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
        contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
        autoRenew,
        isActive,
      },
    });

    return successResponse(service);
  } catch (error) {
    return handleApiError(error, 'SaaSサービス登録');
  }
}
