import { NextRequest, NextResponse } from 'next/server';
import { prisma as prismaClient } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/send-email';

const THRESHOLD_DAYS = [90, 60, 30, 14, 7];

/**
 * DW管理 - 資格期限チェックバッチAPI
 * POST /api/dw-admin/batch/check-certifications
 *
 * 定期実行し、期限が近い資格を検出して通知を作成・メール送信
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.BATCH_API_KEY;

    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: '認証エラー' },
        { status: 401 }
      );
    }

    const now = new Date();
    let createdCount = 0;
    let skippedCount = 0;
    let emailSentCount = 0;

    // 各テナントの資格を取得
    const tenants = await prismaClient.tenants.findMany({
      select: { id: true },
    });

    for (const tenant of tenants) {
      for (const days of THRESHOLD_DAYS) {
        const thresholdDate = new Date(now);
        thresholdDate.setDate(thresholdDate.getDate() + days);

        // 期限が閾値以内の資格を検出
        const expiringCerts = await prismaClient.certifications.findMany({
          where: {
            tenantId: tenant.id,
            expiryDate: {
              lte: thresholdDate,
              gte: now,
            },
            status: { in: ['active', 'expiring_soon'] },
          },
        });

        for (const cert of expiringCerts) {
          if (!cert.userId) continue;

          const daysUntilExpiry = Math.ceil(
            (new Date(cert.expiryDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          const notificationType =
            days <= 7 ? 'urgent' : days <= 30 ? 'warning' : 'reminder';

          // 重複チェック
          const existing = await prismaClient.certification_notifications.findFirst({
            where: {
              certificationId: cert.id,
              notificationType,
              createdAt: {
                gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24時間以内
              },
            },
          });

          if (existing) {
            skippedCount++;
            continue;
          }

          // 通知レコード作成
          await prismaClient.certification_notifications.create({
            data: {
              id: crypto.randomUUID(),
              tenantId: tenant.id,
              certificationId: cert.id,
              userId: cert.userId,
              notificationType,
              daysUntilExpiry,
              sentAt: now,
              inAppSent: true,
              emailSent: true,
            },
          });
          createdCount++;

          // メール送信（ユーザー情報を取得）
          const user = await prismaClient.users.findUnique({
            where: { id: cert.userId },
            select: { email: true, name: true },
          });
          if (user?.email) {
            const expiryStr = cert.expiryDate
              ? new Date(cert.expiryDate).toLocaleDateString('ja-JP')
              : '不明';
            const result = await sendEmail({
              to: user.email,
              subject: `【資格期限通知】${cert.name} の有効期限が${daysUntilExpiry}日後です`,
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
            });
            if (result.success) emailSentCount++;
          }
        }
      }

      // 期限切れ資格もチェック
      const expiredCerts = await prismaClient.certifications.findMany({
        where: {
          tenantId: tenant.id,
          expiryDate: { lt: now },
          status: { in: ['active', 'expiring_soon'] },
        },
      });

      for (const cert of expiredCerts) {
        if (!cert.userId) continue;

        const existing = await prismaClient.certification_notifications.findFirst({
          where: {
            certificationId: cert.id,
            notificationType: 'expired',
            createdAt: {
              gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7日以内
            },
          },
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        await prismaClient.certification_notifications.create({
          data: {
            id: crypto.randomUUID(),
            tenantId: tenant.id,
            certificationId: cert.id,
            userId: cert.userId,
            notificationType: 'expired',
            daysUntilExpiry: 0,
            sentAt: now,
            inAppSent: true,
            emailSent: true,
          },
        });
        createdCount++;

        // 期限切れメール
        const expiredUser = await prismaClient.users.findUnique({
          where: { id: cert.userId },
          select: { email: true, name: true },
        });
        if (expiredUser?.email) {
          await sendEmail({
            to: expiredUser.email,
            subject: `【重要】${cert.name} の有効期限が切れています`,
            html: `
              <p>${expiredUser.name} 様</p>
              <p>お持ちの資格「<strong>${cert.name}</strong>」の有効期限が切れています。</p>
              <p>至急、更新手続きをお願いいたします。</p>
              <p>Dandoriポータル</p>
            `,
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        created: createdCount,
        skipped: skippedCount,
        emailsSent: emailSentCount,
        processedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Certification check batch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'バッチ処理に失敗しました',
      },
      { status: 500 }
    );
  }
}
