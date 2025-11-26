import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: 部署一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantIdが必要です' }, { status: 400 });
    }

    const departments = await prisma.department.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error('部署取得エラー:', error);
    return NextResponse.json({ error: '部署の取得に失敗しました' }, { status: 500 });
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

    const department = await prisma.department.create({
      data: {
        tenantId,
        name,
        parentId: parentId || null,
        sortOrder: sortOrder || 0,
        isActive: isActive ?? true,
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

    const department = await prisma.department.update({
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

    await prisma.department.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('部署削除エラー:', error);
    return NextResponse.json({ error: '部署の削除に失敗しました' }, { status: 500 });
  }
}
