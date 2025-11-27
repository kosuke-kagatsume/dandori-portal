import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/assets/vendors - 業者一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';

    const vendors = await prisma.vendor.findMany({
      where: { tenantId },
      include: {
        maintenanceRecords: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: vendors,
      count: vendors.length,
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch vendors',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/assets/vendors - 業者登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-demo-001',
      name,
      phone,
      address,
      contactPerson,
      email,
      rating,
      notes,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: '業者名は必須です' },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.create({
      data: {
        tenantId,
        name,
        phone,
        address,
        contactPerson,
        email,
        rating,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create vendor',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
