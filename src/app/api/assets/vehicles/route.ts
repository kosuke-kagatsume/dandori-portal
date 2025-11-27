import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/assets/vehicles - 車両一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';
    const status = searchParams.get('status');
    const ownershipType = searchParams.get('ownershipType');

    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;
    if (ownershipType) where.ownershipType = ownershipType;

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        monthlyMileages: {
          orderBy: { month: 'desc' },
          take: 12,
        },
        maintenanceRecords: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
      orderBy: { vehicleNumber: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: vehicles,
      count: vehicles.length,
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch vehicles',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
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
      monthlyLeaseCost,
      purchaseDate,
      purchasePrice,
      inspectionDate,
      insuranceExpiry,
      status = 'active',
      notes,
    } = body;

    // バリデーション
    if (!vehicleNumber || !licensePlate || !make || !model || !year) {
      return NextResponse.json(
        {
          success: false,
          error: '車両番号、ナンバープレート、メーカー、車種、年式は必須です',
        },
        { status: 400 }
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
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create vehicle',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
