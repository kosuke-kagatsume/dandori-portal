import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/attendance - 勤怠一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.date = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.date = {
        lte: new Date(endDate),
      };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const attendance = await prisma.attendance.findMany({
      where,
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
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: attendance,
      count: attendance.length,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attendance',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/attendance - 打刻（新規勤怠作成）
export async function POST(request: NextRequest) {
  try {
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
      tenantId,
    } = body;

    // バリデーション
    if (!userId || !date || !tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['userId', 'date', 'tenantId'],
        },
        { status: 400 }
      );
    }

    // 同日の勤怠レコード存在チェック
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: new Date(date),
        },
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          error: 'Attendance record already exists for this date',
        },
        { status: 409 }
      );
    }

    // 勤怠レコード作成
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        tenantId,
        date: new Date(date),
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        breakStart: breakStart ? new Date(breakStart) : null,
        breakEnd: breakEnd ? new Date(breakEnd) : null,
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

    return NextResponse.json(
      {
        success: true,
        data: attendance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating attendance:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create attendance',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
