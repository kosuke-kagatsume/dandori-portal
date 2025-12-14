import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// DW管理API用の独立したPrismaクライアント
const prisma = new PrismaClient();

/**
 * DW管理 - 通知一覧API
 * GET /api/dw-admin/notifications
 *
 * クエリパラメータ:
 * - type: 'payment_received' | 'payment_overdue' | 'tenant_created' | 'tenant_suspended' | 'system_alert'
 * - read: 'true' | 'false' - 既読/未読フィルタ
 * - priority: 'high' | 'normal' | 'low'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const read = searchParams.get('read');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // フィルタ条件を構築
    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }

    if (read !== null) {
      where.readAt = read === 'true' ? { not: null } : null;
    }

    if (priority) {
      where.priority = priority;
    }

    // 通知一覧を取得（DWNotificationにはtenantリレーションがないので、tenantNameを直接使用）
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.dw_notifications.findMany({
        where,
        orderBy: [
          { readAt: 'asc' }, // 未読を先に
          { priority: 'desc' }, // 優先度高い順
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.dw_notifications.count({ where }),
      prisma.dw_notifications.count({
        where: {
          ...where,
          readAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          description: n.description,
          priority: n.priority,
          tenantId: n.tenantId,
          tenantName: n.tenantName, // DWNotificationにはtenantNameフィールドがある
          invoiceId: n.invoiceId,
          amount: n.amount,
          isRead: n.isRead,
          readAt: n.readAt,
          readBy: n.readBy,
          createdAt: n.createdAt,
        })),
        summary: {
          total,
          unread: unreadCount,
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
    console.error('[API] DW Admin - Get notifications error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '通知の取得に失敗しました',
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
 * DW管理 - 通知作成API（システム通知生成用）
 * POST /api/dw-admin/notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      type,
      title,
      description,
      priority = 'normal',
      tenantId,
      tenantName,
      invoiceId,
      amount,
    } = body;

    // バリデーション
    if (!type || !title) {
      return NextResponse.json(
        { success: false, error: 'type, title は必須です' },
        { status: 400 }
      );
    }

    const validTypes = ['payment_received', 'payment_overdue', 'tenant_created', 'tenant_suspended', 'system_alert'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `type は ${validTypes.join(', ')} のいずれかである必要があります` },
        { status: 400 }
      );
    }

    // 通知作成
    const notification = await prisma.dw_notifications.create({
      data: {
        type,
        title,
        description,
        priority,
        tenantId,
        tenantName,
        invoiceId,
        amount,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: notification,
        message: '通知を作成しました',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] DW Admin - Create notification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '通知の作成に失敗しました',
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
 * DW管理 - 通知一括既読API
 * PUT /api/dw-admin/notifications
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, markAllRead, readBy } = body;

    if (markAllRead) {
      // 全て既読にする
      await prisma.dw_notifications.updateMany({
        where: {
          readAt: null,
        },
        data: {
          isRead: true,
          readAt: new Date(),
          readBy,
        },
      });

      return NextResponse.json({
        success: true,
        message: '全ての通知を既読にしました',
      });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: '通知IDの配列が必要です' },
        { status: 400 }
      );
    }

    // 指定した通知を既読にする
    await prisma.dw_notifications.updateMany({
      where: {
        id: { in: ids },
        readAt: null,
      },
      data: {
        isRead: true,
        readAt: new Date(),
        readBy,
      },
    });

    return NextResponse.json({
      success: true,
      message: '通知を既読にしました',
    });
  } catch (error) {
    console.error('[API] DW Admin - Update notifications error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '通知の更新に失敗しました',
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
