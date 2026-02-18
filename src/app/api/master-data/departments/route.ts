import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET: 部署一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where = { tenantId };

    // 総件数取得
    const total = await prisma.departments.count({ where });

    // 部署一覧取得（select最適化）
    const departments = await prisma.departments.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        name: true,
        parentId: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { sortOrder: 'asc' },
      skip,
      take: limit,
    });

    return successResponse(departments, {
      count: departments.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 3600, // 1時間キャッシュ（マスターデータは変更頻度低）
    });
  } catch (error) {
    return handleApiError(error, '部署一覧の取得');
  }
}

// POST: 部署を追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, name, parentId, sortOrder, isActive } = body;

    if (!tenantId || !name) {
      return NextResponse.json({ error: 'tenantIdとnameは必須です' }, { status: 400 });
    }

    const department = await prisma.departments.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        name,
        parentId: parentId || null,
        sortOrder: sortOrder || 0,
        isActive: isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error('部署追加エラー:', error);
    return NextResponse.json({ error: '部署の追加に失敗しました' }, { status: 500 });
  }
}

// PUT: 部署を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, parentId, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'idは必須です' }, { status: 400 });
    }

    const department = await prisma.departments.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(parentId !== undefined && { parentId }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error('部署更新エラー:', error);
    return NextResponse.json({ error: '部署の更新に失敗しました' }, { status: 500 });
  }
}

// DELETE: 部署を削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'idは必須です' }, { status: 400 });
    }

    await prisma.departments.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('部署削除エラー:', error);
    return NextResponse.json({ error: '部署の削除に失敗しました' }, { status: 500 });
  }
}
