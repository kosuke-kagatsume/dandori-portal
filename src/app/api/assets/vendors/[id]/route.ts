import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/assets/vendors/[id] - 業者詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: params.id },
      include: {
        maintenanceRecords: {
          orderBy: { date: 'desc' },
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
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: '業者が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch vendor',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/assets/vendors/[id] - 業者更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, phone, address, contactPerson, email, rating, notes } = body;

    const vendor = await prisma.vendor.update({
      where: { id: params.id },
      data: {
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
    console.error('Error updating vendor:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update vendor',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/vendors/[id] - 業者削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // メンテナンス記録との関連を確認
    const recordCount = await prisma.maintenanceRecord.count({
      where: { vendorId: params.id },
    });

    if (recordCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `この業者には${recordCount}件のメンテナンス記録があるため削除できません`,
        },
        { status: 400 }
      );
    }

    await prisma.vendor.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: '業者を削除しました',
    });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete vendor',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
