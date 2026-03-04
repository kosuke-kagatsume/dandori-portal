import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';
import { sendEmail } from '@/lib/email/send-email';

// GET /api/certifications/notifications - 通知履歴一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const where: Record<string, unknown> = { tenantId };
    if (userId) where.userId = userId;
    if (unreadOnly) where.readAt = null;

    const notifications = await prisma.certification_notifications.findMany({
      where,
      include: {
        certifications: {
          select: {
            id: true,
            name: true,
            organization: true,
            expiryDate: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 未読数を取得
    const unreadCount = await prisma.certification_notifications.count({
      where: {
        ...where,
        readAt: null,
      },
    });

    return successResponse({
      notifications,
      unreadCount,
    });
  } catch (error) {
    return handleApiError(error, '通知履歴の取得');
  }
}

// POST /api/certifications/notifications - 通知を作成・送信
export async function POST(request: NextRequest) {
  try {
    const resolvedTenantId = await getTenantIdFromRequest(request);
    const body = await request.json();
    const { certificationId, userId, notificationType, daysUntilExpiry } = body;

    if (!certificationId || !userId || !notificationType) {
      return NextResponse.json(
        { success: false, error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    // 通知設定を取得
    let settings = await prisma.certification_notification_settings.findUnique({
      where: { tenantId: resolvedTenantId },
    });

    // 設定がなければデフォルト値で作成
    if (!settings) {
      settings = await prisma.certification_notification_settings.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: resolvedTenantId,
          updatedAt: new Date(),
        },
      });
    }

    // エスカレーション判定
    const escalateToManager = daysUntilExpiry <= settings.escalateToManagerDays;
    const escalateToHr = daysUntilExpiry <= settings.escalateToHrDays;

    // 通知作成
    const notification = await prisma.certification_notifications.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: resolvedTenantId,
        certificationId,
        userId,
        notificationType,
        daysUntilExpiry,
        sentAt: new Date(),
        inAppSent: settings.enableInAppNotification,
        emailSent: settings.enableEmailNotification,
        pushSent: settings.enablePushNotification,
        escalatedToManager: escalateToManager,
        escalatedToHr: escalateToHr,
        managerNotifiedAt: escalateToManager ? new Date() : null,
        hrNotifiedAt: escalateToHr ? new Date() : null,
      },
    });

    // メール送信（SendGrid未設定でもgraceful fail）
    if (settings.enableEmailNotification) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      const cert = await prisma.certifications.findUnique({
        where: { id: certificationId },
        select: { name: true, expiryDate: true },
      });
      if (user?.email && cert) {
        const expiryStr = cert.expiryDate
          ? new Date(cert.expiryDate).toLocaleDateString('ja-JP')
          : '不明';
        await sendEmail({
          to: user.email,
          subject: `【資格期限通知】${cert.name} の有効期限が近づいています`,
          html: `
            <p>${user.name} 様</p>
            <p>お持ちの資格「<strong>${cert.name}</strong>」の有効期限が近づいています。</p>
            <ul>
              <li>有効期限: ${expiryStr}</li>
              <li>残日数: ${daysUntilExpiry}日</li>
            </ul>
            <p>更新手続きをお願いいたします。</p>
            <p>Dandoriポータル</p>
          `,
        }).catch((err) => {
          console.error('[CertNotification] Email send failed:', err);
        });
      }
    }

    return NextResponse.json(
      { success: true, data: notification },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, '通知の作成');
  }
}

// PATCH /api/certifications/notifications - 通知を既読にする
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const updateData: { readAt?: Date; acknowledgedAt?: Date } = {};

    if (action === 'read') {
      updateData.readAt = new Date();
    } else if (action === 'acknowledge') {
      updateData.acknowledgedAt = new Date();
      updateData.readAt = new Date(); // 確認済みなら既読も
    }

    const notification = await prisma.certification_notifications.update({
      where: { id },
      data: updateData,
    });

    return successResponse(notification);
  } catch (error) {
    return handleApiError(error, '通知の更新');
  }
}
