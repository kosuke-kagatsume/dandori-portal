import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/workflows/[id]/reject - ワークフロー却下
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

    // ワークフロー取得
    const workflow = await prisma.workflowRequest.findUnique({
      where: { id },
      include: {
        approvalSteps: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        {
          success: false,
          error: 'Workflow not found',
        },
        { status: 404 }
      );
    }

    // 現在のステップを取得
    const currentStep = workflow.approvalSteps[workflow.currentStep];

    if (!currentStep) {
      return NextResponse.json(
        {
          success: false,
          error: 'No pending approval step',
        },
        { status: 400 }
      );
    }

    // 承認者が正しいか確認
    if (currentStep.approverId !== approverId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authorized to reject this step',
        },
        { status: 403 }
      );
    }

    // 承認ステップを更新
    await prisma.approvalStep.update({
      where: { id: currentStep.id },
      data: {
        status: 'rejected',
        actionDate: new Date(),
        comments: reason,
      },
    });

    // ワークフロー状態を更新
    const updatedWorkflow = await prisma.workflowRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        completedAt: new Date(),
        timelineEntries: {
          create: {
            action: 'rejected',
            actorId: approverId,
            actorName: approverName,
            details: reason,
          },
        },
      },
      include: {
        approvalSteps: {
          orderBy: {
            order: 'asc',
          },
        },
        timelineEntries: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedWorkflow,
      message: 'Workflow rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting workflow:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reject workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
