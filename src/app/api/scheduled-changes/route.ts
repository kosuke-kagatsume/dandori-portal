import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// テナントID取得
function getTenantId(request: NextRequest): string {
  return request.nextUrl.searchParams.get('tenantId') || 'tenant-1';
}

// 予約一覧取得
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const { searchParams } = request.nextUrl;

    // フィルターパラメータ
    const type = searchParams.get('type'); // hire, transfer, retirement
    const status = searchParams.get('status'); // pending, applied, cancelled
    const approvalStatus = searchParams.get('approvalStatus'); // pending_approval, approved, rejected
    const userId = searchParams.get('userId');

    // クエリ条件を構築
    const where: Record<string, unknown> = { tenantId };

    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }
    if (approvalStatus) {
      where.approvalStatus = approvalStatus;
    }
    if (userId) {
      where.userId = userId;
    }

    const changes = await prisma.scheduled_changes.findMany({
      where,
      orderBy: [
        { effectiveDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // 統計情報を計算
    const allChanges = await prisma.scheduled_changes.findMany({
      where: { tenantId },
      select: { type: true, status: true },
    });

    const stats = {
      total: allChanges.length,
      pending: allChanges.filter(c => c.status === 'pending').length,
      applied: allChanges.filter(c => c.status === 'applied').length,
      cancelled: allChanges.filter(c => c.status === 'cancelled').length,
      byType: {
        hire: allChanges.filter(c => c.type === 'hire').length,
        transfer: allChanges.filter(c => c.type === 'transfer').length,
        retirement: allChanges.filter(c => c.type === 'retirement').length,
      },
    };

    // APIレスポンス形式に変換
    const formattedChanges = changes.map(change => ({
      id: change.id,
      type: change.type,
      userId: change.userId,
      userName: change.userName,
      effectiveDate: change.effectiveDate.toISOString().split('T')[0],
      status: change.status,
      createdBy: change.createdBy,
      createdByName: change.createdByName,
      createdAt: change.createdAt.toISOString(),
      updatedAt: change.updatedAt.toISOString(),
      // 詳細情報をdetailsオブジェクトにまとめる
      details: formatDetails(change),
      // 承認フロー関連
      requiresApproval: change.requiresApproval,
      approvalStatus: change.approvalStatus,
      workflowId: change.workflowId,
      approvedBy: change.approvedBy,
      approvedByName: change.approvedByName,
      approvedAt: change.approvedAt?.toISOString(),
      rejectionReason: change.rejectionReason,
    }));

    return NextResponse.json({
      success: true,
      data: formattedChanges,
      stats,
    });
  } catch (error) {
    console.error('Failed to fetch scheduled changes:', error);
    return NextResponse.json(
      { success: false, error: '予約一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 詳細情報をフォーマット
function formatDetails(change: {
  type: string;
  hireName: string | null;
  hireEmail: string | null;
  hireDepartment: string | null;
  hirePosition: string | null;
  hireRole: string | null;
  hireEmployeeNumber: string | null;
  currentDepartment: string | null;
  newDepartment: string | null;
  currentPosition: string | null;
  newPosition: string | null;
  transferReason: string | null;
  retirementReason: string | null;
  retirementNotes: string | null;
}) {
  switch (change.type) {
    case 'hire':
      return {
        name: change.hireName,
        email: change.hireEmail,
        department: change.hireDepartment,
        position: change.hirePosition,
        role: change.hireRole,
        employeeNumber: change.hireEmployeeNumber,
      };
    case 'transfer':
      return {
        currentDepartment: change.currentDepartment,
        newDepartment: change.newDepartment,
        currentPosition: change.currentPosition,
        newPosition: change.newPosition,
        reason: change.transferReason,
      };
    case 'retirement':
      return {
        retirementReason: change.retirementReason,
        notes: change.retirementNotes,
      };
    default:
      return {};
  }
}

// 予約作成
export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const body = await request.json();

    const {
      type,
      userId,
      userName,
      effectiveDate,
      createdBy,
      createdByName,
      details,
      requiresApproval = false,
    } = body;

    // バリデーション
    if (!type || !['hire', 'transfer', 'retirement'].includes(type)) {
      return NextResponse.json(
        { success: false, error: '予約タイプは hire, transfer, retirement のいずれかを指定してください' },
        { status: 400 }
      );
    }

    if (!effectiveDate) {
      return NextResponse.json(
        { success: false, error: '適用予定日は必須です' },
        { status: 400 }
      );
    }

    if (!createdBy || !createdByName) {
      return NextResponse.json(
        { success: false, error: '作成者情報は必須です' },
        { status: 400 }
      );
    }

    // 入社予約の場合は詳細が必須
    if (type === 'hire' && (!details?.name || !details?.email || !details?.department)) {
      return NextResponse.json(
        { success: false, error: '入社予約には氏名、メールアドレス、部署が必須です' },
        { status: 400 }
      );
    }

    // 異動・退職の場合はuserIdが必須
    if ((type === 'transfer' || type === 'retirement') && !userId) {
      return NextResponse.json(
        { success: false, error: '異動・退職予約には対象ユーザーIDが必須です' },
        { status: 400 }
      );
    }

    const id = `schedule-${uuidv4()}`;
    const now = new Date();

    const change = await prisma.scheduled_changes.create({
      data: {
        id,
        tenantId,
        type,
        userId: userId || null,
        userName: userName || null,
        effectiveDate: new Date(effectiveDate),
        status: 'pending',
        createdBy,
        createdByName,
        // 入社詳細
        hireName: type === 'hire' ? details?.name : null,
        hireEmail: type === 'hire' ? details?.email : null,
        hireDepartment: type === 'hire' ? details?.department : null,
        hirePosition: type === 'hire' ? details?.position : null,
        hireRole: type === 'hire' ? details?.role : null,
        hireEmployeeNumber: type === 'hire' ? details?.employeeNumber : null,
        // 異動詳細
        currentDepartment: type === 'transfer' ? details?.currentDepartment : null,
        newDepartment: type === 'transfer' ? details?.newDepartment : null,
        currentPosition: type === 'transfer' ? details?.currentPosition : null,
        newPosition: type === 'transfer' ? details?.newPosition : null,
        transferReason: type === 'transfer' ? details?.reason : null,
        // 退職詳細
        retirementReason: type === 'retirement' ? details?.retirementReason : null,
        retirementNotes: type === 'retirement' ? details?.notes : null,
        // 承認フロー
        requiresApproval,
        approvalStatus: requiresApproval ? 'pending_approval' : 'not_required',
        createdAt: now,
        updatedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: change.id,
        type: change.type,
        userId: change.userId,
        userName: change.userName,
        effectiveDate: change.effectiveDate.toISOString().split('T')[0],
        status: change.status,
        createdBy: change.createdBy,
        createdByName: change.createdByName,
        createdAt: change.createdAt.toISOString(),
        updatedAt: change.updatedAt.toISOString(),
        details: formatDetails(change),
        requiresApproval: change.requiresApproval,
        approvalStatus: change.approvalStatus,
      },
    });
  } catch (error) {
    console.error('Failed to create scheduled change:', error);
    return NextResponse.json(
      { success: false, error: '予約の作成に失敗しました' },
      { status: 500 }
    );
  }
}
