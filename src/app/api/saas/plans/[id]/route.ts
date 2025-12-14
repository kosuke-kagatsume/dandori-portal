import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/saas/plans/[id] - プラン詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await prisma.saas_license_plans.findUnique({
      where: { id: params.id },
      include: {
        service: true,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'プランが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch plan',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/saas/plans/[id] - プラン更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      planName,
      billingCycle,
      pricePerUser,
      fixedPrice,
      currency,
      maxUsers,
      features,
      isActive,
    } = body;

    const plan = await prisma.saas_license_plans.update({
      where: { id: params.id },
      data: {
        planName,
        billingCycle,
        pricePerUser: pricePerUser !== null ? Number(pricePerUser) : null,
        fixedPrice: fixedPrice !== null ? Number(fixedPrice) : null,
        currency: currency || 'JPY',
        maxUsers: maxUsers !== null ? Number(maxUsers) : null,
        features: features || [],
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update plan',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/saas/plans/[id] - プラン削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 関連する割り当てをnullに設定（プランIDを削除）
    await prisma.saas_license_assignments.updateMany({
      where: { planId: params.id },
      data: { planId: null },
    });

    // プランを削除
    await prisma.saas_license_plans.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'プランを削除しました',
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete plan',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
