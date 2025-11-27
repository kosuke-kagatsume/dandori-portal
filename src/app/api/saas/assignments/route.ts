import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET /api/saas/assignments - ライセンス割り当て一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const serviceId = searchParams.get('serviceId');
    const userId = searchParams.get('userId');
    const isActive = searchParams.get('isActive');
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };
    if (serviceId) where.serviceId = serviceId;
    if (userId) where.userId = userId;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // 総件数取得
    const total = await prisma.saaSLicenseAssignment.count({ where });

    // ライセンス割り当て一覧取得（select最適化）
    const assignments = await prisma.saaSLicenseAssignment.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        serviceId: true,
        planId: true,
        userId: true,
        userName: true,
        userEmail: true,
        userDepartment: true,
        assignedDate: true,
        expiryDate: true,
        status: true,
        isActive: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            licenseType: true,
          },
        },
        plan: {
          select: {
            id: true,
            planName: true,
            billingCycle: true,
            pricePerUser: true,
          },
        },
      },
      orderBy: { assignedDate: 'desc' },
      skip,
      take: limit,
    });

    return successResponse(assignments, {
      count: assignments.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 60, // 1分キャッシュ
    });
  } catch (error) {
    return handleApiError(error, 'ライセンス割り当て一覧の取得');
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
