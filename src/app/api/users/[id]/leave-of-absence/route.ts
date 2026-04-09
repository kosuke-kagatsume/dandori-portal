import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
  validateRequiredFields,
} from '@/lib/api/api-helpers';

/**
 * GET /api/users/[id]/leave-of-absence - 休職履歴一覧
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const tenantId = await getTenantIdFromRequest(request);

    const records = await prisma.leave_of_absence_history.findMany({
      where: { tenantId, userId },
      orderBy: { startDate: 'desc' },
    });

    return successResponse(records, { count: records.length });
  } catch (error) {
    return handleApiError(error, '休職履歴の取得');
  }
}

/**
 * POST /api/users/[id]/leave-of-absence - 休職履歴追加
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    const validation = validateRequiredFields(body, ['startDate', 'leaveType']);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    const record = await prisma.leave_of_absence_history.create({
      data: {
        id: `loa-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        userId,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        leaveType: body.leaveType,
        payCalcMethod: body.payCalcMethod || null,
        notes: body.notes || null,
        updatedAt: new Date(),
      },
    });

    return successResponse(record, { count: 1 });
  } catch (error) {
    return handleApiError(error, '休職履歴の追加');
  }
}

/**
 * PUT /api/users/[id]/leave-of-absence - 休職履歴更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    const { recordId, startDate, endDate, leaveType, payCalcMethod, notes } = body;
    if (!recordId) {
      return errorResponse('recordIdが必要です', 400);
    }

    const existing = await prisma.leave_of_absence_history.findFirst({
      where: { id: recordId, tenantId, userId },
    });
    if (!existing) {
      return errorResponse('休職履歴が見つかりません', 404);
    }

    const record = await prisma.leave_of_absence_history.update({
      where: { id: recordId },
      data: {
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(leaveType && { leaveType }),
        ...(payCalcMethod !== undefined && { payCalcMethod: payCalcMethod || null }),
        ...(notes !== undefined && { notes: notes || null }),
        updatedAt: new Date(),
      },
    });

    return successResponse(record);
  } catch (error) {
    return handleApiError(error, '休職履歴の更新');
  }
}

/**
 * DELETE /api/users/[id]/leave-of-absence - 休職履歴削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const recordId = searchParams.get('recordId');

    if (!recordId) {
      return errorResponse('recordIdが必要です', 400);
    }

    const existing = await prisma.leave_of_absence_history.findFirst({
      where: { id: recordId, tenantId, userId },
    });
    if (!existing) {
      return errorResponse('休職履歴が見つかりません', 404);
    }

    await prisma.leave_of_absence_history.delete({ where: { id: recordId } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '休職履歴の削除');
  }
}
