import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/leave/requests/[id]/approve - 休暇申請承認
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const { approverId, approverName } = body;

    // バリデーション
    if (!approverId || !approverName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['approverId', 'approverName'],
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

    // 承認状態を更新
    const updatedRequest = await prisma.leave_requests.update({
      where: { id },
      data: {
        status: 'approved',
        approver: approverId,
        approverName: approverName,
        approvedDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: 'Leave request approved successfully',
    });
  } catch (error) {
    console.error('Error approving leave request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to approve leave request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
