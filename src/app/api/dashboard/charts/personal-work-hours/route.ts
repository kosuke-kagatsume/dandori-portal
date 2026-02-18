import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// GET /api/dashboard/charts/personal-work-hours - 個人労働時間
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const userId = searchParams.get('userId');
    const months = parseInt(searchParams.get('months') || '6', 10);

    if (!userId) {
      return successResponse([]);
    }

    // 過去N ヶ月の範囲を計算
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // 勤怠データを取得
    const attendance = await prisma.attendance.findMany({
      where: {
        tenantId,
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // 月別に集計
    const monthlyData: Record<string, { standard: number; overtime: number }> = {};

    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = { standard: 0, overtime: 0 };
    }

    // 勤怠データを月別に集計
    attendance.forEach((record) => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[monthKey]) {
        const workHours = (record.workMinutes || 0) / 60;
        const overtimeHours = (record.overtimeMinutes || 0) / 60;
        monthlyData[monthKey].standard += Math.min(workHours, 8);
        monthlyData[monthKey].overtime += overtimeHours;
      }
    });

    // データを整形
    const data = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const [_year, month] = key.split('-');
        return {
          month: `${parseInt(month)}月`,
          standard: Math.round(value.standard),
          overtime: Math.round(value.overtime),
        };
      });

    return successResponse(data);
  } catch (error) {
    return handleApiError(error, '個人労働時間の取得');
  }
}
