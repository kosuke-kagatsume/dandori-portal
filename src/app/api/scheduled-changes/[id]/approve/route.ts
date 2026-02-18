import { NextRequest, NextResponse } from 'next/server';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


interface RouteContext {
  params: Promise<{ id: string }>;
}

// 予約を承認
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    const { approverId, approverName } = body;

    if (!approverId || !approverName) {
      return NextResponse.json(
        { success: false, error: '承認者情報は必須です' },
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
        { success: false, error: '既に承認済みです' },
        { status: 400 }
      );
    }

    // キャンセル済みまたは適用済みの場合
    if (existing.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: '予約中でない予約は承認できません' },
        { status: 400 }
      );
    }

    const now = new Date();
    const change = await prisma.scheduled_changes.update({
      where: { id },
      data: {
        approvalStatus: 'approved',
        approvedBy: approverId,
        approvedByName: approverName,
        approvedAt: now,
        updatedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: change.id,
        approvalStatus: change.approvalStatus,
        approvedBy: change.approvedBy,
        approvedByName: change.approvedByName,
        approvedAt: change.approvedAt?.toISOString(),
        updatedAt: change.updatedAt.toISOString(),
      },
      message: '予約を承認しました',
    });
  } catch (error) {
    console.error('Failed to approve scheduled change:', error);
    return NextResponse.json(
      { success: false, error: '予約の承認に失敗しました' },
      { status: 500 }
    );
  }
}
