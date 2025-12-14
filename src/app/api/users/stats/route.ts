import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * ユーザー統計API
 * GET /api/users/stats
 *
 * クエリパラメータ:
 * - tenantId: テナントID（必須）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId は必須です' },
        { status: 400 }
      );
    }

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // 並行してデータを取得
    const [
      totalUsers,
      usersByRole,
      usersByDepartment,
      usersByStatus,
      newUsersThisMonth,
      newUsersLastMonth,
    ] = await Promise.all([
      // 総ユーザー数
      prisma.users.count({
        where: { tenantId },
      }),

      // ロール別集計
      prisma.users.groupBy({
        by: ['role'],
        where: { tenantId },
        _count: true,
      }),

      // 部門別集計
      prisma.users.groupBy({
        by: ['department'],
        where: { tenantId },
        _count: true,
      }),

      // ステータス別集計
      prisma.users.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),

      // 今月の新規ユーザー
      prisma.users.count({
        where: {
          tenantId,
          createdAt: { gte: thisMonthStart },
        },
      }),

      // 先月の新規ユーザー
      prisma.users.count({
        where: {
          tenantId,
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
      }),
    ]);

    // アクティブユーザー数
    const activeUsers = usersByStatus.find((s) => s.status === 'active')?._count || 0;

    // 部門情報を整形
    const departmentStats = usersByDepartment
      .filter((d) => d.department)
      .map((d) => ({
        department: d.department || '未設定',
        count: d._count,
      }))
      .sort((a, b) => b.count - a.count);

    // ロール情報を整形
    const roleStats = usersByRole.map((r) => ({
      role: r.role,
      count: r._count,
    }));

    // 成長率計算
    const growthRate = lastMonthEnd.getTime() > 0 && newUsersLastMonth > 0
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
      : newUsersThisMonth > 0
        ? 100
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          activeUsers,
          newUsersThisMonth,
          growthRate: Math.round(growthRate * 10) / 10,
        },
        byRole: roleStats,
        byDepartment: departmentStats,
        byStatus: usersByStatus.map((s) => ({
          status: s.status,
          count: s._count,
        })),
      },
    });
  } catch (error) {
    console.error('[API] User stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ユーザー統計の取得に失敗しました',
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
