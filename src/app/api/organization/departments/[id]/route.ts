import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
  errorResponse,
} from '@/lib/api/api-helpers';

// GET /api/organization/departments/[id] - 部門詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);

    const department = await prisma.departments.findFirst({
      where: { id, tenantId },
    });

    if (!department) {
      return errorResponse('部門が見つかりません', 404);
    }

    // 部門に所属するメンバーを取得
    const members = await prisma.users.findMany({
      where: {
        tenantId,
        department: department.name,
      },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        role: true,
        status: true,
        avatar: true,
        hireDate: true,
      },
    });

    return successResponse({
      ...department,
      members,
    });
  } catch (error) {
    return handleApiError(error, '部門詳細の取得');
  }
}

// PATCH /api/organization/departments/[id] - 部門更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    // 存在確認
    const existing = await prisma.departments.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return errorResponse('部門が見つかりません', 404);
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.parentId !== undefined) updateData.parentId = body.parentId;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    updateData.updatedAt = new Date();

    const department = await prisma.departments.update({
      where: { id },
      data: updateData,
    });

    return successResponse(department);
  } catch (error) {
    return handleApiError(error, '部門の更新');
  }
}

// DELETE /api/organization/departments/[id] - 部門削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);

    // 存在確認
    const existing = await prisma.departments.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return errorResponse('部門が見つかりません', 404);
    }

    // 子部門があるか確認
    const childDepartments = await prisma.departments.findMany({
      where: { tenantId, parentId: id },
    });

    if (childDepartments.length > 0) {
      return errorResponse('子部門が存在するため削除できません', 400);
    }

    await prisma.departments.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '部門を削除しました',
    });
  } catch (error) {
    return handleApiError(error, '部門の削除');
  }
}
