import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// 予約詳細取得
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const tenantId = await getTenantIdFromRequest(request);

    const change = await prisma.scheduled_changes.findFirst({
      where: { id, tenantId },
    });

    if (!change) {
      return NextResponse.json(
        { success: false, error: '予約が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatChange(change),
    });
  } catch (error) {
    console.error('Failed to fetch scheduled change:', error);
    return NextResponse.json(
      { success: false, error: '予約の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 予約更新
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    // 既存の予約を取得
    const existing = await prisma.scheduled_changes.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '予約が見つかりません' },
        { status: 404 }
      );
    }

    // 適用済みの予約は更新不可
    if (existing.status === 'applied') {
      return NextResponse.json(
        { success: false, error: '適用済みの予約は更新できません' },
        { status: 400 }
      );
    }

    const {
      userId,
      userName,
      effectiveDate,
      details,
      requiresApproval,
    } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (userId !== undefined) updateData.userId = userId;
    if (userName !== undefined) updateData.userName = userName;
    if (effectiveDate) updateData.effectiveDate = new Date(effectiveDate);
    if (requiresApproval !== undefined) {
      updateData.requiresApproval = requiresApproval;
      // 承認要否が変更された場合、承認ステータスも更新
      if (requiresApproval && existing.approvalStatus === 'not_required') {
        updateData.approvalStatus = 'pending_approval';
      } else if (!requiresApproval) {
        updateData.approvalStatus = 'not_required';
      }
    }

    // 詳細情報の更新
    if (details) {
      if (existing.type === 'hire') {
        if (details.name !== undefined) updateData.hireName = details.name;
        if (details.email !== undefined) updateData.hireEmail = details.email;
        if (details.department !== undefined) updateData.hireDepartment = details.department;
        if (details.position !== undefined) updateData.hirePosition = details.position;
        if (details.role !== undefined) updateData.hireRole = details.role;
        if (details.employeeNumber !== undefined) updateData.hireEmployeeNumber = details.employeeNumber;
      } else if (existing.type === 'transfer') {
        if (details.currentDepartment !== undefined) updateData.currentDepartment = details.currentDepartment;
        if (details.newDepartment !== undefined) updateData.newDepartment = details.newDepartment;
        if (details.currentPosition !== undefined) updateData.currentPosition = details.currentPosition;
        if (details.newPosition !== undefined) updateData.newPosition = details.newPosition;
        if (details.reason !== undefined) updateData.transferReason = details.reason;
      } else if (existing.type === 'retirement') {
        if (details.retirementReason !== undefined) updateData.retirementReason = details.retirementReason;
        if (details.notes !== undefined) updateData.retirementNotes = details.notes;
      }
    }

    const change = await prisma.scheduled_changes.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: formatChange(change),
    });
  } catch (error) {
    console.error('Failed to update scheduled change:', error);
    return NextResponse.json(
      { success: false, error: '予約の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 予約削除
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const tenantId = await getTenantIdFromRequest(request);

    // 既存の予約を取得
    const existing = await prisma.scheduled_changes.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '予約が見つかりません' },
        { status: 404 }
      );
    }

    // 適用済みの予約は削除不可
    if (existing.status === 'applied') {
      return NextResponse.json(
        { success: false, error: '適用済みの予約は削除できません' },
        { status: 400 }
      );
    }

    await prisma.scheduled_changes.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '予約を削除しました',
    });
  } catch (error) {
    console.error('Failed to delete scheduled change:', error);
    return NextResponse.json(
      { success: false, error: '予約の削除に失敗しました' },
      { status: 500 }
    );
  }
}

// レスポンス形式にフォーマット
function formatChange(change: {
  id: string;
  type: string;
  userId: string | null;
  userName: string | null;
  effectiveDate: Date;
  status: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  hireName: string | null;
  hireEmail: string | null;
  hireDepartment: string | null;
  hirePosition: string | null;
  hireRole: string | null;
  hireEmployeeNumber: string | null;
  currentDepartment: string | null;
  newDepartment: string | null;
  currentPosition: string | null;
  newPosition: string | null;
  transferReason: string | null;
  retirementReason: string | null;
  retirementNotes: string | null;
  requiresApproval: boolean;
  approvalStatus: string | null;
  workflowId: string | null;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
}) {
  let details = {};

  switch (change.type) {
    case 'hire':
      details = {
        name: change.hireName,
        email: change.hireEmail,
        department: change.hireDepartment,
        position: change.hirePosition,
        role: change.hireRole,
        employeeNumber: change.hireEmployeeNumber,
      };
      break;
    case 'transfer':
      details = {
        currentDepartment: change.currentDepartment,
        newDepartment: change.newDepartment,
        currentPosition: change.currentPosition,
        newPosition: change.newPosition,
        reason: change.transferReason,
      };
      break;
    case 'retirement':
      details = {
        retirementReason: change.retirementReason,
        notes: change.retirementNotes,
      };
      break;
  }

  return {
    id: change.id,
    type: change.type,
    userId: change.userId,
    userName: change.userName,
    effectiveDate: change.effectiveDate.toISOString().split('T')[0],
    status: change.status,
    createdBy: change.createdBy,
    createdByName: change.createdByName,
    createdAt: change.createdAt.toISOString(),
    updatedAt: change.updatedAt.toISOString(),
    details,
    requiresApproval: change.requiresApproval,
    approvalStatus: change.approvalStatus,
    workflowId: change.workflowId,
    approvedBy: change.approvedBy,
    approvedByName: change.approvedByName,
    approvedAt: change.approvedAt?.toISOString(),
    rejectionReason: change.rejectionReason,
  };
}
