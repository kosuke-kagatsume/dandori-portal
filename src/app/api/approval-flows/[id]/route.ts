import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/approval-flows/[id] - 承認フロー詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const flow = await prisma.approval_flow_definitions.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            approvers: {
              orderBy: { order: 'asc' },
            },
          },
        },
        conditions: true,
      },
    });

    if (!flow) {
      return NextResponse.json(
        { success: false, error: 'Approval flow not found' },
        { status: 404 }
      );
    }

    // フロントエンドの型に変換
    const formattedFlow = {
      id: flow.id,
      name: flow.name,
      description: flow.description,
      type: flow.flowType as 'organization' | 'custom',
      documentType: flow.documentType,
      useOrganizationHierarchy: flow.useOrganizationHierarchy,
      organizationLevels: flow.organizationLevels,
      steps: flow.steps.map((step) => ({
        id: step.id,
        stepNumber: step.stepNumber,
        name: step.name,
        mode: step.executionMode as 'serial' | 'parallel',
        approvers: step.approvers.map((approver) => ({
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
      conditions: flow.conditions.map((condition) => ({
        id: condition.id,
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        description: condition.description,
      })),
      isActive: flow.isActive,
      isDefault: flow.isDefault,
      priority: flow.priority,
      createdBy: flow.createdBy,
      createdAt: flow.createdAt.toISOString(),
      updatedAt: flow.updatedAt.toISOString(),
      companyId: flow.tenantId,
    };

    return NextResponse.json({
      success: true,
      data: formattedFlow,
    });
  } catch (error) {
    console.error('Error fetching approval flow:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch approval flow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/approval-flows/[id] - 承認フロー更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      description,
      type,
      useOrganizationHierarchy,
      organizationLevels,
      steps,
      conditions,
      isActive,
      isDefault,
      priority,
    } = body;

    // 既存のフローを確認
    const existingFlow = await prisma.approval_flow_definitions.findUnique({
      where: { id },
    });

    if (!existingFlow) {
      return NextResponse.json(
        { success: false, error: 'Approval flow not found' },
        { status: 404 }
      );
    }

    // デフォルトフローの一意性チェック
    if (isDefault && !existingFlow.isDefault) {
      const anotherDefault = await prisma.approval_flow_definitions.findFirst({
        where: {
          tenantId: existingFlow.tenantId,
          documentType: existingFlow.documentType,
          isDefault: true,
          id: { not: id },
        },
      });

      if (anotherDefault) {
        await prisma.approval_flow_definitions.update({
          where: { id: anotherDefault.id },
          data: { isDefault: false },
        });
      }
    }

    // トランザクションで更新
    const flow = await prisma.$transaction(async (tx) => {
      // 既存のステップと条件を削除
      await tx.approvalFlowStep.deleteMany({
        where: { flowId: id },
      });
      await tx.approvalFlowCondition.deleteMany({
        where: { flowId: id },
      });

      // フローを更新し、新しいステップと条件を作成
      return tx.approvalFlowDefinition.update({
        where: { id },
        data: {
          name,
          description,
          flowType: type,
          useOrganizationHierarchy: useOrganizationHierarchy ?? (type === 'organization'),
          organizationLevels: organizationLevels || null,
          isActive: isActive ?? true,
          isDefault: isDefault ?? false,
          priority: priority ?? 1,
          steps: {
            create: steps?.map((step: any) => ({
              stepNumber: step.stepNumber,
              name: step.name,
              executionMode: step.mode || 'serial',
              requiredApprovals: step.requiredApprovals || 1,
              timeoutHours: step.timeoutHours || null,
              allowDelegate: step.allowDelegate ?? true,
              allowSkip: step.allowSkip ?? false,
              approvers: {
                create: step.approvers?.map((approver: any, index: number) => ({
                  approverType: approver.type || 'role',
                  approverId: approver.userId || null,
                  approverRole: approver.role || null,
                  positionLevel: approver.positionLevel || null,
                  order: approver.order || index + 1,
                })) || [],
              },
            })) || [],
          },
          conditions: {
            create: conditions?.map((condition: any) => ({
              field: condition.field,
              operator: condition.operator,
              value: condition.value,
              description: condition.description || null,
            })) || [],
          },
        },
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' },
            include: {
              approvers: {
                orderBy: { order: 'asc' },
              },
            },
          },
          conditions: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        id: flow.id,
        name: flow.name,
        documentType: flow.documentType,
        type: flow.flowType,
      },
    });
  } catch (error) {
    console.error('Error updating approval flow:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update approval flow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/approval-flows/[id] - 承認フロー削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 既存のフローを確認
    const existingFlow = await prisma.approval_flow_definitions.findUnique({
      where: { id },
    });

    if (!existingFlow) {
      return NextResponse.json(
        { success: false, error: 'Approval flow not found' },
        { status: 404 }
      );
    }

    // デフォルトフローは削除不可
    if (existingFlow.isDefault) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default flow' },
        { status: 400 }
      );
    }

    // 削除（カスケードでステップ・条件も削除される）
    await prisma.approval_flow_definitions.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Approval flow deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting approval flow:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete approval flow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
