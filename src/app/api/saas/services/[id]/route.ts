import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/saas/services/[id] - SaaSサービス詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = await prisma.saaSService.findUnique({
      where: { id: params.id },
      include: {
        plans: true,
        assignments: {
          include: {
            plan: true,
          },
          orderBy: { assignedDate: 'desc' },
        },
        monthlyCosts: {
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
      contractStartDate,
      contractEndDate,
      autoRenewal,
      noticePeriodDays,
      adminEmail,
      supportContact,
      status,
      notes,
    } = body;

    const service = await prisma.saaSService.update({
      where: { id: params.id },
      data: {
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
    await prisma.saaSLicenseAssignment.deleteMany({
      where: { serviceId: params.id },
    });
    await prisma.saaSLicensePlan.deleteMany({
      where: { serviceId: params.id },
    });
    await prisma.saaSMonthlyCost.deleteMany({
      where: { serviceId: params.id },
    });

    await prisma.saaSService.delete({
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
