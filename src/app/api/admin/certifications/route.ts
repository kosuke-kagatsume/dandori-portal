import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
} from '@/lib/api/api-helpers';

// GET /api/admin/certifications - 管理者向けダッシュボードデータ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(now.getDate() + 7);
    const in14Days = new Date();
    in14Days.setDate(now.getDate() + 14);
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    // 各種カウントを並列取得
    const [
      expiredCount,
      within7DaysCount,
      within14DaysCount,
      within30DaysCount,
      pendingRenewalsCount,
      underReviewCount,
      recentNotifications,
      expiringCertifications,
    ] = await Promise.all([
      // 期限切れ
      prisma.certification.count({
        where: {
          tenantId,
          expiryDate: { lt: now, not: null },
        },
      }),
      // 7日以内
      prisma.certification.count({
        where: {
          tenantId,
          expiryDate: { gte: now, lte: in7Days },
        },
      }),
      // 14日以内
      prisma.certification.count({
        where: {
          tenantId,
          expiryDate: { gte: now, lte: in14Days },
        },
      }),
      // 30日以内
      prisma.certification.count({
        where: {
          tenantId,
          expiryDate: { gte: now, lte: in30Days },
        },
      }),
      // 未処理の更新申請
      prisma.certificationRenewal.count({
        where: {
          tenantId,
          status: 'pending',
        },
      }),
      // 審査中の更新申請
      prisma.certificationRenewal.count({
        where: {
          tenantId,
          status: 'under_review',
        },
      }),
      // 最近の通知
      prisma.certificationNotification.findMany({
        where: { tenantId },
        include: {
          certification: {
            select: { name: true, organization: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // 期限接近リスト（上位10件）
      prisma.certification.findMany({
        where: {
          tenantId,
          expiryDate: { gte: now, lte: in30Days },
        },
        include: {
          profile: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  department: true,
                },
              },
            },
          },
        },
        orderBy: { expiryDate: 'asc' },
        take: 10,
      }),
    ]);

    // 期限切れ資格リスト（上位10件）
    const expiredCertifications = await prisma.certification.findMany({
      where: {
        tenantId,
        expiryDate: { lt: now, not: null },
      },
      include: {
        profile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                department: true,
              },
            },
          },
        },
      },
      orderBy: { expiryDate: 'desc' },
      take: 10,
    });

    // 未処理の更新申請リスト
    const pendingRenewals = await prisma.certificationRenewal.findMany({
      where: {
        tenantId,
        status: { in: ['pending', 'under_review'] },
      },
      include: {
        certification: {
          include: {
            profile: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    department: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return successResponse({
      counts: {
        expired: expiredCount,
        within7Days: within7DaysCount,
        within14Days: within14DaysCount,
        within30Days: within30DaysCount,
        pendingRenewals: pendingRenewalsCount,
        underReview: underReviewCount,
      },
      expiringCertifications: expiringCertifications.map((cert) => ({
        ...cert,
        daysUntilExpiry: cert.expiryDate
          ? Math.ceil((new Date(cert.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
        user: cert.profile?.user || null,
      })),
      expiredCertifications: expiredCertifications.map((cert) => ({
        ...cert,
        daysSinceExpiry: cert.expiryDate
          ? Math.ceil((now.getTime() - new Date(cert.expiryDate).getTime()) / (1000 * 60 * 60 * 24))
          : null,
        user: cert.profile?.user || null,
      })),
      pendingRenewals: pendingRenewals.map((renewal) => ({
        ...renewal,
        user: renewal.certification.profile?.user || null,
      })),
      recentNotifications,
    });
  } catch (error) {
    return handleApiError(error, 'ダッシュボードデータの取得');
  }
}
