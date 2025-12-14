import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 健康管理統計API
 * GET /api/health/stats
 *
 * クエリパラメータ:
 * - tenantId: テナントID（必須）
 * - year: 集計年（デフォルト: 今年）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const yearParam = searchParams.get('year');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId は必須です' },
        { status: 400 }
      );
    }

    const now = new Date();
    const year = yearParam ? parseInt(yearParam) : now.getFullYear();

    // 並行してデータを取得
    const [
      totalEmployees,
      healthCheckupSummary,
      stressCheckSummary,
      upcomingCheckups,
      highStressCount,
    ] = await Promise.all([
      // 従業員数
      prisma.users.count({
        where: {
          tenantId,
          status: 'active',
        },
      }),

      // 健診月次集計
      prisma.health_checkup_summaries.findMany({
        where: {
          tenantId,
          year,
        },
        orderBy: {
          month: 'asc',
        },
      }),

      // ストレスチェック集計
      prisma.stress_check_summaries.findFirst({
        where: {
          tenantId,
          year,
        },
      }),

      // 今後の健診予定（健診レコードから取得）
      prisma.health_checkups.findMany({
        where: {
          tenantId,
          scheduledDate: {
            gte: now,
          },
          status: 'scheduled',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              department: true,
            },
          },
        },
        orderBy: {
          scheduledDate: 'asc',
        },
        take: 10,
      }),

      // 高ストレス者数（ストレスチェックレコードから取得）
      prisma.stress_checks.count({
        where: {
          tenantId,
          result: 'high_stress',
          checkDate: {
            gte: new Date(year, 0, 1),
            lte: new Date(year, 11, 31),
          },
        },
      }),
    ]);

    // 健診受診率計算
    const totalCompletedCheckups = healthCheckupSummary.reduce(
      (sum, s) => sum + s.completedCount,
      0
    );
    const checkupRate = totalEmployees > 0
      ? Math.round((totalCompletedCheckups / totalEmployees) * 100)
      : 0;

    // 月別健診データ
    const monthlyCheckupStats = Array.from({ length: 12 }, (_, i) => {
      const summary = healthCheckupSummary.find((s) => s.month === i + 1);
      return {
        month: i + 1,
        scheduledCount: summary?.scheduledCount || 0,
        completedCount: summary?.completedCount || 0,
        pendingCount: summary?.pendingCount || 0,
        abnormalCount: summary?.abnormalCount || 0,
      };
    });

    // ストレスチェック統計
    const stressCheckStats = stressCheckSummary
      ? {
          totalParticipants: stressCheckSummary.totalParticipants,
          completedCount: stressCheckSummary.completedCount,
          highStressCount: stressCheckSummary.highStressCount,
          participationRate: stressCheckSummary.participationRate,
          highStressRate: stressCheckSummary.highStressRate,
        }
      : {
          totalParticipants: 0,
          completedCount: 0,
          highStressCount,
          participationRate: 0,
          highStressRate: 0,
        };

    // アラート情報
    const alerts = [];

    // 健診未受診アラート
    const uncompletedCheckups = totalEmployees - totalCompletedCheckups;
    if (uncompletedCheckups > 0 && now.getMonth() >= 9) {
      // 10月以降
      alerts.push({
        type: 'checkup_pending',
        message: `${uncompletedCheckups}名の健康診断が未受診です`,
        severity: 'high',
      });
    }

    // 高ストレス者フォローアップアラート
    if (highStressCount > 0) {
      alerts.push({
        type: 'high_stress',
        message: `${highStressCount}名の高ストレス者のフォローアップが必要です`,
        severity: 'medium',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        year,
        summary: {
          totalEmployees,
          checkupCompletedCount: totalCompletedCheckups,
          checkupRate,
          highStressCount,
        },
        healthCheckup: {
          monthlyStats: monthlyCheckupStats,
          upcomingCheckups: upcomingCheckups.map((c) => ({
            id: c.id,
            userId: c.userId,
            userName: c.user.name,
            department: c.user.department,
            scheduledDate: c.scheduledDate,
          })),
        },
        stressCheck: stressCheckStats,
        alerts,
      },
    });
  } catch (error) {
    console.error('[API] Health stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '健康管理統計の取得に失敗しました',
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
