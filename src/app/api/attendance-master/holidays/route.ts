import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantId,
  validateRequiredFields,
} from '@/lib/api/api-helpers';

/**
 * GET /api/attendance-master/holidays - 休日カレンダー取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const fiscalYear = searchParams.get('fiscalYear');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: {
      tenantId: string;
      fiscalYear?: number;
      type?: string;
      date?: { gte?: Date; lte?: Date };
    } = { tenantId };

    if (fiscalYear) where.fiscalYear = parseInt(fiscalYear, 10);
    if (type) where.type = type;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const holidays = await prisma.company_holidays.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return successResponse({ holidays }, { count: holidays.length });
  } catch (error) {
    return handleApiError(error, '休日カレンダーの取得');
  }
}

/**
 * POST /api/attendance-master/holidays - 休日登録
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    const validation = validateRequiredFields(body, ['date', 'name', 'type', 'fiscalYear']);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    const date = new Date(body.date);

    // 同一日付のチェック
    const existing = await prisma.company_holidays.findFirst({
      where: { tenantId, date },
    });
    if (existing) {
      return errorResponse('この日付は既に登録されています', 409);
    }

    const holiday = await prisma.company_holidays.create({
      data: {
        id: `ch-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        date,
        name: body.name,
        type: body.type,
        isHalfDay: body.isHalfDay ?? false,
        description: body.description || null,
        fiscalYear: body.fiscalYear,
        isRecurring: body.isRecurring ?? false,
        updatedAt: new Date(),
      },
    });

    return successResponse({ holiday }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '休日の登録');
  }
}

/**
 * POST /api/attendance-master/holidays/bulk - 休日一括登録（祝日インポート）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    if (!Array.isArray(body.holidays)) {
      return errorResponse('holidaysは配列で指定してください', 400);
    }

    const created: unknown[] = [];
    const skipped: string[] = [];

    for (const h of body.holidays) {
      const date = new Date(h.date);

      const existing = await prisma.company_holidays.findFirst({
        where: { tenantId, date },
      });

      if (existing) {
        skipped.push(h.date);
        continue;
      }

      const holiday = await prisma.company_holidays.create({
        data: {
          id: `ch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tenantId,
          date,
          name: h.name,
          type: h.type || 'national_holiday',
          isHalfDay: h.isHalfDay ?? false,
          description: h.description || null,
          fiscalYear: h.fiscalYear || date.getFullYear(),
          isRecurring: h.isRecurring ?? false,
          updatedAt: new Date(),
        },
      });
      created.push(holiday);
    }

    return successResponse({
      created: created.length,
      skipped: skipped.length,
      skippedDates: skipped,
    });
  } catch (error) {
    return handleApiError(error, '休日の一括登録');
  }
}

/**
 * PATCH /api/attendance-master/holidays - 休日更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.company_holidays.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('休日が見つかりません', 404);
    }

    const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.date) updateData.date = new Date(body.date);

    const holiday = await prisma.company_holidays.update({
      where: { id },
      data: updateData,
    });

    return successResponse({ holiday });
  } catch (error) {
    return handleApiError(error, '休日の更新');
  }
}

/**
 * DELETE /api/attendance-master/holidays - 休日削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.company_holidays.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('休日が見つかりません', 404);
    }

    await prisma.company_holidays.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '休日の削除');
  }
}
