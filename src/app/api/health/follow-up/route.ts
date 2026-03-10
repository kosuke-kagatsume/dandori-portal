import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getTenantIdFromRequest,
  successResponse,
  handleApiError,
} from '@/lib/api/api-helpers';

// フォローアップ記録一覧取得
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { tenantId };
    if (userId) where.userId = userId;
    if (status && status !== 'all') where.status = status;

    const records = await prisma.health_follow_up_records.findMany({
      where,
      orderBy: { followUpDate: 'desc' },
    });

    return successResponse(records);
  } catch (error) {
    return handleApiError(error, 'フォローアップ記録の取得');
  }
}

// フォローアップ記録追加
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();
    const { userId, userName, checkupId, followUpDate, status, notes, nextFollowUpDate, assignedTo } = body;

    if (!userId || !userName || !followUpDate) {
      return NextResponse.json(
        { error: 'ユーザーID、ユーザー名、フォロー日は必須です' },
        { status: 400 }
      );
    }

    const record = await prisma.health_follow_up_records.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        userId,
        userName,
        checkupId,
        followUpDate: new Date(followUpDate),
        status: status || 'pending',
        notes,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        assignedTo,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'フォローアップ記録の追加');
  }
}

// フォローアップ記録更新
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();
    const { id, status, notes, nextFollowUpDate, assignedTo } = body;

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    }

    // tenantId検証
    const existing = await prisma.health_follow_up_records.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'フォローアップ記録が見つかりません' }, { status: 404 });
    }

    const record = await prisma.health_follow_up_records.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(nextFollowUpDate !== undefined && {
          nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        }),
        ...(assignedTo !== undefined && { assignedTo }),
        updatedAt: new Date(),
      },
    });

    return successResponse(record);
  } catch (error) {
    return handleApiError(error, 'フォローアップ記録の更新');
  }
}
