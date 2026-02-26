import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// 今日の日付を取得（YYYY-MM-DD形式）
const getTodayDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/**
 * GET /api/attendance/punches - 打刻履歴取得
 *
 * クエリパラメータ:
 * - userId: ユーザーID（必須）
 * - date: 日付（YYYY-MM-DD形式、省略時は今日）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date') || getTodayDateString();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // 指定日の打刻履歴を取得
    const punches = await prisma.attendance_punches.findMany({
      where: {
        tenantId,
        userId,
        date: new Date(date),
      },
      orderBy: [
        { punchOrder: 'asc' },
        { punchTime: 'asc' },
      ],
    });

    // 打刻をペア（出勤-退勤）にグループ化
    const punchPairs: Array<{
      order: number;
      checkIn?: { time: string; location?: unknown };
      checkOut?: { time: string; location?: unknown };
      breakStart?: { time: string };
      breakEnd?: { time: string };
    }> = [];

    punches.forEach((punch) => {
      let pair = punchPairs.find((p) => p.order === punch.punchOrder);
      if (!pair) {
        pair = { order: punch.punchOrder };
        punchPairs.push(pair);
      }

      const timeString = new Date(punch.punchTime).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      });

      switch (punch.punchType) {
        case 'check_in':
          pair.checkIn = { time: timeString, location: punch.location };
          break;
        case 'check_out':
          pair.checkOut = { time: timeString, location: punch.location };
          break;
        case 'break_start':
          pair.breakStart = { time: timeString };
          break;
        case 'break_end':
          pair.breakEnd = { time: timeString };
          break;
      }
    });

    return successResponse({
      punches,
      punchPairs: punchPairs.sort((a, b) => a.order - b.order),
      date,
    });
  } catch (error) {
    return handleApiError(error, '打刻履歴の取得');
  }
}

/**
 * POST /api/attendance/punches - 打刻登録
 *
 * リクエストボディ:
 * - userId: ユーザーID（必須）
 * - punchType: 'check_in' | 'check_out' | 'break_start' | 'break_end'（必須）
 * - punchTime: 打刻時刻（ISO形式、省略時は現在時刻）
 * - workLocation: 勤務場所（check_in時のみ）
 * - location: GPS座標（オプション）
 * - memo: メモ（オプション）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    const {
      userId,
      punchType,
      punchTime,
      workLocation,
      location,
      memo,
    } = body;

    // バリデーション
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!punchType || !['check_in', 'check_out', 'break_start', 'break_end'].includes(punchType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid punchType' },
        { status: 400 }
      );
    }

    const now = punchTime ? new Date(punchTime) : new Date();
    const today = getTodayDateString();
    const dateForDb = new Date(today);

    // トランザクションで処理
    const result = await prisma.$transaction(async (tx) => {
      // 1. 今日のattendanceレコードを取得または作成
      let attendance = await tx.attendance.findUnique({
        where: {
          userId_date: {
            userId,
            date: dateForDb,
          },
        },
      });

      if (!attendance) {
        attendance = await tx.attendance.create({
          data: {
            id: crypto.randomUUID(),
            tenantId,
            userId,
            date: dateForDb,
            status: 'present',
            updatedAt: new Date(),
          },
        });
      }

      // 2. 現在の打刻順序を決定
      let punchOrder = 1;

      if (punchType === 'check_in') {
        // 新しい出勤 = 新しい打刻組
        const lastCheckIn = await tx.attendance_punches.findFirst({
          where: {
            attendanceId: attendance.id,
            punchType: 'check_in',
          },
          orderBy: { punchOrder: 'desc' },
        });
        punchOrder = lastCheckIn ? lastCheckIn.punchOrder + 1 : 1;
      } else {
        // 退勤/休憩は最新の出勤と同じ組
        const lastCheckIn = await tx.attendance_punches.findFirst({
          where: {
            attendanceId: attendance.id,
            punchType: 'check_in',
          },
          orderBy: { punchOrder: 'desc' },
        });
        punchOrder = lastCheckIn?.punchOrder || 1;
      }

      // 3. 打刻レコードを作成
      const punch = await tx.attendance_punches.create({
        data: {
          id: crypto.randomUUID(),
          tenantId,
          userId,
          attendanceId: attendance.id,
          date: dateForDb,
          punchType,
          punchTime: now,
          punchOrder,
          workLocation: punchType === 'check_in' ? workLocation : null,
          location,
          memo,
          updatedAt: new Date(),
        },
      });

      // 4. attendanceの集計を更新
      const allPunches = await tx.attendance_punches.findMany({
        where: { attendanceId: attendance.id },
        orderBy: [{ punchOrder: 'asc' }, { punchTime: 'asc' }],
      });

      // 最初の出勤と最後の退勤を取得
      const checkIns = allPunches.filter((p) => p.punchType === 'check_in');
      const checkOuts = allPunches.filter((p) => p.punchType === 'check_out');
      const breakStarts = allPunches.filter((p) => p.punchType === 'break_start');
      const breakEnds = allPunches.filter((p) => p.punchType === 'break_end');

      const firstCheckIn = checkIns[0];
      const lastCheckOut = checkOuts[checkOuts.length - 1];

      // 休憩時間の計算
      let totalBreakMinutes = 0;
      breakStarts.forEach((breakStart) => {
        const breakEnd = breakEnds.find(
          (e) => e.punchOrder === breakStart.punchOrder && e.punchTime > breakStart.punchTime
        );
        if (breakEnd) {
          totalBreakMinutes += Math.floor(
            (breakEnd.punchTime.getTime() - breakStart.punchTime.getTime()) / 1000 / 60
          );
        }
      });

      // 勤務時間の計算
      let workMinutes = 0;
      let overtimeMinutes = 0;
      if (firstCheckIn && lastCheckOut) {
        const totalMinutes = Math.floor(
          (lastCheckOut.punchTime.getTime() - firstCheckIn.punchTime.getTime()) / 1000 / 60
        );
        workMinutes = Math.max(0, totalMinutes - totalBreakMinutes);
        overtimeMinutes = Math.max(0, workMinutes - 480); // 8時間 = 480分
      }

      // attendanceを更新
      await tx.attendance.update({
        where: { id: attendance.id },
        data: {
          checkIn: firstCheckIn?.punchTime,
          checkOut: lastCheckOut?.punchTime,
          checkInLocation: firstCheckIn?.location as object | undefined,
          checkOutLocation: lastCheckOut?.location as object | undefined,
          totalBreakMinutes,
          workMinutes,
          overtimeMinutes,
          workLocation: firstCheckIn?.workLocation || 'office',
          updatedAt: new Date(),
        },
      });

      return {
        punch,
        attendance: await tx.attendance.findUnique({
          where: { id: attendance.id },
          include: {
            punches: {
              orderBy: [{ punchOrder: 'asc' }, { punchTime: 'asc' }],
            },
          },
        }),
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating punch:', error);
    return handleApiError(error, '打刻の登録');
  }
}
