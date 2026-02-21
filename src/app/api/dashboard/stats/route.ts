import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';
import { createSuccessResponse, handleError } from '@/lib/api/response';

// GET /api/dashboard/stats - ダッシュボード統計データ取得
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    // 今日の日付
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 並列でデータ取得
    const [
      totalEmployees,
      todayAttendance,
      pendingApprovals,
      saasServices,
      saasMonthlyCosts,
      pcAssets,
      generalAssets,
      vehicles,
    ] = await Promise.all([
      // 1. 総従業員数（アクティブユーザー）
      prisma.users.count({
        where: {
          tenantId,
          status: 'active',
        },
      }),

      // 2. 本日の出勤者数
      prisma.attendance.count({
        where: {
          tenantId,
          date: {
            gte: today,
            lt: tomorrow,
          },
          status: {
            in: ['present', 'remote', 'business_trip'],
          },
        },
      }),

      // 3. 承認待ち件数
      prisma.workflow_requests.count({
        where: {
          tenantId,
          status: 'pending',
        },
      }),

      // 4. SaaSサービス一覧（カテゴリ別コスト計算用）
      prisma.saas_services.findMany({
        where: {
          tenantId,
          isActive: true,
        },
        include: {
          saas_license_plans: {
            where: { isActive: true },
          },
          saas_license_assignments: {
            where: { status: 'active' },
          },
        },
      }),

      // 5. SaaS月別コスト（過去6ヶ月）
      prisma.saas_monthly_costs.findMany({
        where: {
          tenantId,
        },
        orderBy: {
          period: 'desc',
        },
        take: 100, // 全期間のデータを取得
        include: {
          saas_services: {
            select: {
              name: true,
              category: true,
            },
          },
        },
      }),

      // 6. PC資産統計（groupByで集計）
      prisma.pc_assets.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),

      // 7. 一般資産統計（カテゴリ・ステータス別）
      prisma.general_assets.groupBy({
        by: ['category', 'status'],
        where: { tenantId },
        _count: true,
      }),

      // 8. 車両統計（groupByで集計）
      prisma.vehicles.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
    ]);

    // 出勤率計算
    const attendanceRate = totalEmployees > 0
      ? Math.round((todayAttendance / totalEmployees) * 100 * 10) / 10
      : 0;

    // 緊急承認件数（期限が3日以内）
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const urgentApprovals = await prisma.workflow_requests.count({
      where: {
        tenantId,
        status: 'pending',
        dueDate: {
          lte: threeDaysLater,
        },
      },
    });

    // SaaSカテゴリ別コスト集計
    const categoryTotals: Record<string, number> = {};
    let totalMonthlyCost = 0;

    saasServices.forEach((service) => {
      let serviceCost = 0;

      service.saas_license_plans.forEach((plan) => {
        const activeUsers = service.saas_license_assignments.filter(
          (a) => a.planId === plan.id
        ).length;

        if (plan.fixedPrice) {
          serviceCost += plan.fixedPrice;
        }
        if (plan.pricePerUser) {
          serviceCost += plan.pricePerUser * activeUsers;
        }
      });

      const category = service.category || 'その他';
      categoryTotals[category] = (categoryTotals[category] || 0) + serviceCost;
      totalMonthlyCost += serviceCost;
    });

    // カテゴリ別コストをパーセンテージに変換
    const saasCostByCategory = Object.entries(categoryTotals).map(([category, cost]) => ({
      category,
      cost,
      percentage: totalMonthlyCost > 0 ? Math.round((cost / totalMonthlyCost) * 100) : 0,
    }));

    // SaaS月別コスト推移（過去6ヶ月）
    const monthlyData: Record<string, Record<string, number>> = {};

    saasMonthlyCosts.forEach((cost) => {
      const period = cost.period;
      const category = cost.saas_services?.category || 'その他';

      if (!monthlyData[period]) {
        monthlyData[period] = {};
      }
      monthlyData[period][category] = (monthlyData[period][category] || 0) + cost.totalCost;
    });

    // 過去6ヶ月のデータを整形
    const last6Months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const categories = Array.from(new Set(Object.keys(categoryTotals)));
    const saasMonthlyTrend = last6Months.map((month) => {
      const data: Record<string, number | string> = { month };
      categories.forEach((cat) => {
        data[cat] = monthlyData[month]?.[cat] || 0;
      });
      return data;
    });

    // 資産利用状況集計（groupBy結果から計算）
    const assetUtilization: Record<string, { total: number; inUse: number; available: number }> = {};

    // PC資産の集計
    pcAssets.forEach((stat) => {
      if (!assetUtilization['PC']) {
        assetUtilization['PC'] = { total: 0, inUse: 0, available: 0 };
      }
      assetUtilization['PC'].total += stat._count;
      if (stat.status === 'in_use') {
        assetUtilization['PC'].inUse += stat._count;
      } else if (stat.status === 'available' || stat.status === 'active') {
        assetUtilization['PC'].available += stat._count;
      }
    });

    // 一般資産の集計（カテゴリ別）
    generalAssets.forEach((stat) => {
      const category = stat.category || 'その他';
      if (!assetUtilization[category]) {
        assetUtilization[category] = { total: 0, inUse: 0, available: 0 };
      }
      assetUtilization[category].total += stat._count;
      if (stat.status === 'in_use') {
        assetUtilization[category].inUse += stat._count;
      } else if (stat.status === 'available' || stat.status === 'active') {
        assetUtilization[category].available += stat._count;
      }
    });

    // 車両の集計
    vehicles.forEach((stat) => {
      if (!assetUtilization['車両']) {
        assetUtilization['車両'] = { total: 0, inUse: 0, available: 0 };
      }
      assetUtilization['車両'].total += stat._count;
      if (stat.status === 'in_use') {
        assetUtilization['車両'].inUse += stat._count;
      } else if (stat.status === 'available' || stat.status === 'active') {
        assetUtilization['車両'].available += stat._count;
      }
    });

    const assetUtilizationData = Object.entries(assetUtilization).map(([category, data]) => ({
      category,
      total: data.total,
      inUse: data.inUse,
      available: data.available,
      utilizationRate: data.total > 0 ? Math.round((data.inUse / data.total) * 100) : 0,
    }));

    return createSuccessResponse({
      // 全社統計（上部4カード）
      kpiCards: {
        totalEmployees,
        todayAttendance,
        attendanceRate,
        pendingApprovals,
        urgentApprovals,
      },
      // SaaSコスト（カテゴリ別）
      saasCostByCategory,
      // SaaSコスト（月別推移）
      saasMonthlyTrend,
      saasCategories: categories,
      // 資産利用状況
      assetUtilization: assetUtilizationData,
    }, { cacheSeconds: 60 });
  } catch (error) {
    return handleError(error, 'ダッシュボード統計の取得');
  }
}
