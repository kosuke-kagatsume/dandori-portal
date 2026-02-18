import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET: 雇用形態一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where = { tenantId };

    // 総件数取得
    const total = await prisma.employment_types.count({ where });

    // 雇用形態一覧取得（select最適化）
    const employmentTypes = await prisma.employment_types.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        name: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { sortOrder: 'asc' },
      skip,
      take: limit,
    });

    return successResponse(employmentTypes, {
      count: employmentTypes.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 3600, // 1時間キャッシュ（マスターデータは変更頻度低）
    });
  } catch (error) {
    return handleApiError(error, '雇用形態一覧の取得');
  }
}

// POST: 雇用形態を追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, name, sortOrder, isActive } = body;

    if (!tenantId || !name) {
      return NextResponse.json({ error: 'tenantIdとnameは必須です' }, { status: 400 });
    }

    const employmentType = await prisma.employment_types.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        name,
        sortOrder: sortOrder || 0,
        isActive: isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(employmentType, { status: 201 });
  } catch (error) {
    console.error('雇用形態追加エラー:', error);
    return NextResponse.json({ error: '雇用形態の追加に失敗しました' }, { status: 500 });
  }
}

// PUT: 雇用形態を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'idは必須です' }, { status: 400 });
    }

    const employmentType = await prisma.employment_types.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(employmentType);
  } catch (error) {
    console.error('雇用形態更新エラー:', error);
    return NextResponse.json({ error: '雇用形態の更新に失敗しました' }, { status: 500 });
  }
}

// DELETE: 雇用形態を削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'idは必須です' }, { status: 400 });
    }

    await prisma.employment_types.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('雇用形態削除エラー:', error);
    return NextResponse.json({ error: '雇用形態の削除に失敗しました' }, { status: 500 });
  }
}
