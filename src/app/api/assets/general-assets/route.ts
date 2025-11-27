import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 汎用資産一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';

    const assets = await prisma.generalAsset.findMany({
      where: { tenantId },
      include: {
        repairRecords: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: assets });
  } catch (error) {
    console.error('Error fetching general assets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch general assets' },
      { status: 500 }
    );
  }
}

// POST: 汎用資産を作成
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';

    const body = await request.json();

    const asset = await prisma.generalAsset.create({
      data: {
        tenantId,
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

    return NextResponse.json({ success: true, data: asset }, { status: 201 });
  } catch (error) {
    console.error('Error creating general asset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create general asset' },
      { status: 500 }
    );
  }
}
