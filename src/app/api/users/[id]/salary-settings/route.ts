import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, handleApiError, getTenantIdFromRequest } from '@/lib/api/api-helpers';
import crypto from 'crypto';

/**
 * GET /api/users/[id]/salary-settings - 有効な給与設定を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { id: userId } = await params;

    const setting = await prisma.employee_salary_settings.findFirst({
      where: { tenantId, userId, isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });

    return successResponse(setting);
  } catch (error) {
    return handleApiError(error, '給与設定の取得');
  }
}

/**
 * PATCH /api/users/[id]/salary-settings - 給与設定の更新（なければ新規作成）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { id: userId } = await params;
    const body = await request.json();

    // 既存の有効な給与設定を検索
    const existing = await prisma.employee_salary_settings.findFirst({
      where: { tenantId, userId, isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });

    let setting;

    if (existing) {
      // 既存レコードを更新
      setting = await prisma.employee_salary_settings.update({
        where: { id: existing.id },
        data: {
          ...body,
          updatedAt: new Date(),
        },
      });
    } else {
      // 新規作成
      setting = await prisma.employee_salary_settings.create({
        data: {
          id: crypto.randomUUID(),
          tenantId,
          userId,
          effectiveFrom: new Date(),
          ...body,
          updatedAt: new Date(),
        },
      });
    }

    return successResponse(setting);
  } catch (error) {
    return handleApiError(error, '給与設定の更新');
  }
}
