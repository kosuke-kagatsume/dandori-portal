import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, getTenantId } from '@/lib/api/api-helpers';

// POST /api/attendance/upsert - 勤怠upsert（同日の場合は更新、なければ新規作成）
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
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
        ...(checkIn !== undefined && { checkIn: checkIn ? new Date(`${date}T${checkIn}`) : null }),
        ...(checkOut !== undefined && { checkOut: checkOut ? new Date(`${date}T${checkOut}`) : null }),
        ...(breakStart !== undefined && { breakStart: breakStart ? new Date(`${date}T${breakStart}`) : null }),
        ...(breakEnd !== undefined && { breakEnd: breakEnd ? new Date(`${date}T${breakEnd}`) : null }),
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
        tenantId,
        userId,
        date: new Date(date),
        checkIn: checkIn ? new Date(`${date}T${checkIn}`) : null,
        checkOut: checkOut ? new Date(`${date}T${checkOut}`) : null,
        breakStart: breakStart ? new Date(`${date}T${breakStart}`) : null,
        breakEnd: breakEnd ? new Date(`${date}T${breakEnd}`) : null,
        totalBreakMinutes,
        workMinutes,
        overtimeMinutes,
        workLocation,
        status,
        memo,
        approvalStatus,
        approvalReason,
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

    return NextResponse.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    return handleApiError(error, '勤怠記録の作成/更新');
  }
}
