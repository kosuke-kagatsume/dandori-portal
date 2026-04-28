import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api/api-helpers';
import { requireUserAccess } from '@/lib/auth/user-access';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[id]/resident-tax-monthly - 住民税月額を取得
 * ?fiscalYear=2026 で年度指定、省略時は最新年度
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  const access = await requireUserAccess(request, userId, 'hr_only');
  if (access.errorResponse) return access.errorResponse;

  try {
    const tenantId = access.targetUser.tenantId;
    const { searchParams } = new URL(request.url);
    const fiscalYearParam = searchParams.get('fiscalYear');

    let record;
    if (fiscalYearParam) {
      record = await prisma.employee_resident_tax_monthly.findUnique({
        where: { tenantId_userId_fiscalYear: { tenantId, userId, fiscalYear: parseInt(fiscalYearParam) } },
      });
    } else {
      record = await prisma.employee_resident_tax_monthly.findFirst({
        where: { tenantId, userId },
        orderBy: { fiscalYear: 'desc' },
      });
    }

    return successResponse(record);
  } catch (error) {
    return handleApiError(error, '住民税月額の取得');
  }
}

/**
 * POST /api/users/[id]/resident-tax-monthly - 住民税月額を新規作成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  const access = await requireUserAccess(request, userId, 'hr_only');
  if (access.errorResponse) return access.errorResponse;

  try {
    const tenantId = access.targetUser.tenantId;
    const body = await request.json();

    const record = await prisma.employee_resident_tax_monthly.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        userId,
        fiscalYear: body.fiscalYear,
        month6: body.month6 ?? 0,
        month7: body.month7 ?? 0,
        month8: body.month8 ?? 0,
        month9: body.month9 ?? 0,
        month10: body.month10 ?? 0,
        month11: body.month11 ?? 0,
        month12: body.month12 ?? 0,
        month1: body.month1 ?? 0,
        month2: body.month2 ?? 0,
        month3: body.month3 ?? 0,
        month4: body.month4 ?? 0,
        month5: body.month5 ?? 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    return handleApiError(error, '住民税月額の作成');
  }
}

/**
 * PATCH /api/users/[id]/resident-tax-monthly - 住民税月額を更新（年度指定）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  const access = await requireUserAccess(request, userId, 'hr_only');
  if (access.errorResponse) return access.errorResponse;

  try {
    const tenantId = access.targetUser.tenantId;
    const body = await request.json();
    const fiscalYear = body.fiscalYear;

    // 指定年度のレコードを検索
    const existing = await prisma.employee_resident_tax_monthly.findUnique({
      where: { tenantId_userId_fiscalYear: { tenantId, userId, fiscalYear } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '住民税月額データが見つかりません' },
        { status: 404 }
      );
    }

    const { fiscalYear: _fy, ...updateData } = body;
    const record = await prisma.employee_resident_tax_monthly.update({
      where: { id: existing.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return successResponse(record);
  } catch (error) {
    return handleApiError(error, '住民税月額の更新');
  }
}
