import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';
import { createVehicleSchema, validateWithSchema } from '@/lib/validation/asset-schemas';

// デモ用車両データ
const demoVehicles = [
  {
    id: 'vehicle-001',
    tenantId: 'tenant-demo-001',
    vehicleNumber: 'V-001',
    licensePlate: '品川 300 あ 1234',
    make: 'トヨタ',
    model: 'プリウス',
    year: 2022,
    color: '白',
    ownershipType: 'owned',
    status: 'active',
    assignedUserId: 'user-001',
    assignedUserName: '田中太郎',
    assignedDate: new Date('2022-04-01'),
    inspectionDate: new Date('2024-04-15'),
    maintenanceDate: new Date('2024-02-20'),
    insuranceDate: new Date('2024-06-01'),
    currentMileage: 45000,
    purchaseCost: 3200000,
    purchaseDate: new Date('2022-03-15'),
    notes: '営業用車両',
    createdAt: new Date('2022-03-15'),
    updatedAt: new Date('2024-02-20'),
  },
  {
    id: 'vehicle-002',
    tenantId: 'tenant-demo-001',
    vehicleNumber: 'V-002',
    licensePlate: '品川 500 い 5678',
    make: 'ホンダ',
    model: 'フィット',
    year: 2021,
    color: '青',
    ownershipType: 'leased',
    status: 'active',
    assignedUserId: 'user-002',
    assignedUserName: '鈴木花子',
    assignedDate: new Date('2021-07-01'),
    inspectionDate: new Date('2024-07-20'),
    maintenanceDate: new Date('2024-01-15'),
    insuranceDate: new Date('2024-08-01'),
    currentMileage: 32000,
    leaseMonthlyCost: 45000,
    leaseStartDate: new Date('2021-07-01'),
    leaseEndDate: new Date('2026-06-30'),
    notes: '通勤用車両',
    createdAt: new Date('2021-07-01'),
    updatedAt: new Date('2024-01-15'),
  },
];

// GET /api/assets/vehicles - 車両一覧取得
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return successResponse(demoVehicles, {
        count: demoVehicles.length,
        pagination: { page: 1, limit: 20, total: demoVehicles.length, totalPages: 1 },
        cacheSeconds: 60,
      });
    }

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
    const total = await prisma.vehicles.count({ where });

    // 一覧用：必要最小限のフィールドのみ取得
    // 詳細用：関連データも含める
    const vehicles = await prisma.vehicles.findMany({
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

    // Zodバリデーション
    const validation = validateWithSchema(createVehicleSchema, body);
    if (!validation.success) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    const data = validation.data;

    const createData: Prisma.vehiclesUncheckedCreateInput = {
      id: randomUUID(),
      tenantId: data.tenantId || 'tenant-demo-001',
      vehicleNumber: data.vehicleNumber,
      licensePlate: data.licensePlate,
      make: data.make,
      model: data.model,
      year: data.year,
      color: data.color ?? undefined,
      assignedUserId: data.assignedUserId ?? undefined,
      assignedUserName: data.assignedUserName ?? undefined,
      assignedDate: data.assignedDate ? new Date(data.assignedDate) : undefined,
      ownershipType: data.ownershipType,
      leaseCompany: data.leaseCompany ?? undefined,
      leaseStartDate: data.leaseStartDate ? new Date(data.leaseStartDate) : undefined,
      leaseEndDate: data.leaseEndDate ? new Date(data.leaseEndDate) : undefined,
      leaseMonthlyCost: data.leaseMonthlyCost ?? undefined,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      purchaseCost: data.purchaseCost ?? undefined,
      inspectionDate: data.inspectionDate ? new Date(data.inspectionDate) : undefined,
      insuranceDate: data.insuranceDate ? new Date(data.insuranceDate) : undefined,
      maintenanceDate: data.maintenanceDate ? new Date(data.maintenanceDate) : undefined,
      tireChangeDate: data.tireChangeDate ? new Date(data.tireChangeDate) : undefined,
      currentTireType: data.currentTireType ?? undefined,
      status: data.status,
      notes: data.notes ?? undefined,
      updatedAt: new Date(),
    };

    const vehicle = await prisma.vehicles.create({
      data: createData,
    });

    return successResponse(vehicle);
  } catch (error) {
    return handleApiError(error, '車両登録');
  }
}
