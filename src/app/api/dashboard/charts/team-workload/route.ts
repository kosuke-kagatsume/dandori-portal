import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// GET /api/dashboard/charts/team-workload - チームメンバーワークロード
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const managerId = searchParams.get('managerId');

    // 今月の日付範囲を計算
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // マネージャーの部下を取得
    let teamMembers: { id: string; name: string }[] = [];
    if (managerId) {
      const manager = await prisma.users.findFirst({
        where: { id: managerId, tenantId },
      });

      if (manager?.department) {
        teamMembers = await prisma.users.findMany({
          where: {
            tenantId,
            department: manager.department,
            status: 'active',
          },
          select: { id: true, name: true },
        });
      }
    } else {
      teamMembers = await prisma.users.findMany({
        where: { tenantId, status: 'active' },
        select: { id: true, name: true },
        take: 10,
      });
    }

    // 各メンバーの勤怠データを取得
    const memberWorkloads = await Promise.all(
      teamMembers.map(async (member) => {
        const attendance = await prisma.attendance.findMany({
          where: {
            tenantId,
            userId: member.id,
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        const totalWorkHours = attendance.reduce(
          (sum, record) => sum + (record.workMinutes || 0) / 60,
          0
        );

        const totalOvertimeHours = attendance.reduce(
          (sum, record) => sum + (record.overtimeMinutes || 0) / 60,
          0
        );

        // 完了率の計算（ワークフローの完了タスク数に基づく）
        const completedWorkflows = await prisma.workflow_requests.count({
          where: {
            tenantId,
            requesterId: member.id,
            status: 'approved',
            completedAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        const totalWorkflows = await prisma.workflow_requests.count({
          where: {
            tenantId,
            requesterId: member.id,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        const completionRate = totalWorkflows > 0
          ? Math.round((completedWorkflows / totalWorkflows) * 100)
          : 100;

        return {
          name: member.name,
          workHours: Math.round(totalWorkHours),
          overtimeHours: Math.round(totalOvertimeHours),
          completionRate,
        };
      })
    );

    return successResponse(memberWorkloads);
  } catch (error) {
    return handleApiError(error, 'チームワークロードの取得');
  }
}
