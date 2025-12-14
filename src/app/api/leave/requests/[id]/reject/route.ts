import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/leave/requests/[id]/reject - 休暇申請却下
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const { approverId, approverName, reason } = body;

    // バリデーション
    if (!approverId || !approverName || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['approverId', 'approverName', 'reason'],
        },
        { status: 400 }
      );
    }

    // 休暇申請取得
    const leaveRequest = await prisma.leave_requests.findUnique({
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

    // 却下状態を更新
    const updatedRequest = await prisma.leave_requests.update({
      where: { id },
      data: {
        status: 'rejected',
        approver: approverId,
        approverName: approverName,
        rejectedReason: reason,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: 'Leave request rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting leave request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reject leave request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
