import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET /api/saas/plans - プラン一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const serviceId = searchParams.get('serviceId');
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };
    if (serviceId) where.serviceId = serviceId;

    // 総件数取得
    const total = await prisma.saaSPlan.count({ where });

    // プラン一覧取得（select最適化）
    const plans = await prisma.saaSPlan.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        serviceId: true,
        planName: true,
        billingCycle: true,
        pricePerUser: true,
        fixedPrice: true,
        currency: true,
        maxUsers: true,
        features: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        service: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return successResponse(plans, {
      count: plans.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 300, // 5分キャッシュ
    });
  } catch (error) {
    return handleApiError(error, 'SaaSプラン一覧の取得');
  }
}

// POST /api/saas/plans - プラン登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-demo-001',
      serviceId,
      planName,
      billingCycle = 'monthly',
      pricePerUser,
      fixedPrice,
      currency = 'JPY',
      maxUsers,
      features = [],
      isActive = true,
    } = body;

    if (!serviceId || !planName) {
      return NextResponse.json(
        {
          success: false,
          error: 'サービスIDとプラン名は必須です',
        },
        { status: 400 }
      );
    }

    const plan = await prisma.saaSPlan.create({
      data: {
        tenantId,
        serviceId,
        planName,
        billingCycle,
        pricePerUser: pricePerUser ? Number(pricePerUser) : null,
        fixedPrice: fixedPrice ? Number(fixedPrice) : null,
        currency,
        maxUsers: maxUsers ? Number(maxUsers) : null,
        features,
        isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Error creating SaaS plan:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create SaaS plan',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
