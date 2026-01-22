import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/workflow-settings - ワークフロー設定取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-1';

    const settings = await prisma.workflow_settings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      // 設定が存在しない場合はデフォルト値を返す
      return NextResponse.json({
        success: true,
        data: {
          tenantId,
          defaultApprovalDeadlineDays: 3,
          enableAutoEscalation: false,
          escalationReminderDays: 1,
          enableAutoApproval: false,
          autoApprovalThreshold: 10000,
          requireCommentOnReject: true,
          allowParallelApproval: false,
          enableProxyApproval: false,
        },
        isNew: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: settings.id,
        tenantId: settings.tenantId,
        defaultApprovalDeadlineDays: settings.defaultApprovalDeadlineDays,
        enableAutoEscalation: settings.enableAutoEscalation,
        escalationReminderDays: settings.escalationReminderDays,
        enableAutoApproval: settings.enableAutoApproval,
        autoApprovalThreshold: settings.autoApprovalThreshold,
        requireCommentOnReject: settings.requireCommentOnReject,
        allowParallelApproval: settings.allowParallelApproval,
        enableProxyApproval: settings.enableProxyApproval,
      },
    });
  } catch (error) {
    console.error('Error fetching workflow settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch workflow settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/workflow-settings - ワークフロー設定更新（upsert）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-1',
      defaultApprovalDeadlineDays,
      enableAutoEscalation,
      escalationReminderDays,
      enableAutoApproval,
      autoApprovalThreshold,
      requireCommentOnReject,
      allowParallelApproval,
      enableProxyApproval,
    } = body;

    // upsert（存在すれば更新、なければ作成）
    const settings = await prisma.workflow_settings.upsert({
      where: { tenantId },
      update: {
        defaultApprovalDeadlineDays,
        enableAutoEscalation,
        escalationReminderDays,
        enableAutoApproval,
        autoApprovalThreshold,
        requireCommentOnReject,
        allowParallelApproval,
        enableProxyApproval,
      },
      create: {
        tenantId,
        defaultApprovalDeadlineDays: defaultApprovalDeadlineDays ?? 3,
        enableAutoEscalation: enableAutoEscalation ?? false,
        escalationReminderDays: escalationReminderDays ?? 1,
        enableAutoApproval: enableAutoApproval ?? false,
        autoApprovalThreshold: autoApprovalThreshold ?? 10000,
        requireCommentOnReject: requireCommentOnReject ?? true,
        allowParallelApproval: allowParallelApproval ?? false,
        enableProxyApproval: enableProxyApproval ?? false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: settings.id,
        tenantId: settings.tenantId,
      },
    });
  } catch (error) {
    console.error('Error updating workflow settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update workflow settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
