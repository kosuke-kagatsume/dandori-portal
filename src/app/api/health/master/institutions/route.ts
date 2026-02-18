import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getTenantIdFromRequest,
  successResponse,
  handleApiError,
  validateRequired,
} from '@/lib/api/api-helpers';

// 医療機関一覧取得
export async function GET(request: NextRequest) {
  try {
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
