import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
} from '@/lib/api/api-helpers';

// GET /api/certifications/expiring - 期限接近資格一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const days = parseInt(searchParams.get('days') || '90', 10);
    const status = searchParams.get('status'); // active, expiring, expired

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    // 基本クエリ条件
    const where: Record<string, unknown> = {
      tenantId,
      expiryDate: { not: null }, // 無期限の資格は除外
    };

    // ステータスフィルタ
    if (status === 'expired') {
      where.expiryDate = { lt: now };
    } else if (status === 'expiring') {
      where.expiryDate = { gte: now, lte: futureDate };
    } else if (status === 'active') {
      where.expiryDate = { gt: futureDate };
    } else {
      // デフォルト: 指定日数以内に期限が来るもの（期限切れ含む）
      where.expiryDate = { lte: futureDate };
    }

    const certifications = await prisma.certifications.findMany({
      where,
      include: {
        employee_profiles: true,
        certification_notifications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        certification_renewals: {
          where: { status: 'pending' },
          take: 1,
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    // userIdリストを収集してユーザー情報を一括取得
    const userIds = Array.from(new Set(certifications.map(c => c.userId)));
    const users = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        position: true,
      },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // 残り日数を計算して追加
    const result = certifications.map((cert) => {
      const expiryDate = cert.expiryDate ? new Date(cert.expiryDate) : null;
      const daysUntilExpiry = expiryDate
        ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...cert,
        daysUntilExpiry,
        isExpired: daysUntilExpiry !== null && daysUntilExpiry < 0,
        hasOpenRenewal: cert.certification_renewals.length > 0,
        lastNotification: cert.certification_notifications[0] || null,
        user: userMap.get(cert.userId) || null,
      };
    });

    // ステータス別カウント
    const counts = {
      expired: result.filter((c) => c.isExpired).length,
      within7Days: result.filter((c) => !c.isExpired && c.daysUntilExpiry !== null && c.daysUntilExpiry <= 7).length,
      within14Days: result.filter((c) => !c.isExpired && c.daysUntilExpiry !== null && c.daysUntilExpiry <= 14).length,
      within30Days: result.filter((c) => !c.isExpired && c.daysUntilExpiry !== null && c.daysUntilExpiry <= 30).length,
      total: result.length,
    };

    return successResponse({
      certifications: result,
      counts,
    });
  } catch (error) {
    return handleApiError(error, '期限接近資格一覧の取得');
  }
}
