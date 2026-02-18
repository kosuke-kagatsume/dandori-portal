import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// GET /api/dashboard/charts/personal-attendance - 個人勤怠トレンド
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '7', 10);

    if (!userId) {
      return successResponse([]);
    }

    // 過去N日間の日付範囲を計算
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

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

    // データを整形
    const data = attendance.map((record) => {
      const date = record.date;
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

      // 時刻を数値に変換（グラフ表示用）
      let clockIn = 9; // デフォルト
      let clockOut = 18; // デフォルト

      if (record.checkIn) {
        const checkInTime = new Date(record.checkIn);
        clockIn = checkInTime.getHours() + checkInTime.getMinutes() / 60;
      }

      if (record.checkOut) {
        const checkOutTime = new Date(record.checkOut);
        clockOut = checkOutTime.getHours() + checkOutTime.getMinutes() / 60;
      }

      return {
        date: dateStr,
        clockIn: Math.round(clockIn * 10) / 10,
        clockOut: Math.round(clockOut * 10) / 10,
        workHours: record.workMinutes ? Math.round(record.workMinutes / 60 * 10) / 10 : 0,
        status: record.status,
      };
    });

    return successResponse(data);
  } catch (error) {
    return handleApiError(error, '個人勤怠トレンドの取得');
  }
}
