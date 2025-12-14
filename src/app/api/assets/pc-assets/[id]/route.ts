import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/assets/pc-assets/[id] - PC資産詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pcAsset = await prisma.pc_assets.findUnique({
      where: { id: params.id },
      include: {
        softwareLicenses: true,
      },
    });

    if (!pcAsset) {
      return NextResponse.json(
        { success: false, error: 'PC資産が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pcAsset,
    });
  } catch (error) {
    console.error('Error fetching PC asset:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch PC asset',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/assets/pc-assets/[id] - PC資産更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      assetNumber,
      manufacturer,
      model,
      serialNumber,
      cpu,
      memory,
      storage,
      os,
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
      warrantyExpiry,
      status,
      notes,
    } = body;

    const pcAsset = await prisma.pc_assets.update({
      where: { id: params.id },
      data: {
        assetNumber,
        manufacturer,
        model,
        serialNumber,
        cpu,
        memory,
        storage,
        os,
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
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        status,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      data: pcAsset,
    });
  } catch (error) {
    console.error('Error updating PC asset:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update PC asset',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/pc-assets/[id] - PC資産削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 関連するソフトウェアライセンスも削除
    await prisma.software_licenses.deleteMany({
      where: { pcAssetId: params.id },
    });

    await prisma.pc_assets.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'PC資産を削除しました',
    });
  } catch (error) {
    console.error('Error deleting PC asset:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete PC asset',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
