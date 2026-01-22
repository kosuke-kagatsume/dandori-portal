import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';
import { createMaintenanceRecordSchema, validateWithSchema } from '@/lib/validation/asset-schemas';

// デモ用メンテナンス記録データ
const demoMaintenanceRecords = [
  {
    id: 'maint-001',
    tenantId: 'tenant-1',
    vehicleId: 'vehicle-001',
    type: 'oil_change',
    date: new Date('2024-02-20'),
    mileage: 45000,
    cost: 8500,
    description: 'エンジンオイル交換、オイルフィルター交換',
    nextDueDate: new Date('2024-08-20'),
    nextDueMileage: 50000,
    performedByName: 'トヨタモビリティサービス',
    notes: '純正オイル使用',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
    vehicle: { id: 'vehicle-001', vehicleNumber: 'V-001', licensePlate: '品川 300 あ 1234', make: 'トヨタ', model: 'プリウス' },
    vendor: { id: 'vendor-001', name: 'トヨタモビリティサービス', phone: '03-1234-5678' },
  },
  {
    id: 'maint-002',
    tenantId: 'tenant-1',
    vehicleId: 'vehicle-002',
    type: 'tire_change',
    date: new Date('2024-01-15'),
    mileage: 32000,
    cost: 48000,
    description: 'スタッドレスタイヤに交換',
    tireType: 'winter',
    performedByName: 'オートバックス品川店',
    notes: 'ブリヂストン製',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    vehicle: { id: 'vehicle-002', vehicleNumber: 'V-002', licensePlate: '品川 500 い 5678', make: 'ホンダ', model: 'フィット' },
    vendor: { id: 'vendor-002', name: 'オートバックス品川店', phone: '03-9876-5432' },
  },
];

// GET /api/assets/maintenance-records - メンテナンス記録一覧取得
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return successResponse(demoMaintenanceRecords, {
        count: demoMaintenanceRecords.length,
        pagination: { page: 1, limit: 20, total: demoMaintenanceRecords.length, totalPages: 1 },
        cacheSeconds: 60,
      });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const vehicleId = searchParams.get('vehicleId');
    const type = searchParams.get('type');
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };
    if (vehicleId) where.vehicleId = vehicleId;
    if (type) where.type = type;

    // 総件数取得
    const total = await prisma.maintenance_records.count({ where });

    // メンテナンス記録一覧取得（select最適化）
    const records = await prisma.maintenance_records.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        vehicleId: true,
        vendorId: true,
        type: true,
        date: true,
        mileage: true,
        cost: true,
        description: true,
        nextDueDate: true,
        nextDueMileage: true,
        tireType: true,
        performedBy: true,
        performedByName: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        vehicles: {
          select: {
            id: true,
            vehicleNumber: true,
            licensePlate: true,
            make: true,
            model: true,
          },
        },
        vendors: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    });

    return successResponse(records, {
      count: records.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 60, // 1分キャッシュ
    });
  } catch (error) {
    return handleApiError(error, 'メンテナンス記録一覧の取得');
  }
}

// POST /api/assets/maintenance-records - メンテナンス記録作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Zodバリデーション
    const validation = validateWithSchema(createMaintenanceRecordSchema, body);
    if (!validation.success) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    const data = validation.data;

    // mileageとnextDueMileageの変換
    const mileage = data.mileage
      ? typeof data.mileage === 'string'
        ? parseInt(data.mileage, 10)
        : data.mileage
      : null;
    const nextDueMileage = data.nextDueMileage
      ? typeof data.nextDueMileage === 'string'
        ? parseInt(data.nextDueMileage, 10)
        : data.nextDueMileage
      : null;

    // costの型変換
    const costValue = typeof data.cost === 'number' ? data.cost : parseInt(String(data.cost), 10);

    const createData: Prisma.maintenance_recordsUncheckedCreateInput = {
      id: randomUUID(),
      tenantId: data.tenantId || 'tenant-1',
      vehicleId: data.vehicleId,
      type: data.type,
      date: new Date(data.date),
      mileage: mileage ?? undefined,
      cost: costValue,
      vendorId: data.vendorId ?? undefined,
      description: data.description ?? undefined,
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
      nextDueMileage: nextDueMileage ?? undefined,
      tireType: data.tireType ?? undefined,
      performedBy: data.performedBy ?? undefined,
      performedByName: data.performedByName ?? undefined,
      notes: data.notes ?? undefined,
      updatedAt: new Date(),
    };

    const record = await prisma.maintenance_records.create({
      data: createData,
      include: {
        vehicles: {
          select: {
            id: true,
            vehicleNumber: true,
            licensePlate: true,
          },
        },
        vendors: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return successResponse(record);
  } catch (error) {
    return handleApiError(error, 'メンテナンス記録作成');
  }
}
