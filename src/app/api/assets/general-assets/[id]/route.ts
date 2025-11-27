import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 汎用資産の詳細を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';

    const asset = await prisma.generalAsset.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        repairRecords: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: asset });
  } catch (error) {
    console.error('Error fetching general asset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch general asset' },
      { status: 500 }
    );
  }
}

// PUT: 汎用資産を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';

    const body = await request.json();

    // 存在確認
    const existing = await prisma.generalAsset.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    const asset = await prisma.generalAsset.update({
      where: { id: params.id },
      data: {
        assetNumber: body.assetNumber,
        category: body.category,
        name: body.name,
        manufacturer: body.manufacturer || null,
        model: body.model || null,
        serialNumber: body.serialNumber || null,
        specifications: body.specifications || null,
        assignedUserId: body.assignedUserId || null,
        assignedUserName: body.assignedUserName || null,
        assignedDate: body.assignedDate ? new Date(body.assignedDate) : null,
        ownershipType: body.ownershipType || 'owned',
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchaseCost: body.purchaseCost || null,
        leaseCompany: body.leaseCompany || null,
        leaseMonthlyCost: body.leaseMonthlyCost || null,
        leaseStartDate: body.leaseStartDate ? new Date(body.leaseStartDate) : null,
        leaseEndDate: body.leaseEndDate ? new Date(body.leaseEndDate) : null,
        warrantyExpiration: body.warrantyExpiration ? new Date(body.warrantyExpiration) : null,
        status: body.status || 'active',
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, data: asset });
  } catch (error) {
    console.error('Error updating general asset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update general asset' },
      { status: 500 }
    );
  }
}

// DELETE: 汎用資産を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';

    // 存在確認
    const existing = await prisma.generalAsset.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    await prisma.generalAsset.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting general asset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete general asset' },
      { status: 500 }
    );
  }
}
