import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// GET /api/dashboard/charts/company-stats - 全社統計
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const type = searchParams.get('type') || 'attendance'; // attendance | leave | salary
    const months = parseInt(searchParams.get('months') || '6', 10);

    if (type === 'attendance') {
      // 全社勤怠トレンド
      const data = [];

      for (let i = months - 1; i >= 0; i--) {
        const now = new Date();
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const totalEmployees = await prisma.users.count({
          where: { tenantId, status: 'active' },
        });

        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            tenantId,
            date: {
              gte: monthDate,
              lte: monthEnd,
            },
          },
        });

        // 出勤率計算（出勤日数 / 営業日数）
        const workDays = getWorkDaysInMonth(monthDate.getFullYear(), monthDate.getMonth());
        const presentDays = attendanceRecords.filter(
          (r) => r.status === 'present' || r.status === 'remote' || r.status === 'late'
        ).length;
        const attendanceRate = totalEmployees > 0 && workDays > 0
          ? Math.round((presentDays / (totalEmployees * workDays)) * 100)
          : 0;

        // 平均労働時間
        const totalWorkMinutes = attendanceRecords.reduce(
          (sum, r) => sum + (r.workMinutes || 0),
          0
        );
        const averageWorkHours = attendanceRecords.length > 0
          ? Math.round((totalWorkMinutes / attendanceRecords.length / 60) * 10) / 10
          : 8;

        data.push({
          month: `${monthDate.getMonth() + 1}月`,
          attendanceRate: Math.min(attendanceRate, 100),
          averageWorkHours,
        });
      }

      return successResponse(data);
    }

    if (type === 'leave') {
      // 部署別休暇取得率
      const departments = await prisma.departments.findMany({
        where: { tenantId },
      });

      const currentYear = new Date().getFullYear();

      const data = await Promise.all(
        departments.map(async (dept) => {
          const users = await prisma.users.findMany({
            where: { tenantId, department: dept.name, status: 'active' },
            select: { id: true },
          });

          const userIds = users.map((u) => u.id);

          const leaveRequests = await prisma.leave_requests.findMany({
            where: {
              tenantId,
              userId: { in: userIds },
              status: 'approved',
              startDate: {
                gte: new Date(currentYear, 0, 1),
                lte: new Date(currentYear, 11, 31),
              },
            },
          });

          const totalUsedDays = leaveRequests.reduce((sum, r) => sum + r.days, 0);

          return {
            department: dept.name,
            usedDays: Math.round(totalUsedDays),
            memberCount: users.length,
            averagePerPerson: users.length > 0
              ? Math.round((totalUsedDays / users.length) * 10) / 10
              : 0,
          };
        })
      );

      return successResponse(data);
    }

    if (type === 'salary') {
      // 部署別給与（給与明細テーブルから取得）
      const departments = await prisma.departments.findMany({
        where: { tenantId },
      });

      // pay_slipsテーブルからデータを取得
      const currentMonth = new Date();
      const payPeriod = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

      const data = await Promise.all(
        departments.map(async (dept) => {
          const users = await prisma.users.findMany({
            where: { tenantId, department: dept.name, status: 'active' },
            select: { id: true },
          });

          const userIds = users.map((u: { id: string }) => u.id);

          // 給与明細データを取得
          const paySlips = await prisma.pay_slips.findMany({
            where: {
              tenantId,
              userId: { in: userIds },
              payPeriod,
            },
          });

          const totalBaseSalary = paySlips.reduce((sum: number, p) => sum + (p.basicSalary || 0), 0);
          const totalAllowances = paySlips.reduce(
            (sum: number, p) =>
              sum +
              (p.commuteAllowance || 0) +
              (p.housingAllowance || 0) +
              (p.positionAllowance || 0) +
              (p.qualificationAllowance || 0),
            0
          );
          const totalOvertime = paySlips.reduce((sum: number, p) => sum + (p.overtimeAllowance || 0), 0);

          const count = paySlips.length || 1;

          return {
            department: dept.name,
            baseSalary: Math.round(totalBaseSalary / count),
            allowances: Math.round(totalAllowances / count),
            overtime: Math.round(totalOvertime / count),
          };
        })
      );

      return successResponse(data);
    }

    return successResponse([]);
  } catch (error) {
    return handleApiError(error, '全社統計の取得');
  }
}

// 月の営業日数を計算
function getWorkDaysInMonth(year: number, month: number): number {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let workDays = 0;

  for (let day = firstDay; day <= lastDay; day.setDate(day.getDate() + 1)) {
    const dayOfWeek = day.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workDays++;
    }
  }

  return workDays;
}
