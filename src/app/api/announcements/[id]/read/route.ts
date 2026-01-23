import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  handleApiError,
  getTenantId,
  errorResponse,
} from '@/lib/api/api-helpers';

// POST /api/announcements/[id]/read - お知らせを既読にする
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: announcementId } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const body = await request.json();

    const userId = body.userId;
    if (!userId) {
      return errorResponse('userIdは必須です', 400);
    }

    // お知らせの存在確認
    const announcement = await prisma.announcements.findFirst({
      where: { id: announcementId, tenantId },
    });

    if (!announcement) {
      return errorResponse('お知らせが見つかりません', 404);
    }

    // 既読レコードをupsert
    const read = await prisma.announcement_reads.upsert({
      where: {
        announcementId_userId: {
          announcementId,
          userId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        tenantId,
        announcementId,
        userId,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: read });
  } catch (error) {
    return handleApiError(error, 'お知らせの既読処理');
  }
}
