import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/saas/assignments - ライセンス割り当て一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';
    const serviceId = searchParams.get('serviceId');
    const userId = searchParams.get('userId');
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = { tenantId };
    if (serviceId) where.serviceId = serviceId;
    if (userId) where.userId = userId;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const assignments = await prisma.saaSLicenseAssignment.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            licenseType: true,
          },
        },
        plan: true,
      },
      orderBy: { assignedDate: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: assignments,
      count: assignments.length,
    });
  } catch (error) {
    console.error('Error fetching license assignments:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch license assignments',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/saas/assignments - ライセンス割り当て登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-demo-001',
      serviceId,
      planId,
      userId,
      userName,
      userEmail,
      userDepartment,
      assignedDate,
      expiryDate,
      isActive = true,
      notes,
    } = body;

    if (!serviceId || !userId || !userName) {
      return NextResponse.json(
        {
          success: false,
          error: 'サービスID、ユーザーID、ユーザー名は必須です',
        },
        { status: 400 }
      );
    }

    const assignment = await prisma.saaSLicenseAssignment.create({
      data: {
        tenantId,
        serviceId,
        planId,
        userId,
        userName,
        userEmail,
        userDepartment,
        assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isActive,
        notes,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        plan: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error('Error creating license assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create license assignment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
