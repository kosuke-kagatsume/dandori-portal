import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: 役職一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantIdが必要です' }, { status: 400 });
    }

    const positions = await prisma.position.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(positions);
  } catch (error) {
    console.error('役職取得エラー:', error);
    return NextResponse.json({ error: '役職の取得に失敗しました' }, { status: 500 });
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

    const position = await prisma.position.create({
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

    const position = await prisma.position.update({
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

    await prisma.position.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('役職削除エラー:', error);
    return NextResponse.json({ error: '役職の削除に失敗しました' }, { status: 500 });
  }
}
