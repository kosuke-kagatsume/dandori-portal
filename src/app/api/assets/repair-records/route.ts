import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantId,
} from '@/lib/api/api-helpers';
import { createRepairRecordSchema, validateWithSchema } from '@/lib/validation/asset-schemas';

// デモ用修理記録データ
const demoRepairRecords = [
  {
    id: 'repair-001',
    tenantId: 'tenant-1',
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
    tenantId: 'tenant-1',
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
      return successResponse(demoRepairRecords, {
        count: demoRepairRecords.length,
        cacheSeconds: 60,
      });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    const records = await prisma.repair_records.findMany({
      where: { tenantId },
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
      orderBy: { date: 'desc' },
    });

    return successResponse(records, {
      count: records.length,
      cacheSeconds: 60,
    });
  } catch (error) {
    return handleApiError(error, '修理記録一覧取得');
  }
}

// POST: 修理記録を作成
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    const body = await request.json();

    // Zodバリデーション（PC資産または汎用資産のどちらかが必須のチェック含む）
    const validation = validateWithSchema(createRepairRecordSchema, body);
    if (!validation.success) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    const data = validation.data;

    const createData: Prisma.repair_recordsUncheckedCreateInput = {
      id: randomUUID(),
      tenantId: data.tenantId || tenantId,
      pcAssetId: data.pcAssetId ?? undefined,
      generalAssetId: data.generalAssetId ?? undefined,
      repairType: data.repairType,
      date: new Date(data.date),
      cost: data.cost,
      vendorId: data.vendorId ?? undefined,
      vendorName: data.vendorName ?? undefined,
      symptom: data.symptom ?? undefined,
      description: data.description ?? undefined,
      status: data.status,
      completedDate: data.completedDate ? new Date(data.completedDate) : undefined,
      performedBy: data.performedBy ?? undefined,
      performedByName: data.performedByName ?? undefined,
      notes: data.notes ?? undefined,
      updatedAt: new Date(),
    };

    const record = await prisma.repair_records.create({
      data: createData,
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

    return successResponse(record);
  } catch (error) {
    return handleApiError(error, '修理記録登録');
  }
}
