import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getTenantIdFromRequest,
  successResponse,
  handleApiError,
  validateRequired,
} from '@/lib/api/api-helpers';

// デモ用医療機関データ
const demoInstitutions = [
  {
    id: 'inst-001',
    tenantId: 'tenant-1',
    name: '東京健診センター',
    code: 'tokyo-kenshin',
    address: '東京都千代田区丸の内1-1-1',
    phone: '03-1234-5678',
    isActive: true,
    sortOrder: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'inst-002',
    tenantId: 'tenant-1',
    name: '新宿メディカルクリニック',
    code: 'shinjuku-medical',
    address: '東京都新宿区西新宿2-2-2',
    phone: '03-2345-6789',
    isActive: true,
    sortOrder: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'inst-003',
    tenantId: 'tenant-1',
    name: '渋谷健康管理センター',
    code: 'shibuya-health',
    address: '東京都渋谷区道玄坂3-3-3',
    phone: '03-3456-7890',
    isActive: true,
    sortOrder: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// 医療機関一覧取得
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return successResponse(demoInstitutions);
    }

    const searchParams = request.nextUrl.searchParams;
    const tenantId = await getTenantIdFromRequest(request);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: Record<string, unknown> = { tenantId };
    if (activeOnly) {
      where.isActive = true;
    }

    const institutions = await prisma.health_medical_institutions.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return successResponse(institutions);
  } catch (error) {
    return handleApiError(error, '医療機関の取得');
  }
}

// 医療機関追加
export async function POST(request: NextRequest) {
  try {
    // デモモードの場合は成功レスポンスを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const body = await request.json();
      const newInst = {
        id: `inst-${Date.now()}`,
        ...body,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return NextResponse.json({ success: true, data: newInst }, { status: 201 });
    }

    const body = await request.json();
    const { tenantId, name, code, address, phone, isActive, sortOrder } = body;

    const validation = validateRequired(body, ['tenantId', 'name']);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const institution = await prisma.health_medical_institutions.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        name,
        code,
        address,
        phone,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: institution }, { status: 201 });
  } catch (error) {
    return handleApiError(error, '医療機関の追加');
  }
}

// 医療機関更新
export async function PUT(request: NextRequest) {
  try {
    // デモモードの場合は成功レスポンスを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const body = await request.json();
      return NextResponse.json({ success: true, data: { ...body, updatedAt: new Date() } });
    }

    const body = await request.json();
    const { id, name, code, address, phone, isActive, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    }

    const institution = await prisma.health_medical_institutions.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
        updatedAt: new Date(),
      },
    });

    return successResponse(institution);
  } catch (error) {
    return handleApiError(error, '医療機関の更新');
  }
}

// 医療機関削除
export async function DELETE(request: NextRequest) {
  try {
    // デモモードの場合は成功レスポンスを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return NextResponse.json({ success: true });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    }

    await prisma.health_medical_institutions.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, '医療機関の削除');
  }
}
