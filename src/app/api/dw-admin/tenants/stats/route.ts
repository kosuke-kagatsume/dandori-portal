import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * DW管理 - テナント統計API
 * GET /api/dw-admin/tenants/stats
 *
 * ダッシュボード用の統計データを返す
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // 並行してデータを取得
    const [
      totalTenants,
      totalUsers,
      tenantsWithSettings,
      newTenantsThisMonth,
      monthlyRevenue,
      lastMonthRevenue,
      overdueInvoices,
      pendingTrials,
    ] = await Promise.all([
      // 総テナント数
      prisma.tenant.count(),

      // 総ユーザー数
      prisma.user.count(),

      // テナントとそのステータス
      prisma.tenant.findMany({
        include: {
          settings: {
            select: {
              status: true,
              trialEndDate: true,
              contractEndDate: true,
            },
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
      }),

      // 今月の新規テナント
      prisma.tenant.count({
        where: {
          createdAt: {
            gte: thisMonthStart,
          },
        },
      }),

      // 今月の売上（支払い済み請求書）
      prisma.invoice.aggregate({
        where: {
          status: 'paid',
          paidDate: {
            gte: thisMonthStart,
          },
        },
        _sum: {
          total: true,
        },
      }),

      // 先月の売上
      prisma.invoice.aggregate({
        where: {
          status: 'paid',
          paidDate: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
        _sum: {
          total: true,
        },
      }),

      // 延滞請求書
      prisma.invoice.count({
        where: {
          status: 'overdue',
        },
      }),

      // トライアル終了間近（7日以内）
      prisma.tenantSettings.count({
        where: {
          status: 'trial',
          trialEndDate: {
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            gte: now,
          },
        },
      }),
    ]);

    // ステータス別テナント集計
    const statusCounts = {
      trial: 0,
      active: 0,
      suspended: 0,
      cancelled: 0,
    };

    tenantsWithSettings.forEach((tenant) => {
      const status = tenant.settings?.status || 'trial';
      if (status in statusCounts) {
        statusCounts[status as keyof typeof statusCounts]++;
      }
    });

    // 売上計算
    const currentMonthRevenue = monthlyRevenue._sum.total || 0;
    const previousMonthRevenue = lastMonthRevenue._sum.total || 0;

    // 成長率計算
    const revenueGrowth = previousMonthRevenue > 0
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : currentMonthRevenue > 0
        ? 100
        : 0;

    // 平均ユーザー数/テナント
    const avgUsersPerTenant = totalTenants > 0 ? Math.round(totalUsers / totalTenants) : 0;

    // アラート情報
    const alerts = [];

    if (overdueInvoices > 0) {
      alerts.push({
        type: 'payment_overdue',
        message: `${overdueInvoices}件の請求書が延滞中です`,
        severity: 'high',
      });
    }

    if (pendingTrials > 0) {
      alerts.push({
        type: 'trial_expiring',
        message: `${pendingTrials}件のトライアルが7日以内に終了します`,
        severity: 'medium',
      });
    }

    // 契約終了間近のテナントをチェック
    const expiringContracts = tenantsWithSettings.filter((t) => {
      if (!t.settings?.contractEndDate) return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(t.settings.contractEndDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });

    if (expiringContracts.length > 0) {
      alerts.push({
        type: 'contract_expiring',
        message: `${expiringContracts.length}件の契約が30日以内に終了します`,
        severity: 'medium',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalTenants,
          totalUsers,
          avgUsersPerTenant,
          newTenantsThisMonth,
        },
        revenue: {
          currentMonth: currentMonthRevenue,
          previousMonth: previousMonthRevenue,
          growth: Math.round(revenueGrowth * 10) / 10, // 小数点1桁
        },
        tenantsByStatus: statusCounts,
        billing: {
          overdueInvoices,
          pendingTrials,
          expiringContracts: expiringContracts.length,
        },
        alerts,
      },
    });
  } catch (error) {
    console.error('[API] DW Admin - Get tenant stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '統計データの取得に失敗しました',
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
