import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 修理記録一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';

    const records = await prisma.repairRecord.findMany({
      where: { tenantId },
      include: {
        pcAsset: {
          select: {
            id: true,
            assetNumber: true,
            manufacturer: true,
            model: true,
          },
        },
        generalAsset: {
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
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching repair records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch repair records' },
      { status: 500 }
    );
  }
}

// POST: 修理記録を作成
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';

    const body = await request.json();

    // PC資産または汎用資産のどちらかが必須
    if (!body.pcAssetId && !body.generalAssetId) {
      return NextResponse.json(
        { success: false, error: 'Either pcAssetId or generalAssetId is required' },
        { status: 400 }
      );
    }

    const record = await prisma.repairRecord.create({
      data: {
        tenantId,
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
        pcAsset: {
          select: {
            id: true,
            assetNumber: true,
            manufacturer: true,
            model: true,
          },
        },
        generalAsset: {
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

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error('Error creating repair record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create repair record' },
      { status: 500 }
    );
  }
}
