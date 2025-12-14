import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/assets/maintenance-records/[id] - メンテナンス記録詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const record = await prisma.maintenance_records.findUnique({
      where: { id: params.id },
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
        vendor: {
          select: {
            id: true,
            name: true,
            phone: true,
            contactPerson: true,
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'メンテナンス記録が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('Error fetching maintenance record:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch maintenance record',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/assets/maintenance-records/[id] - メンテナンス記録更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
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

    const record = await prisma.maintenance_records.update({
      where: { id: params.id },
      data: {
        type,
        date: date ? new Date(date) : undefined,
        mileage: mileage !== undefined ? (mileage ? parseInt(mileage, 10) : null) : undefined,
        cost: cost !== undefined ? parseInt(cost, 10) : undefined,
        vendorId: vendorId !== undefined ? (vendorId || null) : undefined,
        description,
        nextDueDate: nextDueDate !== undefined ? (nextDueDate ? new Date(nextDueDate) : null) : undefined,
        nextDueMileage: nextDueMileage !== undefined ? (nextDueMileage ? parseInt(nextDueMileage, 10) : null) : undefined,
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
    console.error('Error updating maintenance record:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update maintenance record',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/maintenance-records/[id] - メンテナンス記録削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.maintenance_records.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'メンテナンス記録を削除しました',
    });
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete maintenance record',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
