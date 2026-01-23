import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/assets/monthly-mileages/[id] - 月間走行距離詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mileage = await prisma.monthly_mileages.findUnique({
      where: { id: params.id },
      include: {
        vehicles: {
          select: {
            id: true,
            vehicleNumber: true,
            licensePlate: true,
            make: true,
            model: true,
          },
        },
      },
    });

    if (!mileage) {
      return NextResponse.json(
        { success: false, error: '月間走行距離記録が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mileage,
    });
  } catch (error) {
    console.error('Error fetching monthly mileage:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch monthly mileage',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/assets/monthly-mileages/[id] - 月間走行距離更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      distance,
      recordedBy,
      recordedByName,
    } = body;

    const mileage = await prisma.monthly_mileages.update({
      where: { id: params.id },
      data: {
        distance: distance !== undefined ? parseInt(distance, 10) : undefined,
        recordedBy,
        recordedByName,
      },
      include: {
        vehicles: {
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
    console.error('Error updating monthly mileage:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update monthly mileage',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/monthly-mileages/[id] - 月間走行距離削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.monthly_mileages.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: '月間走行距離記録を削除しました',
    });
  } catch (error) {
    console.error('Error deleting monthly mileage:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete monthly mileage',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
