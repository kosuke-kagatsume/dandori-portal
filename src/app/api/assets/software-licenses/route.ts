import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/assets/software-licenses - ソフトウェアライセンス一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';
    const pcAssetId = searchParams.get('pcAssetId');

    const where: Record<string, unknown> = { tenantId };
    if (pcAssetId) where.pcAssetId = pcAssetId;

    const licenses = await prisma.software_licenses.findMany({
      where,
      include: {
        pcAsset: {
          select: {
            id: true,
            assetNumber: true,
            manufacturer: true,
            model: true,
            assignedUserName: true,
          },
        },
      },
      orderBy: { softwareName: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: licenses,
      count: licenses.length,
    });
  } catch (error) {
    console.error('Error fetching software licenses:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch software licenses',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/assets/software-licenses - ソフトウェアライセンス登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-demo-001',
      pcAssetId,
      softwareName,
      licenseKey,
      expirationDate,
      monthlyCost,
    } = body;

    // バリデーション
    if (!pcAssetId || !softwareName) {
      return NextResponse.json(
        {
          success: false,
          error: 'PC資産ID、ソフトウェア名は必須です',
        },
        { status: 400 }
      );
    }

    const license = await prisma.software_licenses.create({
      data: {
        tenantId,
        pcAssetId,
        softwareName,
        licenseKey,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        monthlyCost: monthlyCost ? parseInt(monthlyCost, 10) : null,
      },
      include: {
        pcAsset: {
          select: {
            id: true,
            assetNumber: true,
            manufacturer: true,
            model: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: license,
    });
  } catch (error) {
    console.error('Error creating software license:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create software license',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
