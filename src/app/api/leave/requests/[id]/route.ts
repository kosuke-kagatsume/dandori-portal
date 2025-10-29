import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/leave/requests/[id] - 休暇申請詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      return NextResponse.json(
        {
          success: false,
          error: 'Leave request not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: leaveRequest,
    });
  } catch (error) {
    console.error('Error fetching leave request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leave request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/leave/requests/[id] - 休暇申請更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      type,
      startDate,
      endDate,
      days,
      reason,
      status,
    } = body;

    // 既存の申請を確認
    const existingRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: 'Leave request not found',
        },
        { status: 404 }
      );
    }

    // 更新
    const leaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        type,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        days,
        reason,
        status,
      },
    });

    return NextResponse.json({
      success: true,
      data: leaveRequest,
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update leave request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/leave/requests/[id] - 休暇申請削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existingRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: 'Leave request not found',
        },
        { status: 404 }
      );
    }

    await prisma.leaveRequest.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Leave request deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete leave request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
