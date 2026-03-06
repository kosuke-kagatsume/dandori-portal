import { NextRequest, NextResponse } from 'next/server';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


interface RouteContext {
  params: Promise<{ id: string }>;
}

// 予約を即座に適用
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const tenantId = await getTenantIdFromRequest(request);

    // 既存の予約を取得
    const existing = await prisma.scheduled_changes.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '予約が見つかりません' },
        { status: 404 }
      );
    }

    // 既に適用済みの場合
    if (existing.status === 'applied') {
      return NextResponse.json(
        { success: false, error: '既に適用済みです' },
        { status: 400 }
      );
    }

    // キャンセル済みの場合
    if (existing.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'キャンセル済みの予約は適用できません' },
        { status: 400 }
      );
    }

    // 承認が必要で、まだ承認されていない場合
    if (existing.requiresApproval && existing.approvalStatus !== 'approved') {
      return NextResponse.json(
        { success: false, error: '承認されていない予約は適用できません' },
        { status: 400 }
      );
    }

    // 異動タイプの場合、ユーザー情報を実際に更新
    if (existing.type === 'transfer' && existing.userId) {
      // 適用時点のユーザー現在情報を取得
      const currentUser = await prisma.users.findFirst({
        where: { id: existing.userId },
        select: {
          department: true,
          position: true,
          employmentType: true,
          workRuleId: true,
        },
      });

      // 予約レコードに現在の情報を確実にセット（作成時に未設定だった場合の補完）
      const historyUpdateData: Record<string, unknown> = {};
      if (!existing.currentDepartment && currentUser?.department) {
        historyUpdateData.currentDepartment = currentUser.department;
      }
      if (!existing.currentPosition && currentUser?.position) {
        historyUpdateData.currentPosition = currentUser.position;
      }
      if (!existing.currentEmploymentType && currentUser?.employmentType) {
        historyUpdateData.currentEmploymentType = currentUser.employmentType;
      }

      // 就業ルール名を取得して保存
      if (!existing.currentWorkRuleName && currentUser?.workRuleId) {
        const currentWorkRule = await prisma.work_rules.findFirst({
          where: { id: currentUser.workRuleId },
          select: { name: true },
        });
        if (currentWorkRule) {
          historyUpdateData.currentWorkRuleName = currentWorkRule.name;
        }
      }

      const userUpdateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      // 部門更新
      if (existing.newDepartment && existing.newDepartment !== '変更なし') {
        userUpdateData.department = existing.newDepartment;
        // 部門名からdepartmentIdを逆引き
        const dept = await prisma.departments.findFirst({
          where: { tenantId, name: existing.newDepartment, isActive: true },
        });
        if (dept) {
          userUpdateData.departmentId = dept.id;
        }
      }

      // 役職更新
      if (existing.newPosition && existing.newPosition !== '変更なし') {
        userUpdateData.position = existing.newPosition;
        // 役職名からpositionIdを逆引き
        const pos = await prisma.positions.findFirst({
          where: { tenantId, name: existing.newPosition, isActive: true },
        });
        if (pos) {
          userUpdateData.positionId = pos.id;
        }
      }

      // 雇用形態更新
      if (existing.newEmploymentType && existing.newEmploymentType !== '変更なし') {
        userUpdateData.employmentType = existing.newEmploymentType;
      }

      // 就業ルール更新
      if (existing.newWorkRuleId && existing.newWorkRuleId !== '変更なし') {
        userUpdateData.workRuleId = existing.newWorkRuleId;
      }

      // トランザクションでユーザー更新 + 予約ステータス更新 + 履歴情報保存
      await prisma.$transaction([
        prisma.users.update({
          where: { id: existing.userId },
          data: userUpdateData,
        }),
        prisma.scheduled_changes.update({
          where: { id },
          data: {
            status: 'applied',
            updatedAt: new Date(),
            ...historyUpdateData,
          },
        }),
      ]);
    } else {
      // 異動以外はステータスのみ更新
      await prisma.scheduled_changes.update({
        where: { id },
        data: {
          status: 'applied',
          updatedAt: new Date(),
        },
      });
    }

    const change = await prisma.scheduled_changes.findFirst({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: change!.id,
        status: change!.status,
        updatedAt: change!.updatedAt.toISOString(),
      },
      message: '予約を適用しました',
    });
  } catch (error) {
    console.error('Failed to apply scheduled change:', error);
    return NextResponse.json(
      { success: false, error: '予約の適用に失敗しました' },
      { status: 500 }
    );
  }
}
