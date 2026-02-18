import { NextRequest, NextResponse } from 'next/server';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


interface RouteContext {
  params: Promise<{ id: string }>;
}

// 予約をキャンセル
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const tenantId = await getTenantIdFromRequest(request);

    // 既存の予約を取得
    const existing = await prisma.scheduled_changes.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '予約が見つかりません' },
        { status: 404 }
      );
    }

    // 既にキャンセル済みの場合
    if (existing.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: '既にキャンセル済みです' },
        { status: 400 }
      );
    }

    // 適用済みの場合
    if (existing.status === 'applied') {
      return NextResponse.json(
        { success: false, error: '適用済みの予約はキャンセルできません' },
        { status: 400 }
      );
    }

    const change = await prisma.scheduled_changes.update({
      where: { id },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: change.id,
        status: change.status,
        updatedAt: change.updatedAt.toISOString(),
      },
      message: '予約をキャンセルしました',
    });
  } catch (error) {
    console.error('Failed to cancel scheduled change:', error);
    return NextResponse.json(
      { success: false, error: '予約のキャンセルに失敗しました' },
      { status: 500 }
    );
  }
}
