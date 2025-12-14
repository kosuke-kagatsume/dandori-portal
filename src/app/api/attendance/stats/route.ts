import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 勤怠統計API
 * GET /api/attendance/stats
 *
 * クエリパラメータ:
 * - tenantId: テナントID（必須）
 * - date: 集計対象日（YYYY-MM-DD形式、デフォルト: 今日）
 * - month: 集計対象月（YYYY-MM形式、月次集計用）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const dateParam = searchParams.get('date');
    const monthParam = searchParams.get('month');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId は必須です' },
        { status: 400 }
      );
    }

    const today = dateParam ? new Date(dateParam) : new Date();
    today.setHours(0, 0, 0, 0);

    // 月次集計の場合
    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);

      // 日次集計データを取得
      const dailyMetrics = await prisma.daily_attendance_metrics.findMany({
        where: {
          tenantId,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      // 月次集計
      const monthlyStats = {
        totalWorkDays: dailyMetrics.length,
        avgAttendanceRate: 0,
        totalOvertime: 0,
        avgOvertimePerDay: 0,
        totalLateCount: 0,
        totalEarlyLeaveCount: 0,
        totalAbsentCount: 0,
      };

      if (dailyMetrics.length > 0) {
        const totalAttendanceRate = dailyMetrics.reduce((sum, d) => sum + d.attendanceRate, 0);
        monthlyStats.avgAttendanceRate = Math.round((totalAttendanceRate / dailyMetrics.length) * 10) / 10;
        monthlyStats.totalOvertime = dailyMetrics.reduce((sum, d) => sum + d.totalOvertimeMinutes, 0);
        monthlyStats.avgOvertimePerDay = Math.round(monthlyStats.totalOvertime / dailyMetrics.length);
        monthlyStats.totalLateCount = dailyMetrics.reduce((sum, d) => sum + d.lateCount, 0);
        monthlyStats.totalEarlyLeaveCount = dailyMetrics.reduce((sum, d) => sum + d.earlyLeaveCount, 0);
        monthlyStats.totalAbsentCount = dailyMetrics.reduce((sum, d) => sum + d.absentCount, 0);
      }

      return NextResponse.json({
        success: true,
        data: {
          type: 'monthly',
          month: monthParam,
          stats: monthlyStats,
          dailyMetrics: dailyMetrics.map((d) => ({
            date: d.date,
            totalEmployees: d.totalEmployees,
            presentCount: d.presentCount,
            attendanceRate: d.attendanceRate,
            lateCount: d.lateCount,
            earlyLeaveCount: d.earlyLeaveCount,
            absentCount: d.absentCount,
            totalOvertimeMinutes: d.totalOvertimeMinutes,
          })),
        },
      });
    }

    // 日次統計
    // テナントの従業員数を取得
    const totalEmployees = await prisma.users.count({
      where: {
        tenantId,
        status: 'active',
      },
    });

    // 本日の勤怠データを取得
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        tenantId,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 統計計算
    const presentCount = attendanceRecords.filter((a) => a.checkIn !== null).length;
    const attendanceRate = totalEmployees > 0
      ? Math.round((presentCount / totalEmployees) * 1000) / 10
      : 0;

    // 遅刻者（9:00以降にチェックイン）
    const lateArrivals = attendanceRecords.filter((a) => {
      if (!a.checkIn) return false;
      const checkInTime = new Date(a.checkIn);
      return checkInTime.getHours() >= 9 && checkInTime.getMinutes() > 0;
    });

    // 早退者
    const earlyLeaves = attendanceRecords.filter((a) => {
      if (!a.checkOut) return false;
      const checkOutTime = new Date(a.checkOut);
      return checkOutTime.getHours() < 18;
    });

    // 残業時間計算（18:00以降の勤務）
    let totalOvertimeMinutes = 0;
    attendanceRecords.forEach((a) => {
      if (a.checkOut) {
        const checkOut = new Date(a.checkOut);
        const standardEnd = new Date(a.date);
        standardEnd.setHours(18, 0, 0, 0);

        if (checkOut > standardEnd) {
          const overtimeMs = checkOut.getTime() - standardEnd.getTime();
          totalOvertimeMinutes += Math.floor(overtimeMs / (1000 * 60));
        }
      }
    });

    // 出勤ステータス別の内訳
    const statusBreakdown = {
      working: attendanceRecords.filter((a) => a.checkIn && !a.checkOut).length,
      completed: attendanceRecords.filter((a) => a.checkIn && a.checkOut).length,
      onBreak: attendanceRecords.filter((a) => a.status === 'break').length,
      absent: totalEmployees - presentCount,
    };

    // キャッシュ用に DailyAttendanceMetric を更新/作成
    await prisma.daily_attendance_metrics.upsert({
      where: {
        tenantId_date: {
          tenantId,
          date: todayStart,
        },
      },
      create: {
        tenantId,
        date: todayStart,
        totalEmployees,
        presentCount,
        attendanceRate,
        lateCount: lateArrivals.length,
        earlyLeaveCount: earlyLeaves.length,
        absentCount: totalEmployees - presentCount,
        totalOvertimeMinutes,
      },
      update: {
        totalEmployees,
        presentCount,
        attendanceRate,
        lateCount: lateArrivals.length,
        earlyLeaveCount: earlyLeaves.length,
        absentCount: totalEmployees - presentCount,
        totalOvertimeMinutes,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        type: 'daily',
        date: today.toISOString().split('T')[0],
        stats: {
          totalEmployees,
          presentCount,
          attendanceRate,
          lateCount: lateArrivals.length,
          earlyLeaveCount: earlyLeaves.length,
          absentCount: totalEmployees - presentCount,
          totalOvertimeMinutes,
          avgOvertimeMinutes: presentCount > 0 ? Math.round(totalOvertimeMinutes / presentCount) : 0,
        },
        statusBreakdown,
        lateArrivals: lateArrivals.map((a) => ({
          userId: a.userId,
          userName: a.user.name,
          checkIn: a.checkIn,
        })),
      },
    });
  } catch (error) {
    console.error('[API] Attendance stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '勤怠統計の取得に失敗しました',
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
