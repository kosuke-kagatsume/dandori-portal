import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// GET /api/dashboard/charts/approval-tasks - 承認タスク処理状況
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const approverId = searchParams.get('approverId');
    const weeks = parseInt(searchParams.get('weeks') || '4', 10);

    // 過去N週間のデータを計算
    const data = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);

      // 承認ステップの状態を集計
      const approvedCount = await prisma.approval_steps.count({
        where: {
          tenantId,
          approverId: approverId || undefined,
          status: 'approved',
          actionDate: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      });

      const rejectedCount = await prisma.approval_steps.count({
        where: {
          tenantId,
          approverId: approverId || undefined,
          status: 'rejected',
          actionDate: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      });

      const pendingCount = await prisma.approval_steps.count({
        where: {
          tenantId,
          approverId: approverId || undefined,
          status: 'pending',
          updatedAt: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      });

      data.push({
        week: `W${weeks - i}`,
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount,
      });
    }

    return successResponse(data);
  } catch (error) {
    return handleApiError(error, '承認タスク処理状況の取得');
  }
}
