import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getTenantId,
  successResponse,
  handleApiError,
  validateRequired,
} from '@/lib/api/api-helpers';

// デモ用健診種別データ
const demoCheckupTypes = [
  {
    id: 'checkup-type-001',
    tenantId: 'tenant-1',
    name: '定期健康診断',
    code: 'regular',
    description: '年1回の定期健康診断',
    isActive: true,
    sortOrder: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'checkup-type-002',
    tenantId: 'tenant-1',
    name: '雇入時健診',
    code: 'pre_employment',
    description: '入社前の健康診断',
    isActive: true,
    sortOrder: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'checkup-type-003',
    tenantId: 'tenant-1',
    name: '特定健診',
    code: 'specific',
    description: '40歳以上対象の特定健診',
    isActive: true,
    sortOrder: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// 健診種別一覧取得
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return successResponse(demoCheckupTypes);
    }

    const searchParams = request.nextUrl.searchParams;
    const tenantId = getTenantId(searchParams);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: Record<string, unknown> = { tenantId };
    if (activeOnly) {
      where.isActive = true;
    }

    const checkupTypes = await prisma.health_checkup_types.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return successResponse(checkupTypes);
  } catch (error) {
    return handleApiError(error, '健診種別の取得');
  }
}

// 健診種別追加
export async function POST(request: NextRequest) {
  try {
    // デモモードの場合は成功レスポンスを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const body = await request.json();
      const newType = {
        id: `checkup-type-${Date.now()}`,
        ...body,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return NextResponse.json({ success: true, data: newType }, { status: 201 });
    }

    const body = await request.json();
    const { tenantId, name, code, description, isActive, sortOrder } = body;

    const validation = validateRequired(body, ['tenantId', 'name', 'code']);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const checkupType = await prisma.health_checkup_types.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        name,
        code,
        description,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: checkupType }, { status: 201 });
  } catch (error) {
    return handleApiError(error, '健診種別の追加');
  }
}

// 健診種別更新
export async function PUT(request: NextRequest) {
  try {
    // デモモードの場合は成功レスポンスを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const body = await request.json();
      return NextResponse.json({ success: true, data: { ...body, updatedAt: new Date() } });
    }

    const body = await request.json();
    const { id, name, code, description, isActive, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    }

    const checkupType = await prisma.health_checkup_types.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
        updatedAt: new Date(),
      },
    });

    return successResponse(checkupType);
  } catch (error) {
    return handleApiError(error, '健診種別の更新');
  }
}

// 健診種別削除
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

    await prisma.health_checkup_types.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, '健診種別の削除');
  }
}
