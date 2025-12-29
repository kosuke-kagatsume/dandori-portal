import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// バッチ処理用の独立したPrismaクライアント
const prismaClient = new PrismaClient();

/**
 * DW管理 - 通知クリーンアップバッチAPI
 * POST /api/dw-admin/batch/cleanup-notifications
 *
 * 古い通知を削除し、データベースをクリーンに保つ
 *
 * リクエストボディ:
 * - readDaysToKeep: 既読通知を保持する日数（デフォルト: 30日）
 * - unreadDaysToKeep: 未読通知を保持する日数（デフォルト: 90日）
 * - dryRun: trueの場合、実際には削除せずプレビューのみ
 */
export async function POST(request: NextRequest) {
  try {
    // API Keyによる認証
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.BATCH_API_KEY;

    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: '認証エラー' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      readDaysToKeep = 30,
      unreadDaysToKeep = 90,
      dryRun = false,
    } = body;

    const now = new Date();

    // 既読通知の期限
    const readCutoff = new Date(now);
    readCutoff.setDate(readCutoff.getDate() - readDaysToKeep);

    // 未読通知の期限
    const unreadCutoff = new Date(now);
    unreadCutoff.setDate(unreadCutoff.getDate() - unreadDaysToKeep);

    // 削除対象の既読通知をカウント
    const readToDelete = await prismaClient.dw_notifications.count({
      where: {
        isRead: true,
        createdAt: { lt: readCutoff },
      },
    });

    // 削除対象の未読通知をカウント
    const unreadToDelete = await prismaClient.dw_notifications.count({
      where: {
        isRead: false,
        createdAt: { lt: unreadCutoff },
      },
    });

    // 古いアクティビティの削除（90日以上前）
    const activityCutoff = new Date(now);
    activityCutoff.setDate(activityCutoff.getDate() - 90);

    const activityToDelete = await prismaClient.activity_feeds.count({
      where: {
        createdAt: { lt: activityCutoff },
      },
    });

    let deletedRead = 0;
    let deletedUnread = 0;
    let deletedActivity = 0;

    if (!dryRun) {
      // 既読通知を削除
      const readResult = await prismaClient.dw_notifications.deleteMany({
        where: {
          isRead: true,
          createdAt: { lt: readCutoff },
        },
      });
      deletedRead = readResult.count;

      // 古い未読通知を削除
      const unreadResult = await prismaClient.dw_notifications.deleteMany({
        where: {
          isRead: false,
          createdAt: { lt: unreadCutoff },
        },
      });
      deletedUnread = unreadResult.count;

      // 古いアクティビティを削除
      const activityResult = await prismaClient.activity_feeds.deleteMany({
        where: {
          createdAt: { lt: activityCutoff },
        },
      });
      deletedActivity = activityResult.count;
    }

    // 現在の統計
    const readNotificationsCount = await prismaClient.dw_notifications.count({
      where: { isRead: true },
    });
    const unreadNotificationsCount = await prismaClient.dw_notifications.count({
      where: { isRead: false },
    });
    const totalActivities = await prismaClient.activity_feeds.count();

    return NextResponse.json({
      success: true,
      data: {
        cleanupAt: now.toISOString(),
        dryRun,
        tenant_settings: {
          readDaysToKeep,
          unreadDaysToKeep,
          activityDaysToKeep: 90,
        },
        deleted: {
          readNotifications: dryRun ? readToDelete : deletedRead,
          unreadNotifications: dryRun ? unreadToDelete : deletedUnread,
          activities: dryRun ? activityToDelete : deletedActivity,
          total: dryRun
            ? readToDelete + unreadToDelete + activityToDelete
            : deletedRead + deletedUnread + deletedActivity,
        },
        currentStats: {
          notifications: {
            read: readNotificationsCount,
            unread: unreadNotificationsCount,
          },
          activities: totalActivities,
        },
      },
    });
  } catch (error) {
    console.error('[Batch] Cleanup notifications error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '通知クリーンアップバッチの実行に失敗しました',
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
