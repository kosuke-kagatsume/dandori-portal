import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET /api/saas/services - SaaSサービス一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const includeDetails = searchParams.get('include') === 'details';
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };
    if (category) where.category = category;
    if (isActive !== null) where.isActive = isActive === 'true';

    // 総件数取得（ページネーション用）
    const total = await prisma.saas_services.count({ where });

    // 一覧用：必要最小限のフィールドのみ取得
    const services = await prisma.saas_services.findMany({
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
          saas_license_plans: {
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
          saas_license_assignments: {
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
          saas_monthly_costs: {
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

    // フィールド名を変換（Prismaのテーブル名 → フロントエンド用）
    const transformedServices = includeDetails
      ? services.map((service) => ({
          ...service,
          plans: (service as Record<string, unknown>).saas_license_plans,
          assignments: (service as Record<string, unknown>).saas_license_assignments,
          monthlyCosts: (service as Record<string, unknown>).saas_monthly_costs,
          saas_license_plans: undefined,
          saas_license_assignments: undefined,
          saas_monthly_costs: undefined,
        }))
      : services;

    return successResponse(transformedServices, {
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
    const requestTenantId = await getTenantIdFromRequest(request);
    const body = await request.json();
    const {
      tenantId = requestTenantId,
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

    const service = await prisma.saas_services.create({
      data: {
        id: crypto.randomUUID(),
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
        updatedAt: new Date(),
      },
    });

    return successResponse(service);
  } catch (error) {
    return handleApiError(error, 'SaaSサービス登録');
  }
}
