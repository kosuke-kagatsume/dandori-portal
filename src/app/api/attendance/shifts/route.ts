import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

/**
 * GET /api/attendance/shifts - シフト割り当て取得
 *
 * クエリパラメータ:
 * - year: 年（必須）
 * - month: 月（必須）
 * - userId: ユーザーID（省略時は全員）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const year = parseInt(searchParams.get('year') || '');
    const month = parseInt(searchParams.get('month') || '');
    const userId = searchParams.get('userId');

    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'year and month are required' },
        { status: 400 }
      );
    }

    // 月の開始日・終了日
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // 月末

    const where: Record<string, unknown> = {
      tenantId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };
    if (userId) {
      where.userId = userId;
    }

    const shifts = await prisma.shift_assignments.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
      },
      orderBy: [{ userId: 'asc' }, { date: 'asc' }],
    });

    // 勤務パターン一覧も返す（UIで名前・色を表示するため）
    const patterns = await prisma.work_patterns.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return successResponse({ shifts, patterns });
  } catch (error) {
    return handleApiError(error, 'シフト取得');
  }
}

/**
 * POST /api/attendance/shifts - シフト登録/更新（upsert）
 *
 * リクエストボディ:
 * - userId: ユーザーID（必須）
 * - date: 日付 YYYY-MM-DD（必須）
 * - patternId: 勤務パターンID（必須）
 * - attendanceType: 'weekday' | 'prescribed_holiday' | 'legal_holiday'（任意、デフォルト'weekday'）
 * - memo: メモ（任意）
 *
 * または一括登録:
 * - assignments: Array<{ userId, date, patternId, attendanceType?, memo? }>
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    // 一括登録
    if (body.assignments && Array.isArray(body.assignments)) {
      const results = await prisma.$transaction(
        body.assignments.map((a: { userId: string; date: string; patternId: string; attendanceType?: string; memo?: string }) =>
          prisma.shift_assignments.upsert({
            where: {
              tenantId_userId_date: {
                tenantId,
                userId: a.userId,
                date: new Date(a.date),
              },
            },
            update: {
              patternId: a.patternId,
              attendanceType: a.attendanceType || 'weekday',
              memo: a.memo || null,
              updatedAt: new Date(),
            },
            create: {
              id: crypto.randomUUID(),
              tenantId,
              userId: a.userId,
              date: new Date(a.date),
              patternId: a.patternId,
              attendanceType: a.attendanceType || 'weekday',
              memo: a.memo || null,
              updatedAt: new Date(),
            },
          })
        )
      );
      return NextResponse.json({ success: true, data: results }, { status: 201 });
    }

    // 単体登録
    const { userId, date, patternId, attendanceType, memo } = body;

    if (!userId || !date || !patternId) {
      return NextResponse.json(
        { success: false, error: 'userId, date, patternId are required' },
        { status: 400 }
      );
    }

    const shift = await prisma.shift_assignments.upsert({
      where: {
        tenantId_userId_date: {
          tenantId,
          userId,
          date: new Date(date),
        },
      },
      update: {
        patternId,
        attendanceType: attendanceType || 'weekday',
        memo: memo || null,
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        tenantId,
        userId,
        date: new Date(date),
        patternId,
        attendanceType: attendanceType || 'weekday',
        memo: memo || null,
        updatedAt: new Date(),
      },
    });

    // 勤怠レコードの勤務パターンも連動更新（Phase 3連動）
    const pattern = await prisma.work_patterns.findUnique({
      where: { id: patternId },
    });

    if (pattern) {
      await prisma.attendance.updateMany({
        where: { tenantId, userId, date: new Date(date) },
        data: {
          workPatternId: patternId,
          workPatternName: pattern.name,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, data: shift }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'シフト登録');
  }
}

/**
 * DELETE /api/attendance/shifts - シフト削除
 *
 * クエリパラメータ:
 * - userId: ユーザーID（必須）
 * - date: 日付 YYYY-MM-DD（必須）
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    if (!userId || !date) {
      return NextResponse.json(
        { success: false, error: 'userId and date are required' },
        { status: 400 }
      );
    }

    await prisma.shift_assignments.delete({
      where: {
        tenantId_userId_date: {
          tenantId,
          userId,
          date: new Date(date),
        },
      },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'シフト削除');
  }
}
