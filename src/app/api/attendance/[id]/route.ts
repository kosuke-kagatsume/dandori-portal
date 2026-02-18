import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
  errorResponse,
} from '@/lib/api/api-helpers';

// GET /api/attendance/[id] - 勤怠詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);

    const attendance = await prisma.attendance.findFirst({
      where: { id, tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
          },
        },
      },
    });

    if (!attendance) {
      return errorResponse('勤怠記録が見つかりません', 404);
    }

    return successResponse(attendance);
  } catch (error) {
    return handleApiError(error, '勤怠記録の取得');
  }
}

// PUT /api/attendance/[id] - 勤怠更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    // 存在確認
    const existing = await prisma.attendance.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return errorResponse('勤怠記録が見つかりません', 404);
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        ...(body.checkIn !== undefined && { checkIn: body.checkIn ? new Date(body.checkIn) : null }),
        ...(body.checkOut !== undefined && { checkOut: body.checkOut ? new Date(body.checkOut) : null }),
        ...(body.breakStart !== undefined && { breakStart: body.breakStart ? new Date(body.breakStart) : null }),
        ...(body.breakEnd !== undefined && { breakEnd: body.breakEnd ? new Date(body.breakEnd) : null }),
        ...(body.totalBreakMinutes !== undefined && { totalBreakMinutes: body.totalBreakMinutes }),
        ...(body.workMinutes !== undefined && { workMinutes: body.workMinutes }),
        ...(body.overtimeMinutes !== undefined && { overtimeMinutes: body.overtimeMinutes }),
        ...(body.workLocation !== undefined && { workLocation: body.workLocation }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.memo !== undefined && { memo: body.memo }),
        ...(body.approvalStatus !== undefined && { approvalStatus: body.approvalStatus }),
        ...(body.approvalReason !== undefined && { approvalReason: body.approvalReason }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
          },
        },
      },
    });

    return successResponse(attendance);
  } catch (error) {
    return handleApiError(error, '勤怠記録の更新');
  }
}

// PATCH /api/attendance/[id] - 勤怠部分更新（休憩開始・終了等）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    // 存在確認
    const existing = await prisma.attendance.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return errorResponse('勤怠記録が見つかりません', 404);
    }

    // PATCHは渡されたフィールドのみ更新
    const updateData: Record<string, unknown> = {};

    if (body.checkIn !== undefined) {
      updateData.checkIn = body.checkIn ? new Date(body.checkIn) : null;
    }
    if (body.checkOut !== undefined) {
      updateData.checkOut = body.checkOut ? new Date(body.checkOut) : null;
    }
    if (body.breakStart !== undefined) {
      updateData.breakStart = body.breakStart ? new Date(body.breakStart) : null;
    }
    if (body.breakEnd !== undefined) {
      updateData.breakEnd = body.breakEnd ? new Date(body.breakEnd) : null;
    }
    if (body.totalBreakMinutes !== undefined) {
      updateData.totalBreakMinutes = body.totalBreakMinutes;
    }
    if (body.workMinutes !== undefined) {
      updateData.workMinutes = body.workMinutes;
    }
    if (body.overtimeMinutes !== undefined) {
      updateData.overtimeMinutes = body.overtimeMinutes;
    }
    if (body.workLocation !== undefined) {
      updateData.workLocation = body.workLocation;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.memo !== undefined) {
      updateData.memo = body.memo;
    }
    if (body.approvalStatus !== undefined) {
      updateData.approvalStatus = body.approvalStatus;
    }
    if (body.approvalReason !== undefined) {
      updateData.approvalReason = body.approvalReason;
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
          },
        },
      },
    });

    return successResponse(attendance);
  } catch (error) {
    return handleApiError(error, '勤怠記録の部分更新');
  }
}

// DELETE /api/attendance/[id] - 勤怠削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);

    // 存在確認
    const existing = await prisma.attendance.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return errorResponse('勤怠記録が見つかりません', 404);
    }

    await prisma.attendance.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: '勤怠記録を削除しました' });
  } catch (error) {
    return handleApiError(error, '勤怠記録の削除');
  }
}
