import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, handleApiError, getTenantIdFromRequest } from '@/lib/api/api-helpers';
import crypto from 'crypto';

/**
 * GET /api/users/[id]/dependents - 扶養情報を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { id: userId } = await params;

    const dependent = await prisma.employee_dependents.findUnique({
      where: {
        tenantId_userId: { tenantId, userId },
      },
    });

    return successResponse(dependent);
  } catch (error) {
    return handleApiError(error, '扶養情報の取得');
  }
}

/**
 * POST /api/users/[id]/dependents - 扶養情報を新規作成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { id: userId } = await params;
    const body = await request.json();

    const dependent = await prisma.employee_dependents.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        userId,
        hasSpouse: body.hasSpouse ?? false,
        spouseIsDependent: body.spouseIsDependent ?? false,
        generalDependents: body.generalDependents ?? 0,
        specificDependents: body.specificDependents ?? 0,
        elderlyDependents: body.elderlyDependents ?? 0,
        under16Dependents: body.under16Dependents ?? 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: dependent }, { status: 201 });
  } catch (error) {
    return handleApiError(error, '扶養情報の作成');
  }
}

/**
 * PATCH /api/users/[id]/dependents - 扶養情報を更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { id: userId } = await params;
    const body = await request.json();

    const dependent = await prisma.employee_dependents.update({
      where: {
        tenantId_userId: { tenantId, userId },
      },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return successResponse(dependent);
  } catch (error) {
    return handleApiError(error, '扶養情報の更新');
  }
}
