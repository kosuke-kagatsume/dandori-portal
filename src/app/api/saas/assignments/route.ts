import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// デモ用ライセンス割り当てデータ
const demoLicenseAssignments = [
  {
    id: 'assign-001',
    tenantId: 'tenant-1',
    serviceId: 'saas-001',
    planId: 'plan-001',
    userId: 'user-001',
    userName: '田中太郎',
    userEmail: 'tanaka@example.com',
    userDepartment: '営業部',
    assignedDate: new Date('2024-01-15'),
    expiryDate: new Date('2024-12-31'),
    status: 'active',
    isActive: true,
    notes: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    service: { id: 'saas-001', name: 'Microsoft 365 Business', category: 'productivity', licenseType: 'per_user' },
    plan: { id: 'plan-001', planName: 'Business Standard', billingCycle: 'yearly', pricePerUser: 1360 },
  },
  {
    id: 'assign-002',
    tenantId: 'tenant-1',
    serviceId: 'saas-001',
    planId: 'plan-001',
    userId: 'user-002',
    userName: '山田花子',
    userEmail: 'yamada@example.com',
    userDepartment: '人事部',
    assignedDate: new Date('2024-01-15'),
    expiryDate: new Date('2024-12-31'),
    status: 'active',
    isActive: true,
    notes: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    service: { id: 'saas-001', name: 'Microsoft 365 Business', category: 'productivity', licenseType: 'per_user' },
    plan: { id: 'plan-001', planName: 'Business Standard', billingCycle: 'yearly', pricePerUser: 1360 },
  },
  {
    id: 'assign-003',
    tenantId: 'tenant-1',
    serviceId: 'saas-002',
    planId: 'plan-002',
    userId: 'user-001',
    userName: '田中太郎',
    userEmail: 'tanaka@example.com',
    userDepartment: '営業部',
    assignedDate: new Date('2024-02-01'),
    expiryDate: new Date('2024-12-31'),
    status: 'active',
    isActive: true,
    notes: null,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    service: { id: 'saas-002', name: 'Slack', category: 'communication', licenseType: 'per_user' },
    plan: { id: 'plan-002', planName: 'Pro', billingCycle: 'monthly', pricePerUser: 925 },
  },
  {
    id: 'assign-004',
    tenantId: 'tenant-1',
    serviceId: 'saas-003',
    planId: 'plan-003',
    userId: 'user-003',
    userName: '佐藤次郎',
    userEmail: 'sato@example.com',
    userDepartment: '開発部',
    assignedDate: new Date('2024-02-15'),
    expiryDate: new Date('2024-12-31'),
    status: 'active',
    isActive: true,
    notes: '開発者ライセンス',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
    service: { id: 'saas-003', name: 'Salesforce', category: 'crm', licenseType: 'per_user' },
    plan: { id: 'plan-003', planName: 'Enterprise', billingCycle: 'yearly', pricePerUser: 18000 },
  },
];

// GET /api/saas/assignments - ライセンス割り当て一覧取得
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return successResponse(demoLicenseAssignments, {
        count: demoLicenseAssignments.length,
        pagination: { page: 1, limit: 20, total: demoLicenseAssignments.length, totalPages: 1 },
        cacheSeconds: 60,
      });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
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
    const total = await prisma.saas_license_assignments.count({ where });

    // ライセンス割り当て一覧取得（select最適化）
    const assignments = await prisma.saas_license_assignments.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        serviceId: true,
        planId: true,
        userId: true,
        userName: true,
        userEmail: true,
        departmentId: true,
        departmentName: true,
        assignedDate: true,
        revokedDate: true,
        status: true,
        lastUsedAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        saas_services: {
          select: {
            id: true,
            name: true,
            category: true,
            licenseType: true,
          },
        },
        saas_license_plans: {
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
      tenantId = 'tenant-1',
      serviceId,
      planId,
      userId,
      userName,
      userEmail,
      userDepartment,
      assignedDate,
      expiryDate: _expiryDate,
      isActive: _isActive = true,
      notes,
    } = body;
    // expiryDate と isActive は将来の機能拡張用
    void _expiryDate;
    void _isActive;

    if (!serviceId || !userId || !userName) {
      return NextResponse.json(
        {
          success: false,
          error: 'サービスID、ユーザーID、ユーザー名は必須です',
        },
        { status: 400 }
      );
    }

    const assignment = await prisma.saas_license_assignments.create({
      data: {
        id: `assign-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        serviceId,
        planId,
        userId,
        userName,
        userEmail,
        departmentName: userDepartment,
        assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
        updatedAt: new Date(),
        notes,
      },
      include: {
        saas_services: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        saas_license_plans: true,
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
