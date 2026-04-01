import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';
import { eachDayOfInterval, startOfMonth, endOfMonth, getDay } from 'date-fns';

// 曜日名→getDay()のインデックスマッピング
const WEEKDAY_MAP: Record<string, number> = {
  '日曜日': 0,
  '月曜日': 1,
  '火曜日': 2,
  '水曜日': 3,
  '木曜日': 4,
  '金曜日': 5,
  '土曜日': 6,
};

// 勤怠区分変換
const CATEGORY_TO_ATTENDANCE_TYPE: Record<string, string> = {
  '出勤': 'weekday',
  '平日': 'weekday',
  '所定休日': 'prescribed_holiday',
  '法定休日': 'legal_holiday',
};

interface ScheduleRow {
  weekday: string;
  category: string;
  patternId: string;
}

/**
 * POST /api/attendance/shifts/auto-generate - 就業ルールに基づく自動シフト生成
 *
 * リクエストボディ:
 * - year: 年（必須）
 * - month: 月（必須）
 * - overwrite: 既存シフトを上書きするか（デフォルト: false）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);
    const { year, month, overwrite = false } = body;

    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'year and month are required' },
        { status: 400 }
      );
    }

    // 月の日付配列
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // 就業ルールとユーザーを取得
    const workRules = await prisma.work_rules.findMany({
      where: { tenantId, isActive: true },
      include: {
        users: {
          where: { status: 'active' },
          select: { id: true, name: true },
        },
      },
    });

    let createdCount = 0;
    let skippedCount = 0;

    for (const rule of workRules) {
      const settings = rule.settings as Record<string, unknown> | null;
      const scheduleRows = (settings?.scheduleRows as ScheduleRow[] | undefined) || [];

      // 勤務スケジュールが設定されていない就業ルールはスキップ
      if (scheduleRows.length === 0) continue;

      // 曜日→スケジュール行のマップ
      const scheduleByDayOfWeek = new Map<number, ScheduleRow>();
      for (const row of scheduleRows) {
        const dayIndex = WEEKDAY_MAP[row.weekday];
        if (dayIndex !== undefined && row.patternId) {
          scheduleByDayOfWeek.set(dayIndex, row);
        }
      }

      if (scheduleByDayOfWeek.size === 0) continue;

      for (const user of rule.users) {
        for (const day of days) {
          const dayOfWeek = getDay(day);
          const schedule = scheduleByDayOfWeek.get(dayOfWeek);

          if (!schedule) continue;

          // 既存シフトがある場合
          if (!overwrite) {
            const existing = await prisma.shift_assignments.findUnique({
              where: {
                tenantId_userId_date: {
                  tenantId,
                  userId: user.id,
                  date: day,
                },
              },
            });
            if (existing) {
              skippedCount++;
              continue;
            }
          }

          await prisma.shift_assignments.upsert({
            where: {
              tenantId_userId_date: {
                tenantId,
                userId: user.id,
                date: day,
              },
            },
            update: {
              patternId: schedule.patternId,
              attendanceType: CATEGORY_TO_ATTENDANCE_TYPE[schedule.category] || 'weekday',
              updatedAt: new Date(),
            },
            create: {
              id: crypto.randomUUID(),
              tenantId,
              userId: user.id,
              date: day,
              patternId: schedule.patternId,
              attendanceType: CATEGORY_TO_ATTENDANCE_TYPE[schedule.category] || 'weekday',
              updatedAt: new Date(),
            },
          });
          createdCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        createdCount,
        skippedCount,
        message: `${createdCount}件のシフトを自動生成しました（${skippedCount}件スキップ）`,
      },
    });
  } catch (error) {
    return handleApiError(error, 'シフト自動生成');
  }
}
