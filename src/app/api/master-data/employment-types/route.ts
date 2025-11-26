import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: 雇用形態一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantIdが必要です' }, { status: 400 });
    }

    const employmentTypes = await prisma.employmentType.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(employmentTypes);
  } catch (error) {
    console.error('雇用形態取得エラー:', error);
    return NextResponse.json({ error: '雇用形態の取得に失敗しました' }, { status: 500 });
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

    const employmentType = await prisma.employmentType.create({
      data: {
        tenantId,
        name,
        sortOrder: sortOrder || 0,
        isActive: isActive ?? true,
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

    const employmentType = await prisma.employmentType.update({
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

    await prisma.employmentType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('雇用形態削除エラー:', error);
    return NextResponse.json({ error: '雇用形態の削除に失敗しました' }, { status: 500 });
  }
}
