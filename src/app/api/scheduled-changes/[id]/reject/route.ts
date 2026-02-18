import { NextRequest, NextResponse } from 'next/server';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


interface RouteContext {
  params: Promise<{ id: string }>;
}

// 予約を却下
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    const { rejectedBy, rejectedByName, reason } = body;

    if (!rejectedBy || !rejectedByName) {
      return NextResponse.json(
        { success: false, error: '却下者情報は必須です' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { success: false, error: '却下理由は必須です' },
        { status: 400 }
      );
    }

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

    // 承認不要の場合
    if (!existing.requiresApproval) {
      return NextResponse.json(
        { success: false, error: 'この予約は承認が不要です' },
        { status: 400 }
      );
    }

    // 既に承認済みの場合
    if (existing.approvalStatus === 'approved') {
      return NextResponse.json(
        { success: false, error: '既に承認済みの予約は却下できません' },
        { status: 400 }
      );
    }

    // 既に却下済みの場合
    if (existing.approvalStatus === 'rejected') {
      return NextResponse.json(
        { success: false, error: '既に却下済みです' },
        { status: 400 }
      );
    }

    // キャンセル済みまたは適用済みの場合
    if (existing.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: '予約中でない予約は却下できません' },
        { status: 400 }
      );
    }

    const now = new Date();
    const change = await prisma.scheduled_changes.update({
      where: { id },
      data: {
        approvalStatus: 'rejected',
        rejectionReason: reason,
        updatedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: change.id,
        approvalStatus: change.approvalStatus,
        rejectionReason: change.rejectionReason,
        updatedAt: change.updatedAt.toISOString(),
      },
      message: '予約を却下しました',
    });
  } catch (error) {
    console.error('Failed to reject scheduled change:', error);
    return NextResponse.json(
      { success: false, error: '予約の却下に失敗しました' },
      { status: 500 }
    );
  }
}
