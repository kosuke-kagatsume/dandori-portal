import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 修理記録の詳細を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-1';

    const record = await prisma.repair_records.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        pc_assets: {
          select: {
            id: true,
            assetNumber: true,
            manufacturer: true,
            model: true,
          },
        },
        general_assets: {
          select: {
            id: true,
            assetNumber: true,
            category: true,
            name: true,
            manufacturer: true,
            model: true,
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Repair record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching repair record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch repair record' },
      { status: 500 }
    );
  }
}

// PUT: 修理記録を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-1';

    const body = await request.json();

    // 存在確認
    const existing = await prisma.repair_records.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Repair record not found' },
        { status: 404 }
      );
    }

    const record = await prisma.repair_records.update({
      where: { id: params.id },
      data: {
        pcAssetId: body.pcAssetId || null,
        generalAssetId: body.generalAssetId || null,
        repairType: body.repairType,
        date: new Date(body.date),
        cost: body.cost,
        vendorId: body.vendorId || null,
        vendorName: body.vendorName || null,
        symptom: body.symptom || null,
        description: body.description || null,
        status: body.status || 'completed',
        completedDate: body.completedDate ? new Date(body.completedDate) : null,
        performedBy: body.performedBy || null,
        performedByName: body.performedByName || null,
        notes: body.notes || null,
      },
      include: {
        pc_assets: {
          select: {
            id: true,
            assetNumber: true,
            manufacturer: true,
            model: true,
          },
        },
        general_assets: {
          select: {
            id: true,
            assetNumber: true,
            category: true,
            name: true,
            manufacturer: true,
            model: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error updating repair record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update repair record' },
      { status: 500 }
    );
  }
}

// DELETE: 修理記録を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-1';

    // 存在確認
    const existing = await prisma.repair_records.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Repair record not found' },
        { status: 404 }
      );
    }

    await prisma.repair_records.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting repair record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete repair record' },
      { status: 500 }
    );
  }
}
