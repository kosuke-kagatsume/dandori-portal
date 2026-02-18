import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// GET /api/dashboard/charts/team-attendance - チーム勤怠トレンド
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const managerId = searchParams.get('managerId');
    const days = parseInt(searchParams.get('days') || '5', 10);

    // 過去N日間の日付範囲を計算
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // マネージャーの部下を取得（同じ部署のメンバー）
    let teamUserIds: string[] = [];
    if (managerId) {
      const manager = await prisma.users.findFirst({
        where: { id: managerId, tenantId },
      });

      if (manager?.department) {
        const teamMembers = await prisma.users.findMany({
          where: {
            tenantId,
            department: manager.department,
            status: 'active',
          },
          select: { id: true },
        });
        teamUserIds = teamMembers.map((u) => u.id);
      }
    }

    // チームの勤怠データを取得
    const attendance = await prisma.attendance.findMany({
      where: {
        tenantId,
        userId: teamUserIds.length > 0 ? { in: teamUserIds } : undefined,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // 日別に集計
    const dailyData: Record<string, { onTime: number; late: number; absent: number }> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;
      dailyData[dateKey] = { onTime: 0, late: 0, absent: 0 };
    }

    // 勤怠データを日別に集計
    attendance.forEach((record) => {
      const date = new Date(record.date);
      const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;
      if (dailyData[dateKey]) {
        if (record.status === 'present' || record.status === 'remote') {
          dailyData[dateKey].onTime += 1;
        } else if (record.status === 'late') {
          dailyData[dateKey].late += 1;
        } else if (record.status === 'absent') {
          dailyData[dateKey].absent += 1;
        }
      }
    });

    // データを整形
    const data = Object.entries(dailyData).map(([date, value]) => ({
      date,
      onTime: value.onTime,
      late: value.late,
      absent: value.absent,
    }));

    return successResponse(data);
  } catch (error) {
    return handleApiError(error, 'チーム勤怠トレンドの取得');
  }
}
