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
    const originalFlow = await prisma.approval_flow_definitions.findUnique({
      where: { id },
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

    if (!originalFlow) {
      return NextResponse.json(
        { success: false, error: 'Approval flow not found' },
        { status: 404 }
      );
    }

    // 新しいフローを作成（デフォルトはfalseに設定）
    const newFlow = await prisma.approval_flow_definitions.create({
      data: {
        id: crypto.randomUUID(),
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
        updatedAt: new Date(),
        approval_flow_steps: {
          create: originalFlow.approval_flow_steps.map((step) => ({
            id: crypto.randomUUID(),
            stepNumber: step.stepNumber,
            name: step.name,
            executionMode: step.executionMode,
            requiredApprovals: step.requiredApprovals,
            timeoutHours: step.timeoutHours,
            allowDelegate: step.allowDelegate,
            allowSkip: step.allowSkip,
            updatedAt: new Date(),
            approval_flow_approvers: {
              create: step.approval_flow_approvers.map((approver) => ({
                id: crypto.randomUUID(),
                approverType: approver.approverType,
                approverId: approver.approverId,
                approverRole: approver.approverRole,
                positionLevel: approver.positionLevel,
                order: approver.order,
                updatedAt: new Date(),
              })),
            },
          })),
        },
        approval_flow_conditions: {
          create: originalFlow.approval_flow_conditions.map((condition) => ({
            id: crypto.randomUUID(),
            field: condition.field,
            operator: condition.operator,
            value: condition.value,
            description: condition.description,
            updatedAt: new Date(),
          })),
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
