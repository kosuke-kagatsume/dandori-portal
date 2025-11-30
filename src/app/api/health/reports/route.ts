import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId, successResponse } from '@/lib/api/api-helpers';

// 健康管理レポート取得
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const currentYear = new Date().getFullYear();
      const demoReport = {
        summary: {
          fiscalYear: currentYear,
          totalActiveUsers: 8,
          checkup: {
            completed: 8,
            rate: 100,
            byResult: { A: 3, B: 3, C: 1, D: 1 },
          },
          stressCheck: {
            completed: 7,
            rate: 88,
            highStressCount: 2,
            highStressRate: 29,
            interviewRequestedCount: 2,
            averageScores: {
              stressFactors: 62,
              stressResponse: 57,
              socialSupport: 65,
            },
          },
        },
        charts: {
          findingsRateByYear: [
            { year: (currentYear - 2).toString(), rate: 35 },
            { year: (currentYear - 1).toString(), rate: 32 },
            { year: currentYear.toString(), rate: 25 },
          ],
          highStressByDepartment: [
            { department: '営業部', high_stress_count: 1, total_count: 3, avg_stress_factors: 72, avg_stress_response: 68, avg_social_support: 55 },
            { department: '開発部', high_stress_count: 1, total_count: 3, avg_stress_factors: 65, avg_stress_response: 60, avg_social_support: 70 },
            { department: '人事部', high_stress_count: 0, total_count: 2, avg_stress_factors: 45, avg_stress_response: 40, avg_social_support: 80 },
          ],
          highStressTrend: [
            { month: '4月', count: 0 },
            { month: '5月', count: 1 },
            { month: '6月', count: 1 },
            { month: '7月', count: 0 },
            { month: '8月', count: 1 },
            { month: '9月', count: 0 },
            { month: '10月', count: 1 },
            { month: '11月', count: 2 },
          ],
        },
      };
      return successResponse(demoReport);
    }

    const searchParams = request.nextUrl.searchParams;
    const tenantId = getTenantId(searchParams);

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
      prisma.healthCheckup.groupBy({
        by: ['overallResult'],
        where: { tenantId, fiscalYear: currentYear },
        _count: true,
      }),

      // ストレスチェックの統計
      prisma.stressCheck.aggregate({
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
          const total = await prisma.healthCheckup.count({
            where: { tenantId, fiscalYear: year },
          });
          const withFindings = await prisma.healthCheckup.count({
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

          return prisma.stressCheck.count({
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
    const totalActiveUsers = await prisma.user.count({
      where: { tenantId, status: 'active' },
    });

    const checkupCount = await prisma.healthCheckup.count({
      where: { tenantId, fiscalYear: currentYear },
    });

    const stressCheckCompletedCount = await prisma.stressCheck.count({
      where: { tenantId, fiscalYear: currentYear, status: 'completed' },
    });

    const highStressCount = await prisma.stressCheck.count({
      where: { tenantId, fiscalYear: currentYear, isHighStress: true },
    });

    const interviewRequestedCount = await prisma.stressCheck.count({
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
