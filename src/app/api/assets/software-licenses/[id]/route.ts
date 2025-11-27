import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/assets/software-licenses/[id] - ソフトウェアライセンス詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const license = await prisma.softwareLicense.findUnique({
      where: { id: params.id },
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
    });

    if (!license) {
      return NextResponse.json(
        { success: false, error: 'ソフトウェアライセンスが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: license,
    });
  } catch (error) {
    console.error('Error fetching software license:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch software license',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/assets/software-licenses/[id] - ソフトウェアライセンス更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      softwareName,
      licenseKey,
      expirationDate,
      monthlyCost,
    } = body;

    const license = await prisma.softwareLicense.update({
      where: { id: params.id },
      data: {
        softwareName,
        licenseKey,
        expirationDate: expirationDate !== undefined ? (expirationDate ? new Date(expirationDate) : null) : undefined,
        monthlyCost: monthlyCost !== undefined ? (monthlyCost ? parseInt(monthlyCost, 10) : null) : undefined,
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
    console.error('Error updating software license:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update software license',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/software-licenses/[id] - ソフトウェアライセンス削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.softwareLicense.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'ソフトウェアライセンスを削除しました',
    });
  } catch (error) {
    console.error('Error deleting software license:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete software license',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
