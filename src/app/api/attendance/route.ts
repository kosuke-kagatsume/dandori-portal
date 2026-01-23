import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET /api/attendance - 勤怠一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };

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

    // 総件数取得
    const total = await prisma.attendance.count({ where });

    // 勤怠一覧取得（select最適化）
    const attendance = await prisma.attendance.findMany({
      where,
      select: {
        id: true,
        userId: true,
        tenantId: true,
        date: true,
        checkIn: true,
        checkOut: true,
        breakStart: true,
        breakEnd: true,
        totalBreakMinutes: true,
        workMinutes: true,
        overtimeMinutes: true,
        workLocation: true,
        status: true,
        memo: true,
        approvalStatus: true,
        createdAt: true,
        updatedAt: true,
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
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    });

    return successResponse(attendance, {
      count: attendance.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 60, // 1分キャッシュ（勤怠はリアルタイム性重視）
    });
  } catch (error) {
    return handleApiError(error, '勤怠一覧の取得');
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
        id: crypto.randomUUID(),
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
