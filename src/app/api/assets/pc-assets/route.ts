import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/assets/pc-assets - PC資産一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';
    const status = searchParams.get('status');
    const ownershipType = searchParams.get('ownershipType');

    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;
    if (ownershipType) where.ownershipType = ownershipType;

    const pcAssets = await prisma.pCAsset.findMany({
      where,
      include: {
        softwareLicenses: true,
      },
      orderBy: { assetNumber: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: pcAssets,
      count: pcAssets.length,
    });
  } catch (error) {
    console.error('Error fetching PC assets:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch PC assets',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/assets/pc-assets - PC資産登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-demo-001',
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
      ownershipType = 'owned',
      leaseCompany,
      leaseStartDate,
      leaseEndDate,
      monthlyLeaseCost,
      purchaseDate,
      purchasePrice,
      warrantyExpiry,
      status = 'active',
      notes,
    } = body;

    // バリデーション
    if (!assetNumber || !manufacturer || !model || !serialNumber) {
      return NextResponse.json(
        {
          success: false,
          error: '資産番号、メーカー、モデル、シリアル番号は必須です',
        },
        { status: 400 }
      );
    }

    const pcAsset = await prisma.pCAsset.create({
      data: {
        tenantId,
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
    console.error('Error creating PC asset:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create PC asset',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
