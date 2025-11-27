import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/saas/services - SaaSサービス一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { tenantId };
    if (category) where.category = category;
    if (status) where.status = status;

    const services = await prisma.saaSService.findMany({
      where,
      include: {
        plans: true,
        assignments: {
          where: { status: 'active' },
        },
        monthlyCosts: {
          orderBy: { period: 'desc' },
          take: 12,
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: services,
      count: services.length,
    });
  } catch (error) {
    console.error('Error fetching SaaS services:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch SaaS services',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
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
      provider,
      description,
      website,
      licenseType,
      billingCycle = 'monthly',
      basePrice,
      currency = 'JPY',
      ssoEnabled = false,
      mfaRequired = false,
      dataResidency,
      complianceCerts,
      contractStartDate,
      contractEndDate,
      autoRenewal = true,
      noticePeriodDays,
      adminEmail,
      supportContact,
      status = 'active',
      notes,
    } = body;

    if (!name || !category || !licenseType) {
      return NextResponse.json(
        {
          success: false,
          error: 'サービス名、カテゴリ、ライセンスタイプは必須です',
        },
        { status: 400 }
      );
    }

    const service = await prisma.saaSService.create({
      data: {
        tenantId,
        name,
        category,
        provider,
        description,
        website,
        licenseType,
        billingCycle,
        basePrice,
        currency,
        ssoEnabled,
        mfaRequired,
        dataResidency,
        complianceCerts,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
        contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
        autoRenewal,
        noticePeriodDays,
        adminEmail,
        supportContact,
        status,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('Error creating SaaS service:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create SaaS service',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
