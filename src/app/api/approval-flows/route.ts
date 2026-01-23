/* eslint-disable @typescript-eslint/no-explicit-any */
// Prismaのクエリ結果の型が複雑なため、anyを許容
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET /api/approval-flows - 承認フロー一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const documentType = searchParams.get('documentType');
    const isActive = searchParams.get('isActive');
    const includeDetails = searchParams.get('include') === 'details';
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };

    if (documentType) {
      where.documentType = documentType;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // 総件数取得
    const total = await prisma.approval_flow_definitions.count({ where });

    // 承認フロー一覧取得（条件付きで詳細データ取得）
    const flows = await prisma.approval_flow_definitions.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        name: true,
        description: true,
        documentType: true,
        flowType: true,
        useOrganizationHierarchy: true,
        organizationLevels: true,
        isActive: true,
        isDefault: true,
        priority: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        // 詳細リクエスト時のみ関連データを含める
        ...(includeDetails && {
          approval_flow_steps: {
            orderBy: { stepNumber: 'asc' as const },
            select: {
              id: true,
              stepNumber: true,
              name: true,
              executionMode: true,
              requiredApprovals: true,
              timeoutHours: true,
              allowDelegate: true,
              allowSkip: true,
              approval_flow_approvers: {
                orderBy: { order: 'asc' as const },
                select: {
                  id: true,
                  approverType: true,
                  approverId: true,
                  approverRole: true,
                  positionLevel: true,
                  order: true,
                },
              },
            },
          },
          approval_flow_conditions: {
            select: {
              id: true,
              field: true,
              operator: true,
              value: true,
              description: true,
            },
          },
        }),
        // 一覧用：カウントのみ
        ...(!includeDetails && {
          _count: {
            select: {
              approval_flow_steps: true,
              approval_flow_conditions: true,
            },
          },
        }),
      },
      orderBy: [
        { documentType: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    });

    // フロントエンドの型に変換
    const formattedFlows = flows.map((flow: any) => {
      const baseData = {
        id: flow.id,
        name: flow.name,
        description: flow.description,
        type: flow.flowType as 'organization' | 'custom',
        documentType: flow.documentType as 'leave_request' | 'overtime_request' | 'expense_claim' | 'business_trip' | 'purchase_request',
        useOrganizationHierarchy: flow.useOrganizationHierarchy,
        organizationLevels: flow.organizationLevels,
        isActive: flow.isActive,
        isDefault: flow.isDefault,
        priority: flow.priority,
        createdBy: flow.createdBy,
        createdAt: flow.createdAt.toISOString(),
        updatedAt: flow.updatedAt.toISOString(),
        companyId: flow.tenantId,
      };

      // 詳細データがある場合のみマッピング
      if (includeDetails && flow.approval_flow_steps) {
        return {
          ...baseData,
          steps: flow.approval_flow_steps.map((step: any) => ({
            id: step.id,
            stepNumber: step.stepNumber,
            name: step.name,
            mode: step.executionMode as 'serial' | 'parallel',
            approvers: step.approval_flow_approvers.map((approver: any) => ({
              id: approver.id,
              type: approver.approverType,
              userId: approver.approverId,
              role: approver.approverRole,
              positionLevel: approver.positionLevel,
              order: approver.order,
            })),
            requiredApprovals: step.requiredApprovals,
            timeoutHours: step.timeoutHours,
            allowDelegate: step.allowDelegate,
            allowSkip: step.allowSkip,
          })),
          conditions: flow.approval_flow_conditions?.map((condition: any) => ({
            id: condition.id,
            field: condition.field,
            operator: condition.operator as 'gte' | 'lte' | 'gt' | 'lt' | 'eq' | 'ne',
            value: condition.value,
            description: condition.description,
          })) || [],
        };
      }

      // 一覧用：カウントのみ
      return {
        ...baseData,
        stepCount: flow._count?.approval_flow_steps || 0,
        conditionCount: flow._count?.approval_flow_conditions || 0,
      };
    });

    return successResponse(formattedFlows, {
      count: formattedFlows.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 300, // 5分キャッシュ
    });
  } catch (error) {
    return handleApiError(error, '承認フロー一覧の取得');
  }
}

// POST /api/approval-flows - 承認フロー作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tenantId = 'tenant-1',
      name,
      description,
      documentType,
      type, // 'organization' or 'custom'
      useOrganizationHierarchy,
      organizationLevels,
      steps,
      conditions,
      isActive = true,
      isDefault = false,
      priority = 1,
      createdBy = 'system',
    } = body;

    // バリデーション
    if (!name || !documentType || !type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['name', 'documentType', 'type'],
        },
        { status: 400 }
      );
    }

    // デフォルトフローの一意性チェック
    if (isDefault) {
      const existingDefault = await prisma.approval_flow_definitions.findFirst({
        where: {
          tenantId,
          documentType,
          isDefault: true,
        },
      });

      if (existingDefault) {
        // 既存のデフォルトを解除
        await prisma.approval_flow_definitions.update({
          where: { id: existingDefault.id },
          data: { isDefault: false },
        });
      }
    }

    // フロー作成（ステップと条件も同時作成）
    const flow = await prisma.approval_flow_definitions.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        name,
        description,
        documentType,
        flowType: type,
        useOrganizationHierarchy: useOrganizationHierarchy || type === 'organization',
        organizationLevels: organizationLevels || null,
        isActive,
        isDefault,
        priority,
        createdBy,
        updatedAt: new Date(),
        approval_flow_steps: {
          create: steps?.map((step: any) => ({
            id: crypto.randomUUID(),
            stepNumber: step.stepNumber,
            name: step.name,
            executionMode: step.mode || 'serial',
            requiredApprovals: step.requiredApprovals || 1,
            timeoutHours: step.timeoutHours || null,
            allowDelegate: step.allowDelegate ?? true,
            allowSkip: step.allowSkip ?? false,
            updatedAt: new Date(),
            approval_flow_approvers: {
              create: step.approvers?.map((approver: any, index: number) => ({
                id: crypto.randomUUID(),
                approverType: approver.type || 'role',
                approverId: approver.userId || null,
                approverRole: approver.role || null,
                positionLevel: approver.positionLevel || null,
                order: approver.order || index + 1,
                updatedAt: new Date(),
              })) || [],
            },
          })) || [],
        },
        approval_flow_conditions: {
          create: conditions?.map((condition: any) => ({
            id: crypto.randomUUID(),
            field: condition.field,
            operator: condition.operator,
            value: condition.value,
            description: condition.description || null,
            updatedAt: new Date(),
          })) || [],
        },
      },
      include: {
        approval_flow_steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            approval_flow_approvers: {
              orderBy: { order: 'asc' },
            },
          },
        },
        approval_flow_conditions: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: flow.id,
          name: flow.name,
          documentType: flow.documentType,
          type: flow.flowType,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating approval flow:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create approval flow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
