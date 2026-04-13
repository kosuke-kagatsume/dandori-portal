import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, handleApiError, getTenantIdFromRequest } from '@/lib/api/api-helpers';
import {
  calculateMonthlyDays,
  defaultHolidaySettings,
  type RegularHoliday,
  type AnnualHoliday,
  type CompanyHoliday,
} from '@/lib/attendance/annual-settings-helpers';

/**
 * GET /api/attendance-master/monthly-work-days
 * ?fiscalYear=2026 で月別所定労働日数を返す
 * 年度設定パネルと同じ計算ロジック(calculateMonthlyDays)を使用
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('fiscalYear') || '') || new Date().getFullYear();

    // 会社休日をDBから取得
    const holidays = await prisma.company_holidays.findMany({
      where: {
        tenantId,
        OR: [
          { fiscalYear: year },
          { isRecurring: true },
        ],
      },
    });

    // company_holidays → calculateMonthlyDays の入力形式に変換
    const regularHolidays: RegularHoliday[] = [];
    const annualHolidays: AnnualHoliday[] = [];
    const companyHolidays: CompanyHoliday[] = [];

    for (const h of holidays) {
      const date = new Date(h.date);
      const mapped: CompanyHoliday = {
        id: h.id,
        date: h.date.toISOString().split('T')[0],
        name: h.name,
        type: h.type,
        fiscalYear: h.fiscalYear,
        isRecurring: h.isRecurring,
      };

      if (h.isRecurring) {
        regularHolidays.push({
          id: h.id,
          month: date.getMonth() + 1,
          day: date.getDate(),
          name: h.name,
        });
      } else {
        annualHolidays.push({
          id: h.id,
          date: mapped.date,
          name: h.name,
        });
      }
      companyHolidays.push(mapped);
    }

    const monthlyDays = calculateMonthlyDays(
      year,
      defaultHolidaySettings,
      regularHolidays,
      annualHolidays,
      companyHolidays,
    );

    return successResponse(monthlyDays);
  } catch (error) {
    return handleApiError(error, '月別所定労働日数の取得');
  }
}
