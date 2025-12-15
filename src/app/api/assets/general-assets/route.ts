import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

// デモ用汎用資産データ
const demoGeneralAssets = [
  {
    id: 'asset-001',
    tenantId: 'tenant-demo-001',
    assetNumber: 'GA-001',
    category: 'office_equipment',
    name: '複合機 MX-3661',
    manufacturer: 'シャープ',
    model: 'MX-3661',
    serialNumber: 'SHARP001',
    assignedUserName: '総務部',
    ownershipType: 'leased',
    leaseMonthlyCost: 35000,
    leaseStartDate: new Date('2023-01-01'),
    leaseEndDate: new Date('2028-12-31'),
    status: 'active',
    notes: '本社3階設置',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-15'),
    repairRecords: [],
  },
  {
    id: 'asset-002',
    tenantId: 'tenant-demo-001',
    assetNumber: 'GA-002',
    category: 'furniture',
    name: '会議テーブル（大）',
    manufacturer: 'オカムラ',
    model: 'CT-2400',
    assignedUserName: '会議室A',
    ownershipType: 'owned',
    purchaseDate: new Date('2022-06-15'),
    purchaseCost: 280000,
    status: 'active',
    notes: '12人用会議テーブル',
    createdAt: new Date('2022-06-15'),
    updatedAt: new Date('2022-06-15'),
    repairRecords: [],
  },
];

// GET: 汎用資産一覧を取得
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return NextResponse.json({ success: true, data: demoGeneralAssets });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';

    const assets = await prisma.general_assets.findMany({
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

    const asset = await prisma.general_assets.create({
      data: {
        id: randomUUID(),
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
        updatedAt: new Date(),
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
