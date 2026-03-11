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
 * GET /api/settings/payroll/closing-day-groups - 締め日グループ一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: { tenantId: string; isActive?: boolean } = { tenantId };
    if (activeOnly) where.isActive = true;

    const items = await prisma.closing_day_groups.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return successResponse({ items }, { count: items.length });
  } catch (error) {
    return handleApiError(error, '締め日グループ一覧の取得');
  }
}

/**
 * POST /api/settings/payroll/closing-day-groups - 締め日グループ作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    const validation = validateRequiredFields(body, ['name', 'closingDay', 'paymentDay']);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    // 名前重複チェック
    const existing = await prisma.closing_day_groups.findFirst({
      where: { tenantId, name: body.name },
    });
    if (existing) {
      return errorResponse('このグループ名は既に使用されています', 409);
    }

    const item = await prisma.closing_day_groups.create({
      data: {
        id: `cdg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        name: body.name,
        closingDay: body.closingDay,
        paymentMonth: body.paymentMonth || 'same',
        paymentDay: body.paymentDay,
        isDefault: body.isDefault ?? false,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return successResponse({ item }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '締め日グループの作成');
  }
}
