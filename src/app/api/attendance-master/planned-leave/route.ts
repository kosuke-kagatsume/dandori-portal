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
 * GET /api/attendance-master/planned-leave - 計画的付与日一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const fiscalYear = searchParams.get('fiscalYear');

    const where: { tenantId: string; fiscalYear?: number } = { tenantId };
    if (fiscalYear) where.fiscalYear = parseInt(fiscalYear, 10);

    const dates = await prisma.planned_leave_dates.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return successResponse({ dates }, { count: dates.length });
  } catch (error) {
    return handleApiError(error, '計画的付与日の取得');
  }
}

/**
 * POST /api/attendance-master/planned-leave - 計画的付与日登録
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    const validation = validateRequiredFields(body, ['date', 'name', 'fiscalYear']);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    const { date, name, fiscalYear } = body;

    // 重複チェック
    const existing = await prisma.planned_leave_dates.findUnique({
      where: { tenantId_date: { tenantId, date: new Date(date) } },
    });
    if (existing) {
      return errorResponse('この日付は既に登録されています', 409);
    }

    const created = await prisma.planned_leave_dates.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        date: new Date(date),
        name: name.trim(),
        fiscalYear: parseInt(fiscalYear, 10),
      },
    });

    return successResponse({ date: created });
  } catch (error) {
    return handleApiError(error, '計画的付与日の登録');
  }
}

/**
 * DELETE /api/attendance-master/planned-leave - 計画的付与日削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが指定されていません', 400);
    }

    // テナント確認
    const existing = await prisma.planned_leave_dates.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('計画的付与日が見つかりません', 404);
    }

    await prisma.planned_leave_dates.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '計画的付与日の削除');
  }
}
