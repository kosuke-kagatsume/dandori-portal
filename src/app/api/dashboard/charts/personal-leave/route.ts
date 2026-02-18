import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// GET /api/dashboard/charts/personal-leave - 個人休暇履歴
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

    // 休暇申請データを取得
    const leaveRequests = await prisma.leave_requests.findMany({
      where: {
        tenantId,
        userId,
        status: 'approved',
        startDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startDate: 'asc' },
    });

    // 休暇残数を取得
    const currentYear = new Date().getFullYear();
    const balance = await prisma.leave_balances.findFirst({
      where: {
        tenantId,
        userId,
        year: currentYear,
      },
    });

    // 月別に集計
    const monthlyData: Record<string, { used: number; remaining: number }> = {};

    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const _monthLabel = `${date.getMonth() + 1}月`;
      monthlyData[monthKey] = { used: 0, remaining: balance?.paidLeaveRemaining || 0 };
    }

    // 休暇申請を月別に集計
    leaveRequests.forEach((req) => {
      const startDate = new Date(req.startDate);
      const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].used += req.days;
      }
    });

    // データを整形
    const data = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const [_year, month] = key.split('-');
        return {
          month: `${parseInt(month)}月`,
          used: value.used,
          remaining: value.remaining,
        };
      });

    return successResponse(data);
  } catch (error) {
    return handleApiError(error, '個人休暇履歴の取得');
  }
}
