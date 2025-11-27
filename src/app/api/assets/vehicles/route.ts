import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET /api/assets/vehicles - 車両一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const status = searchParams.get('status');
    const ownershipType = searchParams.get('ownershipType');
    const includeDetails = searchParams.get('include') === 'details';
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;
    if (ownershipType) where.ownershipType = ownershipType;

    // 総件数取得（ページネーション用）
    const total = await prisma.vehicle.count({ where });

    // 一覧用：必要最小限のフィールドのみ取得
    // 詳細用：関連データも含める
    const vehicles = await prisma.vehicle.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        vehicleNumber: true,
        licensePlate: true,
        make: true,
        model: true,
        year: true,
        color: true,
        ownershipType: true,
        status: true,
        assignedUserId: true,
        assignedUserName: true,
        assignedDate: true,
        inspectionDate: true,
        maintenanceDate: true,
        insuranceDate: true,
        tireChangeDate: true,
        currentTireType: true,
        leaseMonthlyCost: true,
        leaseStartDate: true,
        leaseEndDate: true,
        purchaseCost: true,
        purchaseDate: true,
        currentMileage: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        // 詳細リクエスト時のみ関連データを含める
        ...(includeDetails && {
          monthlyMileages: {
            orderBy: { month: 'desc' as const },
            take: 12,
            select: {
              id: true,
              month: true,
              distance: true,
            },
          },
          maintenanceRecords: {
            orderBy: { date: 'desc' as const },
            take: 5,
            select: {
              id: true,
              type: true,
              date: true,
              cost: true,
              description: true,
            },
          },
        }),
      },
      orderBy: { vehicleNumber: 'asc' },
      skip,
      take: limit,
    });

    return successResponse(vehicles, {
      count: vehicles.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 60, // 1分キャッシュ
    });
  } catch (error) {
    return handleApiError(error, '車両一覧の取得');
  }
}

// POST /api/assets/vehicles - 車両登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-demo-001',
      vehicleNumber,
      licensePlate,
      make,
      model,
      year,
      color,
      assignedUserId,
      assignedUserName,
      assignedDate,
      ownershipType = 'owned',
      leaseCompany,
      leaseStartDate,
      leaseEndDate,
      leaseMonthlyCost,
      purchaseDate,
      purchaseCost,
      inspectionDate,
      insuranceDate,
      maintenanceDate,
      tireChangeDate,
      currentTireType,
      status = 'active',
      notes,
    } = body;

    // バリデーション
    if (!vehicleNumber || !licensePlate || !make || !model || !year) {
      return handleApiError(
        new Error('車両番号、ナンバープレート、メーカー、車種、年式は必須です'),
        '車両登録'
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId,
        vehicleNumber,
        licensePlate,
        make,
        model,
        year,
        color,
        assignedUserId,
        assignedUserName,
        assignedDate: assignedDate ? new Date(assignedDate) : null,
        ownershipType,
        leaseCompany,
        leaseStartDate: leaseStartDate ? new Date(leaseStartDate) : null,
        leaseEndDate: leaseEndDate ? new Date(leaseEndDate) : null,
        leaseMonthlyCost,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseCost,
        inspectionDate: inspectionDate ? new Date(inspectionDate) : null,
        insuranceDate: insuranceDate ? new Date(insuranceDate) : null,
        maintenanceDate: maintenanceDate ? new Date(maintenanceDate) : null,
        tireChangeDate: tireChangeDate ? new Date(tireChangeDate) : null,
        currentTireType,
        status,
        notes,
      },
    });

    return successResponse(vehicle);
  } catch (error) {
    return handleApiError(error, '車両登録');
  }
}
