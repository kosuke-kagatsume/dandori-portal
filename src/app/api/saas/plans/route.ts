import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/saas/plans - プラン一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';
    const serviceId = searchParams.get('serviceId');

    const where: Record<string, unknown> = { tenantId };
    if (serviceId) where.serviceId = serviceId;

    const plans = await prisma.saaSPlan.findMany({
      where,
      include: {
        service: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: plans,
      count: plans.length,
    });
  } catch (error) {
    console.error('Error fetching SaaS plans:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch SaaS plans',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
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
