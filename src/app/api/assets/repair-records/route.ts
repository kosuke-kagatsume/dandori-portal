import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// デモ用修理記録データ
const demoRepairRecords = [
  {
    id: 'repair-001',
    tenantId: 'tenant-demo-001',
    pcAssetId: 'pc-001',
    repairType: 'hardware',
    date: new Date('2024-01-20'),
    cost: 25000,
    symptom: 'キーボード一部キー反応なし',
    description: 'キーボード交換',
    status: 'completed',
    completedDate: new Date('2024-01-25'),
    performedByName: 'Dell サポート',
    notes: '保証期間内対応',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-25'),
    pcAsset: { id: 'pc-001', assetNumber: 'PC-001', manufacturer: 'Dell', model: 'Latitude 5520' },
    generalAsset: null,
  },
  {
    id: 'repair-002',
    tenantId: 'tenant-demo-001',
    generalAssetId: 'asset-001',
    repairType: 'maintenance',
    date: new Date('2024-02-10'),
    cost: 15000,
    symptom: '印刷品質低下',
    description: 'ドラムユニット交換、クリーニング',
    status: 'completed',
    completedDate: new Date('2024-02-10'),
    performedByName: 'シャープサービス',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
    pcAsset: null,
    generalAsset: { id: 'asset-001', assetNumber: 'GA-001', category: 'office_equipment', name: '複合機 MX-3661', manufacturer: 'シャープ', model: 'MX-3661' },
  },
];

// GET: 修理記録一覧を取得
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return NextResponse.json({ success: true, data: demoRepairRecords });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';

    const records = await prisma.repair_records.findMany({
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

    const record = await prisma.repair_records.create({
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
