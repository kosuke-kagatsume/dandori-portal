import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/workflows/[id]/approve - ワークフロー承認
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const { approverId, approverName, comments } = body;

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

    // ワークフロー取得
    const workflow = await prisma.workflow_requests.findUnique({
      where: { id },
      include: {
        approval_steps: {
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
    const currentStep = workflow.approval_steps[workflow.currentStep];

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
          error: 'Not authorized to approve this step',
        },
        { status: 403 }
      );
    }

    // 承認ステップを更新
    await prisma.approval_steps.update({
      where: { id: currentStep.id },
      data: {
        status: 'approved',
        actionDate: new Date(),
        comments,
      },
    });

    // 次のステップがあるか確認
    const nextStepIndex = workflow.currentStep + 1;
    const hasNextStep = nextStepIndex < workflow.approval_steps.length;

    // ワークフロー状態を更新
    const newStatus = hasNextStep ? 'in_progress' : 'approved';
    const completedAt = hasNextStep ? null : new Date();

    const updatedWorkflow = await prisma.workflow_requests.update({
      where: { id },
      data: {
        status: newStatus,
        currentStep: hasNextStep ? nextStepIndex : workflow.currentStep,
        completedAt,
        timeline_entries: {
          create: {
            action: hasNextStep ? 'approved' : 'completed',
            actorId: approverId,
            actorName: approverName,
            details: comments || `承認されました（ステップ ${workflow.currentStep + 1}）`,
          },
        },
      },
      include: {
        approval_steps: {
          orderBy: {
            order: 'asc',
          },
        },
        timeline_entries: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedWorkflow,
      message: hasNextStep
        ? 'Approval successful, moved to next step'
        : 'Workflow completed successfully',
    });
  } catch (error) {
    console.error('Error approving workflow:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to approve workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
