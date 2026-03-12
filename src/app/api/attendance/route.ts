import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET /api/attendance - 勤怠一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
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
        workPatternId: true,
        workPatternName: true,
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
        punches: {
          select: {
            id: true,
            punchType: true,
            punchTime: true,
            punchOrder: true,
            workLocation: true,
            memo: true,
          },
          orderBy: { punchTime: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    });

    // B2: work_patternsからworkingMinutes等を取得して各レコードに付加
    const patternIds = Array.from(new Set(attendance.map(a => a.workPatternId).filter(Boolean))) as string[];
    let patternMap: Record<string, { workingMinutes: number; workStartTime: string; workEndTime: string; breakStartTime: string | null; breakEndTime: string | null; breakDurationMinutes: number; isNightShift: boolean }> = {};
    if (patternIds.length > 0) {
      const patterns = await prisma.work_patterns.findMany({
        where: { id: { in: patternIds }, tenantId },
        select: { id: true, workingMinutes: true, workStartTime: true, workEndTime: true, breakStartTime: true, breakEndTime: true, breakDurationMinutes: true, isNightShift: true },
      });
      patternMap = Object.fromEntries(patterns.map(p => [p.id, p]));
    }

    // デフォルトパターンも取得（workPatternId未設定時用）
    const defaultPattern = await prisma.work_patterns.findFirst({
      where: { tenantId, isDefault: true },
      select: { id: true, workingMinutes: true, workStartTime: true, workEndTime: true, breakStartTime: true, breakEndTime: true, breakDurationMinutes: true, isNightShift: true },
    });

    const enrichedAttendance = attendance.map(a => {
      const pattern = (a.workPatternId && patternMap[a.workPatternId]) || defaultPattern;
      return {
        ...a,
        workPatternWorkingMinutes: pattern?.workingMinutes ?? 480,
        workPatternStartTime: pattern?.workStartTime ?? '09:00',
        workPatternEndTime: pattern?.workEndTime ?? '18:00',
        workPatternBreakStartTime: pattern?.breakStartTime ?? null,
        workPatternBreakEndTime: pattern?.breakEndTime ?? null,
        workPatternBreakDurationMinutes: pattern?.breakDurationMinutes ?? 60,
        workPatternIsNightShift: pattern?.isNightShift ?? false,
      };
    });

    return successResponse(enrichedAttendance, {
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

    // トランザクションで存在チェック＆作成（Race Condition回避）
    const attendance = await prisma.$transaction(async (tx) => {
      // 同日の勤怠レコード存在チェック
      const existingAttendance = await tx.attendance.findUnique({
        where: {
          userId_date: {
            userId,
            date: new Date(date),
          },
        },
      });

      if (existingAttendance) {
        // 既存レコードがある場合は更新
        return tx.attendance.update({
          where: {
            userId_date: {
              userId,
              date: new Date(date),
            },
          },
          data: {
            checkIn: checkIn ? new Date(checkIn) : existingAttendance.checkIn,
            checkOut: checkOut ? new Date(checkOut) : existingAttendance.checkOut,
            breakStart: breakStart ? new Date(breakStart) : existingAttendance.breakStart,
            breakEnd: breakEnd ? new Date(breakEnd) : existingAttendance.breakEnd,
            totalBreakMinutes: totalBreakMinutes || existingAttendance.totalBreakMinutes,
            workMinutes: workMinutes || existingAttendance.workMinutes,
            overtimeMinutes: overtimeMinutes || existingAttendance.overtimeMinutes,
            workLocation: workLocation || existingAttendance.workLocation,
            status: status || existingAttendance.status,
            memo: memo ?? existingAttendance.memo,
            approvalStatus: approvalStatus ?? existingAttendance.approvalStatus,
            approvalReason: approvalReason ?? existingAttendance.approvalReason,
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
      }

      // 新規作成
      return tx.attendance.create({
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
