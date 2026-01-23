import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/saas/services/[id] - SaaSサービス詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = await prisma.saas_services.findUnique({
      where: { id: params.id },
      include: {
        saas_license_plans: true,
        saas_license_assignments: {
          include: {
            saas_license_plans: true,
          },
          orderBy: { assignedDate: 'desc' },
        },
        saas_monthly_costs: {
          orderBy: { period: 'desc' },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'SaaSサービスが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('Error fetching SaaS service:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch SaaS service',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/saas/services/[id] - SaaSサービス更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      vendor,
      description,
      website,
      logo,
      licenseType,
      securityRating,
      ssoEnabled,
      mfaEnabled,
      contractStartDate,
      contractEndDate,
      autoRenew,
      adminEmail,
      supportUrl,
      isActive,
    } = body;

    const service = await prisma.saas_services.update({
      where: { id: params.id },
      data: {
        name,
        category,
        vendor,
        description,
        website,
        logo,
        licenseType,
        securityRating,
        ssoEnabled,
        mfaEnabled,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : undefined,
        contractEndDate: contractEndDate ? new Date(contractEndDate) : undefined,
        autoRenew,
        adminEmail,
        supportUrl,
        isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('Error updating SaaS service:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update SaaS service',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/saas/services/[id] - SaaSサービス削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 関連データも削除
    await prisma.saas_license_assignments.deleteMany({
      where: { serviceId: params.id },
    });
    await prisma.saas_license_plans.deleteMany({
      where: { serviceId: params.id },
    });
    await prisma.saas_monthly_costs.deleteMany({
      where: { serviceId: params.id },
    });

    await prisma.saas_services.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'SaaSサービスを削除しました',
    });
  } catch (error) {
    console.error('Error deleting SaaS service:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete SaaS service',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
