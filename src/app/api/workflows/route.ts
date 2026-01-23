import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET /api/workflows - ワークフロー一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const requesterId = searchParams.get('requesterId');
    const approverId = searchParams.get('approverId');
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (requesterId) {
      where.requesterId = requesterId;
    }

    // 承認者でフィルター（ApprovalStepとのリレーション経由）
    if (approverId) {
      where.approval_steps = {
        some: {
          approverId: approverId,
          status: 'pending',
        },
      };
    }

    // 総件数取得
    const total = await prisma.workflow_requests.count({ where });

    // ワークフロー一覧取得（select最適化）
    const workflows = await prisma.workflow_requests.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        requesterId: true,
        requesterName: true,
        department: true,
        type: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        currentStep: true,
        amount: true,
        days: true,
        hours: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        approval_steps: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            order: true,
            approverRole: true,
            approverId: true,
            approverName: true,
            status: true,
            executionMode: true,
            comments: true,
            actionDate: true,
          },
        },
        timeline_entries: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            action: true,
            actorId: true,
            actorName: true,
            details: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return successResponse(workflows, {
      count: workflows.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 30, // 30秒キャッシュ（ワークフローは動的）
    });
  } catch (error) {
    return handleApiError(error, 'ワークフロー一覧の取得');
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
      approval_steps,
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
    const workflow = await prisma.workflow_requests.create({
      data: {
        id: crypto.randomUUID(),
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
        updatedAt: new Date(),
        approval_steps: {
          create: approval_steps?.map((step: { approverRole: string; approverId: string; approverName: string; executionMode?: string; timeoutHours?: number }, index: number) => ({
            id: crypto.randomUUID(),
            tenantId,
            order: index,
            approverRole: step.approverRole,
            approverId: step.approverId,
            approverName: step.approverName,
            status: 'pending',
            executionMode: step.executionMode || 'sequential',
            timeoutHours: step.timeoutHours,
            updatedAt: new Date(),
          })) || [],
        },
        timeline_entries: {
          create: {
            id: crypto.randomUUID(),
            tenantId,
            action: 'created',
            actorId: requesterId,
            actorName: requesterName,
            details: '申請書を作成しました',
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
