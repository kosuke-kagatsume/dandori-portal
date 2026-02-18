import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';

// 健康管理レポート取得
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    const currentYear = new Date().getFullYear();

    // 健康診断統計
    const [
      checkupStats,
      stressCheckStats,
      findingsRateByYear,
      highStressByDepartment,
      highStressTrend,
    ] = await Promise.all([
      // 健康診断の統計
      prisma.health_checkups.groupBy({
        by: ['overallResult'],
        where: { tenantId, fiscalYear: currentYear },
        _count: true,
      }),

      // ストレスチェックの統計
      prisma.stress_checks.aggregate({
        where: { tenantId, fiscalYear: currentYear },
        _count: { id: true },
        _avg: {
          stressFactorsScore: true,
          stressResponseScore: true,
          socialSupportScore: true,
        },
      }),

      // 有所見率の推移（過去3年）
      Promise.all(
        [currentYear - 2, currentYear - 1, currentYear].map(async (year) => {
          const total = await prisma.health_checkups.count({
            where: { tenantId, fiscalYear: year },
          });
          const withFindings = await prisma.health_checkups.count({
            where: {
              tenantId,
              fiscalYear: year,
              OR: [
                { requiresReexam: true },
                { requiresTreatment: true },
                { requiresGuidance: true },
              ],
            },
          });
          return {
            year: year.toString(),
            rate: total > 0 ? Math.round((withFindings / total) * 100) : 0,
          };
        })
      ),

      // 部門別高ストレス者（ユーザーの部署からグループ化）
      prisma.$queryRaw`
        SELECT
          u.department,
          COUNT(CASE WHEN sc."isHighStress" = true THEN 1 END) as high_stress_count,
          COUNT(*) as total_count,
          ROUND(AVG(sc."stressFactorsScore")::numeric, 1) as avg_stress_factors,
          ROUND(AVG(sc."stressResponseScore")::numeric, 1) as avg_stress_response,
          ROUND(AVG(sc."socialSupportScore")::numeric, 1) as avg_social_support
        FROM stress_checks sc
        JOIN users u ON sc."userId" = u.id
        WHERE sc."tenantId" = ${tenantId}
          AND sc."fiscalYear" = ${currentYear}
          AND sc.status = 'completed'
          AND u.department IS NOT NULL
        GROUP BY u.department
        ORDER BY high_stress_count DESC
        LIMIT 10
      `,

      // 高ストレス者の月別推移（今年度）
      Promise.all(
        Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          const startDate = new Date(currentYear, i, 1);
          const endDate = new Date(currentYear, i + 1, 0);

          return prisma.stress_checks.count({
            where: {
              tenantId,
              fiscalYear: currentYear,
              isHighStress: true,
              checkDate: {
                gte: startDate,
                lte: endDate,
              },
            },
          }).then(count => ({
            month: `${month}月`,
            count,
          }));
        })
      ),
    ]);

    // 受診率の計算
    const totalActiveUsers = await prisma.users.count({
      where: { tenantId, status: 'active' },
    });

    const checkupCount = await prisma.health_checkups.count({
      where: { tenantId, fiscalYear: currentYear },
    });

    const stressCheckCompletedCount = await prisma.stress_checks.count({
      where: { tenantId, fiscalYear: currentYear, status: 'completed' },
    });

    const highStressCount = await prisma.stress_checks.count({
      where: { tenantId, fiscalYear: currentYear, isHighStress: true },
    });

    const interviewRequestedCount = await prisma.stress_checks.count({
      where: { tenantId, fiscalYear: currentYear, interviewRequested: true },
    });

    return NextResponse.json({
      data: {
        summary: {
          fiscalYear: currentYear,
          totalActiveUsers,
          checkup: {
            completed: checkupCount,
            rate: totalActiveUsers > 0 ? Math.round((checkupCount / totalActiveUsers) * 100) : 0,
            byResult: checkupStats.reduce((acc, item) => {
              acc[item.overallResult] = item._count;
              return acc;
            }, {} as Record<string, number>),
          },
          stressCheck: {
            completed: stressCheckCompletedCount,
            rate: totalActiveUsers > 0 ? Math.round((stressCheckCompletedCount / totalActiveUsers) * 100) : 0,
            highStressCount,
            highStressRate: stressCheckCompletedCount > 0
              ? Math.round((highStressCount / stressCheckCompletedCount) * 100)
              : 0,
            interviewRequestedCount,
            averageScores: {
              stressFactors: Math.round(stressCheckStats._avg.stressFactorsScore || 0),
              stressResponse: Math.round(stressCheckStats._avg.stressResponseScore || 0),
              socialSupport: Math.round(stressCheckStats._avg.socialSupportScore || 0),
            },
          },
        },
        charts: {
          findingsRateByYear,
          highStressByDepartment,
          highStressTrend: highStressTrend.filter(item => item.count > 0),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching health reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health reports' },
      { status: 500 }
    );
  }
}
