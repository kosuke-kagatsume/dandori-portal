import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// バッチ処理用の独立したPrismaクライアント
const prismaClient = new PrismaClient();

/**
 * DW管理 - 支払い期限チェックバッチAPI
 * POST /api/dw-admin/batch/check-overdue
 *
 * 毎日実行し、期限超過の請求書を検出して通知を作成
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 期限超過の未払い請求書を検出
    const overdueInvoices = await prismaClient.invoices.findMany({
      where: {
        status: { in: ['draft', 'sent'] },
        dueDate: { lt: today },
      },
      include: {
        tenants: {
          include: { tenant_settings: true },
        },
      },
    });

    const results: Array<{
      invoiceId: string;
      invoiceNumber: string;
      tenantName: string;
      daysOverdue: number;
      amount: number;
      action: string;
    }> = [];

    for (const invoice of overdueInvoices) {
      // 期限超過日数を計算
      const daysOverdue = Math.floor(
        (today.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      // ステータスを「overdue」に更新
      if (invoice.status !== 'overdue') {
        await prismaClient.invoices.update({
          where: { id: invoice.id },
          data: { status: 'overdue' },
        });
      }

      // 優先度を決定
      let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';
      if (daysOverdue >= 30) priority = 'urgent';
      else if (daysOverdue >= 14) priority = 'high';
      else if (daysOverdue >= 7) priority = 'normal';
      else priority = 'low';

      // 既存の未読通知があるかチェック
      const existingNotification = await prismaClient.dw_notifications.findFirst({
        where: {
          invoiceId: invoice.id,
          type: 'payment_overdue',
          isRead: false,
        },
      });

      let action = 'existing_notification';

      if (!existingNotification) {
        // 新しい通知を作成
        await prismaClient.dw_notifications.create({
          data: {
            type: 'payment_overdue',
            title: `支払い期限超過（${daysOverdue}日）`,
            description: `${invoice.tenants?.name || '不明'}の請求書（${invoice.invoiceNumber}）が${daysOverdue}日超過しています`,
            priority,
            tenantId: invoice.tenantId,
            invoiceId: invoice.id,
            amount: invoice.total,
          },
        });
        action = 'notification_created';
      } else if (existingNotification.priority !== priority) {
        // 優先度を更新
        await prismaClient.dw_notifications.update({
          where: { id: existingNotification.id },
          data: { priority },
        });
        action = 'priority_updated';
      }

      results.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        tenantName: invoice.tenants?.name || '不明',
        daysOverdue,
        amount: invoice.total,
        action,
      });
    }

    // 7日以内に期限が来る請求書も警告
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const upcomingDueInvoices = await prismaClient.invoices.findMany({
      where: {
        status: { in: ['draft', 'sent'] },
        dueDate: {
          gte: today,
          lte: sevenDaysLater,
        },
      },
      include: {
        tenants: true,
      },
    });

    const upcomingWarnings: Array<{
      invoiceId: string;
      invoiceNumber: string;
      tenantName: string;
      daysUntilDue: number;
      amount: number;
    }> = [];

    for (const invoice of upcomingDueInvoices) {
      const daysUntilDue = Math.floor(
        (new Date(invoice.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 3日以内の場合は通知を作成
      if (daysUntilDue <= 3) {
        const existingNotification = await prismaClient.dw_notifications.findFirst({
          where: {
            invoiceId: invoice.id,
            type: 'payment_reminder',
            isRead: false,
          },
        });

        if (!existingNotification) {
          await prismaClient.dw_notifications.create({
            data: {
              type: 'payment_reminder',
              title: `支払い期限まもなく（${daysUntilDue}日）`,
              description: `${invoice.tenants?.name || '不明'}の請求書（${invoice.invoiceNumber}）の支払い期限が${daysUntilDue}日後です`,
              priority: 'normal',
              tenantId: invoice.tenantId,
              invoiceId: invoice.id,
              amount: invoice.total,
            },
          });
        }
      }

      upcomingWarnings.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        tenantName: invoice.tenants?.name || '不明',
        daysUntilDue,
        amount: invoice.total,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        checkedAt: today.toISOString(),
        overdue: {
          count: results.length,
          totalAmount: results.reduce((sum, r) => sum + r.amount, 0),
          items: results,
        },
        upcoming: {
          count: upcomingWarnings.length,
          totalAmount: upcomingWarnings.reduce((sum, r) => sum + r.amount, 0),
          items: upcomingWarnings,
        },
      },
    });
  } catch (error) {
    console.error('[Batch] Check overdue error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '期限チェックバッチの実行に失敗しました',
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
