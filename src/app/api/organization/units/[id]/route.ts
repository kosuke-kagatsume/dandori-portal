import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
  errorResponse,
} from '@/lib/api/api-helpers';

// GET /api/organization/units/[id] - 組織ユニット詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);

    const unit = await prisma.org_units.findFirst({
      where: { id, tenantId },
    });

    if (!unit) {
      return errorResponse('組織ユニットが見つかりません', 404);
    }

    return successResponse(unit);
  } catch (error) {
    return handleApiError(error, '組織ユニット詳細の取得');
  }
}

// PATCH /api/organization/units/[id] - 組織ユニット更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    // 存在確認
    const existing = await prisma.org_units.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return errorResponse('組織ユニットが見つかりません', 404);
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.parentId !== undefined) updateData.parentId = body.parentId;
    if (body.level !== undefined) updateData.level = body.level;
    if (body.headUserId !== undefined) updateData.headUserId = body.headUserId;

    const unit = await prisma.org_units.update({
      where: { id },
      data: updateData,
    });

    return successResponse(unit);
  } catch (error) {
    return handleApiError(error, '組織ユニットの更新');
  }
}

// DELETE /api/organization/units/[id] - 組織ユニット削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);

    // 存在確認
    const existing = await prisma.org_units.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return errorResponse('組織ユニットが見つかりません', 404);
    }

    // 子ユニットがあるか確認
    const childUnits = await prisma.org_units.findMany({
      where: { tenantId, parentId: id },
    });

    if (childUnits.length > 0) {
      return errorResponse('子ユニットが存在するため削除できません', 400);
    }

    await prisma.org_units.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '組織ユニットを削除しました',
    });
  } catch (error) {
    return handleApiError(error, '組織ユニットの削除');
  }
}
