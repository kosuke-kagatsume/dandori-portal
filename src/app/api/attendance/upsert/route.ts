import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, getTenantIdFromRequest } from '@/lib/api/api-helpers';

// HH:mm形式の時刻をJSTとして正しくDateに変換
function toJstDateTime(date: string, time: string): Date {
  // HH:mm or HH:mm:ss に対応
  const timePart = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
  return new Date(`${date}T${timePart}+09:00`);
}

// POST /api/attendance/upsert - 勤怠upsert（同日の場合は更新、なければ新規作成）
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    const {
      userId,
      date,
      checkIn,
      checkOut,
      breakStart,
      breakEnd,
      totalBreakMinutes = 0,
      workMinutes = 0,
      overtimeMinutes = 0,
      workLocation = 'office',
      status = 'present',
      memo,
      approvalStatus,
      approvalReason,
      punchHistory,
    } = body;

    // バリデーション
    if (!userId || !date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['userId', 'date'],
        },
        { status: 400 }
      );
    }

    // upsert実行
    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId,
          date: new Date(date),
        },
      },
      update: {
        ...(checkIn !== undefined && { checkIn: checkIn ? toJstDateTime(date, checkIn) : null }),
        ...(checkOut !== undefined && { checkOut: checkOut ? toJstDateTime(date, checkOut) : null }),
        ...(breakStart !== undefined && { breakStart: breakStart ? toJstDateTime(date, breakStart) : null }),
        ...(breakEnd !== undefined && { breakEnd: breakEnd ? toJstDateTime(date, breakEnd) : null }),
        totalBreakMinutes,
        workMinutes,
        overtimeMinutes,
        workLocation,
        status,
        ...(memo !== undefined && { memo }),
        ...(approvalStatus !== undefined && { approvalStatus }),
        ...(approvalReason !== undefined && { approvalReason }),
      },
      create: {
        id: crypto.randomUUID(),
        tenantId,
        userId,
        date: new Date(date),
        checkIn: checkIn ? toJstDateTime(date, checkIn) : null,
        checkOut: checkOut ? toJstDateTime(date, checkOut) : null,
        breakStart: breakStart ? toJstDateTime(date, breakStart) : null,
        breakEnd: breakEnd ? toJstDateTime(date, breakEnd) : null,
        totalBreakMinutes,
        workMinutes,
        overtimeMinutes,
        workLocation,
        status,
        memo,
        approvalStatus,
        approvalReason,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
          },
        },
      },
    });

    // 打刻履歴をattendance_punchesテーブルに保存
    if (punchHistory && Array.isArray(punchHistory) && punchHistory.length > 0) {
      // 既存の打刻履歴を削除して新しいものに置換
      await prisma.attendance_punches.deleteMany({
        where: { attendanceId: attendance.id },
      });

      // 打刻順序を計算して挿入
      const punchRecords = punchHistory.map((punch: { type: string; time: string; method?: string; note?: string }, index: number) => ({
        id: crypto.randomUUID(),
        tenantId,
        userId,
        attendanceId: attendance.id,
        date: new Date(date),
        punchType: punch.type,
        punchTime: toJstDateTime(date, punch.time),
        punchOrder: Math.floor(index / 4) + 1,
        workLocation: workLocation || null,
        memo: punch.note || null,
        updatedAt: new Date(),
      }));

      if (punchRecords.length > 0) {
        await prisma.attendance_punches.createMany({
          data: punchRecords,
        });
      }
    }

    // 打刻履歴を含めて再取得
    const result = await prisma.attendance.findUnique({
      where: { id: attendance.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
          },
        },
        punches: {
          orderBy: { punchTime: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error, '勤怠記録の作成/更新');
  }
}
