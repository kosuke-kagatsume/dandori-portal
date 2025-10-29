import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/workflows - ワークフロー一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const requesterId = searchParams.get('requesterId');
    const approverId = searchParams.get('approverId');
    const tenantId = searchParams.get('tenantId');

    const where: Record<string, unknown> = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (requesterId) {
      where.requesterId = requesterId;
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    // 承認者でフィルター（ApprovalStepとのリレーション経由）
    if (approverId) {
      where.approvalSteps = {
        some: {
          approverId: approverId,
          status: 'pending',
        },
      };
    }

    const workflows = await prisma.workflowRequest.findMany({
      where,
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
          take: 5, // 最新5件のみ
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: workflows,
      count: workflows.length,
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch workflows',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/workflows - ワークフロー作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tenantId,
      requesterId,
      requesterName,
      department,
      type,
      title,
      description,
      amount,
      days,
      hours,
      details,
      priority = 'medium',
      dueDate,
      approvalSteps,
    } = body;

    // バリデーション
    if (!tenantId || !requesterId || !requesterName || !type || !title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['tenantId', 'requesterId', 'requesterName', 'type', 'title'],
        },
        { status: 400 }
      );
    }

    // ワークフロー作成（承認ステップとタイムラインも同時作成）
    const workflow = await prisma.workflowRequest.create({
      data: {
        tenantId,
        requesterId,
        requesterName,
        department,
        type,
        title,
        description,
        amount,
        days,
        hours,
        details,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'pending',
        currentStep: 0,
        approvalSteps: {
          create: approvalSteps?.map((step: any, index: number) => ({
            order: index,
            approverRole: step.approverRole,
            approverId: step.approverId,
            approverName: step.approverName,
            status: 'pending',
            executionMode: step.executionMode || 'sequential',
            timeoutHours: step.timeoutHours,
          })) || [],
        },
        timelineEntries: {
          create: {
            action: 'created',
            actorId: requesterId,
            actorName: requesterName,
            details: '申請書を作成しました',
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

    return NextResponse.json(
      {
        success: true,
        data: workflow,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
