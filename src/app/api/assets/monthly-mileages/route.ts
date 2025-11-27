import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/assets/monthly-mileages - 月間走行距離一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';
    const vehicleId = searchParams.get('vehicleId');
    const month = searchParams.get('month'); // YYYY-MM形式

    const where: Record<string, unknown> = { tenantId };
    if (vehicleId) where.vehicleId = vehicleId;
    if (month) where.month = month;

    const mileages = await prisma.monthlyMileage.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            vehicleNumber: true,
            licensePlate: true,
            make: true,
            model: true,
          },
        },
      },
      orderBy: { month: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: mileages,
      count: mileages.length,
    });
  } catch (error) {
    console.error('Error fetching monthly mileages:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch monthly mileages',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/assets/monthly-mileages - 月間走行距離登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-demo-001',
      vehicleId,
      month,
      distance,
      recordedBy,
      recordedByName,
    } = body;

    // バリデーション
    if (!vehicleId || !month || distance === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: '車両ID、月、走行距離は必須です',
        },
        { status: 400 }
      );
    }

    // 既存レコードがあれば更新、なければ作成（upsert）
    const mileage = await prisma.monthlyMileage.upsert({
      where: {
        vehicleId_month: {
          vehicleId,
          month,
        },
      },
      update: {
        distance: parseInt(distance, 10),
        recordedBy,
        recordedByName,
      },
      create: {
        tenantId,
        vehicleId,
        month,
        distance: parseInt(distance, 10),
        recordedBy,
        recordedByName,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            vehicleNumber: true,
            licensePlate: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: mileage,
    });
  } catch (error) {
    console.error('Error creating monthly mileage:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create monthly mileage',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
