import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';

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

      // 6. PC資産
      prisma.pc_assets.findMany({
        where: { tenantId },
        select: {
          id: true,
          status: true,
          assignedUserId: true,
        },
      }),

      // 7. 一般資産
      prisma.general_assets.findMany({
        where: { tenantId },
        select: {
          id: true,
          category: true,
          status: true,
          assignedUserId: true,
        },
      }),

      // 8. 車両
      prisma.vehicles.findMany({
        where: { tenantId },
        select: {
          id: true,
          status: true,
          assignedUserId: true,
        },
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

    // 資産利用状況集計
    const allAssets = [
      ...pcAssets.map((a) => ({ ...a, type: 'PC' })),
      ...generalAssets.map((a) => ({ ...a, type: a.category })),
      ...vehicles.map((a) => ({ ...a, type: '車両' })),
    ];

    const assetUtilization: Record<string, { total: number; inUse: number; available: number }> = {};

    allAssets.forEach((asset) => {
      const type = asset.type;
      if (!assetUtilization[type]) {
        assetUtilization[type] = { total: 0, inUse: 0, available: 0 };
      }
      assetUtilization[type].total++;

      if (asset.assignedUserId && asset.status === 'active') {
        assetUtilization[type].inUse++;
      } else if (asset.status === 'active') {
        assetUtilization[type].available++;
      }
    });

    const assetUtilizationData = Object.entries(assetUtilization).map(([category, data]) => ({
      category,
      total: data.total,
      inUse: data.inUse,
      available: data.available,
      utilizationRate: data.total > 0 ? Math.round((data.inUse / data.total) * 100) : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
