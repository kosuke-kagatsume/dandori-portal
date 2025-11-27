import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
  errorResponse,
} from '@/lib/api/api-helpers';

// GET /api/announcements/[id] - お知らせ詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    const announcement = await prisma.announcement.findFirst({
      where: { id, tenantId },
      include: {
        reads: {
          select: {
            userId: true,
            readAt: true,
            actionCompleted: true,
            actionCompletedAt: true,
          },
        },
      },
    });

    if (!announcement) {
      return errorResponse('お知らせが見つかりません', 404);
    }

    return successResponse(announcement);
  } catch (error) {
    return handleApiError(error, 'お知らせの取得');
  }
}

// PUT /api/announcements/[id] - お知らせ更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const body = await request.json();

    // 存在確認
    const existing = await prisma.announcement.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return errorResponse('お知らせが見つかりません', 404);
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.target !== undefined && { target: body.target }),
        ...(body.targetDepartments !== undefined && { targetDepartments: body.targetDepartments }),
        ...(body.targetRoles !== undefined && { targetRoles: body.targetRoles }),
        ...(body.published !== undefined && {
          published: body.published,
          publishedAt: body.published && !existing.published ? new Date() : existing.publishedAt,
        }),
        ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
        ...(body.requiresAction !== undefined && { requiresAction: body.requiresAction }),
        ...(body.actionLabel !== undefined && { actionLabel: body.actionLabel || null }),
        ...(body.actionUrl !== undefined && { actionUrl: body.actionUrl || null }),
        ...(body.actionDeadline !== undefined && { actionDeadline: body.actionDeadline ? new Date(body.actionDeadline) : null }),
      },
    });

    return successResponse(announcement);
  } catch (error) {
    return handleApiError(error, 'お知らせの更新');
  }
}

// DELETE /api/announcements/[id] - お知らせ削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    // 存在確認
    const existing = await prisma.announcement.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return errorResponse('お知らせが見つかりません', 404);
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'お知らせを削除しました' });
  } catch (error) {
    return handleApiError(error, 'お知らせの削除');
  }
}
