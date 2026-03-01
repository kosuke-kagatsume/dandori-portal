import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api/api-helpers';
import { reportsByTenant } from '../../route';

// POST /api/daily-reports/[id]/reject - 日報差戻し
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tenantId, approverId, approverName, reason } = body;

    if (!tenantId || !approverId || !approverName || !reason) {
      return errorResponse('tenantId, approverId, approverName, reason は必須です', 400);
    }

    const reports = reportsByTenant.get(tenantId);
    if (!reports) {
      return errorResponse('日報が見つかりません', 404);
    }

    const index = reports.findIndex((r) => r.id === id);
    if (index === -1) {
      return errorResponse('日報が見つかりません', 404);
    }

    if (reports[index].status !== 'submitted') {
      return errorResponse('提出済みの日報のみ差戻しできます', 400);
    }

    const now = new Date().toISOString();
    reports[index] = {
      ...reports[index],
      status: 'rejected',
      approverId,
      approverName,
      rejectionReason: reason,
      updatedAt: now,
    };

    return successResponse({ item: reports[index] });
  } catch (error) {
    return handleApiError(error, '日報差戻しに失敗');
  }
}
