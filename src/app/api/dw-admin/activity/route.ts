import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// DW管理API用の独立したPrismaクライアント
const prisma = new PrismaClient();

/**
 * DW管理 - アクティビティフィードAPI
 * GET /api/dw-admin/activity
 *
 * クエリパラメータ:
 * - type: アクティビティタイプでフィルタ
 * - resourceType: リソースタイプでフィルタ（tenant, invoice, payment, user等）
 * - startDate: 開始日
 * - endDate: 終了日
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activityType = searchParams.get('type');
    const resourceType = searchParams.get('resourceType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const skip = (page - 1) * limit;

    // フィルタ条件を構築
    const where: Record<string, unknown> = {};

    if (activityType) {
      where.activityType = activityType;
    }

    if (resourceType) {
      where.resourceType = resourceType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    // アクティビティ一覧を取得
    const [activities, total] = await Promise.all([
      prisma.activityFeed.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.activityFeed.count({ where }),
    ]);

    // タイプ別の集計（直近7日間）
    const typeCounts = await prisma.activityFeed.groupBy({
      by: ['activityType'],
      _count: true,
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        activities: activities.map((activity) => ({
          id: activity.id,
          tenantId: activity.tenantId,
          activityType: activity.activityType,
          title: activity.title,
          description: activity.description,
          icon: activity.icon,
          userId: activity.userId,
          userName: activity.userName,
          resourceType: activity.resourceType,
          resourceId: activity.resourceId,
          priority: activity.priority,
          createdAt: activity.createdAt,
        })),
        summary: {
          weeklyByType: typeCounts.reduce(
            (acc, item) => {
              acc[item.activityType] = item._count;
              return acc;
            },
            {} as Record<string, number>
          ),
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('[API] DW Admin - Get activity feed error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'アクティビティの取得に失敗しました',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DW管理 - アクティビティ記録API
 * POST /api/dw-admin/activity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tenantId,
      activityType,
      title,
      description,
      icon,
      userId,
      userName,
      resourceType,
      resourceId,
      priority = 'normal',
    } = body;

    // バリデーション
    if (!tenantId || !activityType || !title) {
      return NextResponse.json(
        { success: false, error: 'tenantId, activityType, title は必須です' },
        { status: 400 }
      );
    }

    // アクティビティ作成
    const activity = await prisma.activityFeed.create({
      data: {
        tenantId,
        activityType,
        title,
        description,
        icon,
        userId,
        userName,
        resourceType,
        resourceId,
        priority,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: activity,
        message: 'アクティビティを記録しました',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] DW Admin - Create activity error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'アクティビティの記録に失敗しました',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
