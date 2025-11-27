import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET /api/assets/maintenance-records - メンテナンス記録一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const vehicleId = searchParams.get('vehicleId');
    const type = searchParams.get('type');
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };
    if (vehicleId) where.vehicleId = vehicleId;
    if (type) where.type = type;

    // 総件数取得
    const total = await prisma.maintenanceRecord.count({ where });

    // メンテナンス記録一覧取得（select最適化）
    const records = await prisma.maintenanceRecord.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        vehicleId: true,
        vendorId: true,
        type: true,
        date: true,
        mileage: true,
        cost: true,
        description: true,
        nextDueDate: true,
        nextDueMileage: true,
        tireType: true,
        performedBy: true,
        performedByName: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        vehicle: {
          select: {
            id: true,
            vehicleNumber: true,
            licensePlate: true,
            make: true,
            model: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    });

    return successResponse(records, {
      count: records.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 60, // 1分キャッシュ
    });
  } catch (error) {
    return handleApiError(error, 'メンテナンス記録一覧の取得');
  }
}

// POST /api/assets/maintenance-records - メンテナンス記録作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-demo-001',
      vehicleId,
      type,
      date,
      mileage,
      cost,
      vendorId,
      description,
      nextDueDate,
      nextDueMileage,
      tireType,
      performedBy,
      performedByName,
      notes,
    } = body;

    // バリデーション
    if (!vehicleId || !type || !date || cost === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: '車両ID、種別、日付、費用は必須です',
        },
        { status: 400 }
      );
    }

    const record = await prisma.maintenanceRecord.create({
      data: {
        tenantId,
        vehicleId,
        type,
        date: new Date(date),
        mileage: mileage ? parseInt(mileage, 10) : null,
        cost: parseInt(cost, 10),
        vendorId: vendorId || null,
        description,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        nextDueMileage: nextDueMileage ? parseInt(nextDueMileage, 10) : null,
        tireType,
        performedBy,
        performedByName,
        notes,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            vehicleNumber: true,
            licensePlate: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create maintenance record',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
