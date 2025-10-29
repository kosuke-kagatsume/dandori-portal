import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/workflows/[id] - ワークフロー詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const workflow = await prisma.workflowRequest.findUnique({
      where: { id },
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

    if (!workflow) {
      return NextResponse.json(
        {
          success: false,
          error: 'Workflow not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/workflows/[id] - ワークフロー更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      title,
      description,
      amount,
      days,
      hours,
      details,
      priority,
      dueDate,
      status,
    } = body;

    // 既存のワークフローを確認
    const existingWorkflow = await prisma.workflowRequest.findUnique({
      where: { id },
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        {
          success: false,
          error: 'Workflow not found',
        },
        { status: 404 }
      );
    }

    // 更新
    const workflow = await prisma.workflowRequest.update({
      where: { id },
      data: {
        title,
        description,
        amount,
        days,
        hours,
        details,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
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
      data: workflow,
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/[id] - ワークフロー削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existingWorkflow = await prisma.workflowRequest.findUnique({
      where: { id },
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        {
          success: false,
          error: 'Workflow not found',
        },
        { status: 404 }
      );
    }

    // 削除（カスケードでapprovalStepsとtimelineEntriesも削除される）
    await prisma.workflowRequest.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
