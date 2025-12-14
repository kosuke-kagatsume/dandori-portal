import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET: 役職一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where = { tenantId };

    // 総件数取得
    const total = await prisma.positions.count({ where });

    // 役職一覧取得（select最適化）
    const positions = await prisma.positions.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        name: true,
        level: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { sortOrder: 'asc' },
      skip,
      take: limit,
    });

    return successResponse(positions, {
      count: positions.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 3600, // 1時間キャッシュ（マスターデータは変更頻度低）
    });
  } catch (error) {
    return handleApiError(error, '役職一覧の取得');
  }
}

// POST: 役職を追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, name, level, sortOrder, isActive } = body;

    if (!tenantId || !name) {
      return NextResponse.json({ error: 'tenantIdとnameは必須です' }, { status: 400 });
    }

    const position = await prisma.positions.create({
      data: {
        tenantId,
        name,
        level: level || 1,
        sortOrder: sortOrder || 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    console.error('役職追加エラー:', error);
    return NextResponse.json({ error: '役職の追加に失敗しました' }, { status: 500 });
  }
}

// PUT: 役職を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, level, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'idは必須です' }, { status: 400 });
    }

    const position = await prisma.positions.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(level !== undefined && { level }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(position);
  } catch (error) {
    console.error('役職更新エラー:', error);
    return NextResponse.json({ error: '役職の更新に失敗しました' }, { status: 500 });
  }
}

// DELETE: 役職を削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'idは必須です' }, { status: 400 });
    }

    await prisma.positions.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('役職削除エラー:', error);
    return NextResponse.json({ error: '役職の削除に失敗しました' }, { status: 500 });
  }
}
