import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/approval-flows/[id]/duplicate - 承認フロー複製
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 複製元のフローを取得
    const originalFlow = await prisma.approvalFlowDefinition.findUnique({
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

    if (!originalFlow) {
      return NextResponse.json(
        { success: false, error: 'Approval flow not found' },
        { status: 404 }
      );
    }

    // 新しいフローを作成（デフォルトはfalseに設定）
    const newFlow = await prisma.approvalFlowDefinition.create({
      data: {
        tenantId: originalFlow.tenantId,
        name: `${originalFlow.name} (コピー)`,
        description: originalFlow.description,
        documentType: originalFlow.documentType,
        flowType: originalFlow.flowType,
        useOrganizationHierarchy: originalFlow.useOrganizationHierarchy,
        organizationLevels: originalFlow.organizationLevels,
        isActive: originalFlow.isActive,
        isDefault: false, // コピーはデフォルトにしない
        priority: originalFlow.priority,
        createdBy: originalFlow.createdBy,
        steps: {
          create: originalFlow.steps.map((step) => ({
            stepNumber: step.stepNumber,
            name: step.name,
            executionMode: step.executionMode,
            requiredApprovals: step.requiredApprovals,
            timeoutHours: step.timeoutHours,
            allowDelegate: step.allowDelegate,
            allowSkip: step.allowSkip,
            approvers: {
              create: step.approvers.map((approver) => ({
                approverType: approver.approverType,
                approverId: approver.approverId,
                approverRole: approver.approverRole,
                positionLevel: approver.positionLevel,
                order: approver.order,
              })),
            },
          })),
        },
        conditions: {
          create: originalFlow.conditions.map((condition) => ({
            field: condition.field,
            operator: condition.operator,
            value: condition.value,
            description: condition.description,
          })),
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

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newFlow.id,
          name: newFlow.name,
          documentType: newFlow.documentType,
          type: newFlow.flowType,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error duplicating approval flow:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to duplicate approval flow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
