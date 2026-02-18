import { NextRequest, NextResponse } from 'next/server';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


interface RouteContext {
  params: Promise<{ id: string }>;
}

// 予約を即座に適用
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

    // 既に適用済みの場合
    if (existing.status === 'applied') {
      return NextResponse.json(
        { success: false, error: '既に適用済みです' },
        { status: 400 }
      );
    }

    // キャンセル済みの場合
    if (existing.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'キャンセル済みの予約は適用できません' },
        { status: 400 }
      );
    }

    // 承認が必要で、まだ承認されていない場合
    if (existing.requiresApproval && existing.approvalStatus !== 'approved') {
      return NextResponse.json(
        { success: false, error: '承認されていない予約は適用できません' },
        { status: 400 }
      );
    }

    const change = await prisma.scheduled_changes.update({
      where: { id },
      data: {
        status: 'applied',
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
      message: '予約を適用しました',
    });
  } catch (error) {
    console.error('Failed to apply scheduled change:', error);
    return NextResponse.json(
      { success: false, error: '予約の適用に失敗しました' },
      { status: 500 }
    );
  }
}
