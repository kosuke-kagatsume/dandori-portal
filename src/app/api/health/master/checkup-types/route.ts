import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getTenantIdFromRequest,
  successResponse,
  handleApiError,
  validateRequired,
} from '@/lib/api/api-helpers';

// 健診種別一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = await getTenantIdFromRequest(request);
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
