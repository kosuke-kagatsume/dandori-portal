import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
  getPaginationParams,
  validateRequired,
  errorResponse,
} from '@/lib/api/api-helpers';

// GET /api/announcements - お知らせ一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const published = searchParams.get('published');
    const type = searchParams.get('type');
    const { page, limit, skip } = getPaginationParams(searchParams);

    // フィルター条件
    const where: Record<string, unknown> = { tenantId };

    // 公開状態でフィルタ
    if (published === 'true') {
      const now = new Date();
      where.published = true;
      where.startDate = { lte: now };
      where.OR = [
        { endDate: null },
        { endDate: { gte: now } },
      ];
    } else if (published === 'false') {
      where.published = false;
    }

    // タイプでフィルタ
    if (type && type !== 'all') {
      where.type = type;
    }

    // 総件数
    const total = await prisma.announcements.count({ where });

    // お知らせ一覧取得
    const announcements = await prisma.announcements.findMany({
      where,
      include: {
        announcement_reads: {
          select: {
            userId: true,
            readAt: true,
            actionCompleted: true,
            actionCompletedAt: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    });

    // 統計
    const stats = {
      total,
      published: await prisma.announcements.count({ where: { tenantId, published: true } }),
      draft: await prisma.announcements.count({ where: { tenantId, published: false } }),
    };

    return successResponse(announcements, {
      count: announcements.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
      cacheSeconds: 300, // 5分キャッシュ
    });
  } catch (error) {
    return handleApiError(error, 'お知らせ一覧の取得');
  }
}

// POST /api/announcements - お知らせ作成
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    // 必須フィールドの検証
    const validation = validateRequired(body, ['title', 'content', 'startDate', 'createdBy']);
    if (!validation.valid) {
      return errorResponse(validation.error, 400);
    }

    const announcement = await prisma.announcements.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        title: body.title,
        content: body.content,
        type: body.type || 'general',
        priority: body.priority || 'normal',
        target: body.target || 'all',
        targetDepartments: body.targetDepartments || [],
        targetRoles: body.targetRoles || [],
        published: body.published || false,
        publishedAt: body.published ? new Date() : null,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        requiresAction: body.requiresAction || false,
        actionLabel: body.actionLabel || null,
        actionUrl: body.actionUrl || null,
        actionDeadline: body.actionDeadline ? new Date(body.actionDeadline) : null,
        createdBy: body.createdBy,
        createdByName: body.createdByName || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: announcement }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'お知らせの作成');
  }
}
