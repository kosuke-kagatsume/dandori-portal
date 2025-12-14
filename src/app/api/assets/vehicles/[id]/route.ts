import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/assets/vehicles/[id] - 車両詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicle = await prisma.vehicles.findUnique({
      where: { id: params.id },
      include: {
        monthlyMileages: {
          orderBy: { yearMonth: 'desc' },
        },
        maintenanceRecords: {
          orderBy: { date: 'desc' },
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: '車両が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch vehicle',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/assets/vehicles/[id] - 車両更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      vehicleNumber,
      licensePlate,
      make,
      model,
      year,
      color,
      assignedUserId,
      assignedUserName,
      assignedDate,
      ownershipType,
      leaseCompany,
      leaseStartDate,
      leaseEndDate,
      monthlyLeaseCost,
      purchaseDate,
      purchasePrice,
      inspectionDate,
      insuranceExpiry,
      status,
      notes,
    } = body;

    const vehicle = await prisma.vehicles.update({
      where: { id: params.id },
      data: {
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
        monthlyLeaseCost,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice,
        inspectionDate: inspectionDate ? new Date(inspectionDate) : null,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        status,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update vehicle',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/vehicles/[id] - 車両削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 関連データも削除
    await prisma.monthly_mileages.deleteMany({
      where: { vehicleId: params.id },
    });
    await prisma.maintenance_records.deleteMany({
      where: { vehicleId: params.id },
    });

    await prisma.vehicles.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: '車両を削除しました',
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete vehicle',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
