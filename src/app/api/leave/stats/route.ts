import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 休暇統計API
 * GET /api/leave/stats
 *
 * クエリパラメータ:
 * - tenantId: テナントID（必須）
 * - year: 集計年（デフォルト: 今年）
 * - userId: 特定ユーザーの統計（オプション）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const yearParam = searchParams.get('year');
    const userId = searchParams.get('userId');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId は必須です' },
        { status: 400 }
      );
    }

    const now = new Date();
    const year = yearParam ? parseInt(yearParam) : now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    // フィルタ条件
    const where: Record<string, unknown> = {
      tenantId,
      startDate: {
        gte: startOfYear,
        lte: endOfYear,
      },
    };

    if (userId) {
      where.userId = userId;
    }

    // 休暇申請データを取得
    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
      },
    });

    // ステータス別集計
    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    };

    // タイプ別集計
    const typeCounts: Record<string, { count: number; days: number }> = {};

    // 月別集計
    const monthlyStats: { month: number; count: number; days: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      monthlyStats.push({ month: m, count: 0, days: 0 });
    }

    // 部門別集計
    const departmentStats: Record<string, { count: number; days: number }> = {};

    let totalDays = 0;
    let approvedDays = 0;

    leaveRequests.forEach((leave) => {
      // ステータス集計
      if (leave.status in statusCounts) {
        statusCounts[leave.status as keyof typeof statusCounts]++;
      }

      // 日数計算
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      totalDays += days;

      if (leave.status === 'approved') {
        approvedDays += days;
      }

      // タイプ別集計
      if (!typeCounts[leave.leaveType]) {
        typeCounts[leave.leaveType] = { count: 0, days: 0 };
      }
      typeCounts[leave.leaveType].count++;
      typeCounts[leave.leaveType].days += days;

      // 月別集計（開始月で集計）
      const month = start.getMonth();
      if (monthlyStats[month]) {
        monthlyStats[month].count++;
        monthlyStats[month].days += days;
      }

      // 部門別集計
      const dept = leave.user.department || '未設定';
      if (!departmentStats[dept]) {
        departmentStats[dept] = { count: 0, days: 0 };
      }
      departmentStats[dept].count++;
      departmentStats[dept].days += days;
    });

    // 今月の休暇取得者
    const thisMonth = now.getMonth();
    const thisMonthRequests = leaveRequests.filter((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      // 今月と重なる休暇
      return (
        leave.status === 'approved' &&
        start.getMonth() <= thisMonth &&
        end.getMonth() >= thisMonth
      );
    });

    // 今日休暇中の人数
    const todayStr = now.toISOString().split('T')[0];
    const onLeaveToday = leaveRequests.filter((leave) => {
      const start = leave.startDate.toISOString().split('T')[0];
      const end = leave.endDate.toISOString().split('T')[0];
      return leave.status === 'approved' && start <= todayStr && end >= todayStr;
    });

    // 承認待ちの一覧
    const pendingRequests = leaveRequests
      .filter((leave) => leave.status === 'pending')
      .map((leave) => ({
        id: leave.id,
        userId: leave.userId,
        userName: leave.user.name,
        department: leave.user.department,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: leave.reason,
        createdAt: leave.createdAt,
      }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: {
        year,
        summary: {
          totalRequests: leaveRequests.length,
          totalDays,
          approvedDays,
          pendingCount: statusCounts.pending,
          onLeaveTodayCount: onLeaveToday.length,
        },
        byStatus: statusCounts,
        byType: Object.entries(typeCounts).map(([type, stats]) => ({
          type,
          ...stats,
        })),
        byMonth: monthlyStats,
        byDepartment: Object.entries(departmentStats).map(([department, stats]) => ({
          department,
          ...stats,
        })),
        pendingRequests: pendingRequests.slice(0, 10), // 最新10件
        onLeaveToday: onLeaveToday.map((leave) => ({
          userId: leave.userId,
          userName: leave.user.name,
          leaveType: leave.leaveType,
          endDate: leave.endDate,
        })),
      },
    });
  } catch (error) {
    console.error('[API] Leave stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '休暇統計の取得に失敗しました',
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
