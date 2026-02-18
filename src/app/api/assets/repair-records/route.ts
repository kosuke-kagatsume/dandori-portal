import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';
import { createRepairRecordSchema, validateWithSchema } from '@/lib/validation/asset-schemas';

// GET: 修理記録一覧を取得
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

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
    const tenantId = await getTenantIdFromRequest(request);

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
