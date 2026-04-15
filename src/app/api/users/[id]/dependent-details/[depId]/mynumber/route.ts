/**
 * 扶養家族マイナンバー CRUD API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/api-auth';
import { getTenantIdFromRequest, errorResponse } from '@/lib/api/api-helpers';
import { canReadMynumber, canManageMynumber } from '@/lib/api/mynumber-permission';
import { encryptMyNumber, validateMyNumber } from '@/lib/crypto/mynumber-encryption';
import { recordAuditLogDirect } from '@/lib/audit-logger';

type RouteParams = { params: Promise<{ id: string; depId: string }> };

// GET: 扶養家族マイナンバーメタデータ
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromRequest(request);
    const { id: targetUserId, depId } = await params;

    if (!(await canReadMynumber(tenantId, auth.user.userId))) {
      return NextResponse.json({ success: false, error: 'マイナンバー閲覧権限がありません' }, { status: 403 });
    }

    const record = await prisma.mynumber_records.findFirst({
      where: { tenantId, userId: targetUserId, subjectType: 'dependent', dependentDetailId: depId, deletedAt: null },
      select: {
        id: true, status: true, encryptedNumber: true, numberDocKey: true, identityDocKey: true,
        requestedAt: true, createdAt: true, updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: record ? {
        id: record.id,
        hasNumber: !!record.encryptedNumber,
        maskedNumber: record.encryptedNumber ? '************' : null,
        status: record.status,
        hasNumberDoc: !!record.numberDocKey,
        hasIdentityDoc: !!record.identityDocKey,
        requestedAt: record.requestedAt,
      } : null,
    });
  } catch {
    return errorResponse('扶養家族マイナンバー取得に失敗しました', 500);
  }
}

// POST: 扶養家族マイナンバー登録・更新
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromRequest(request);
    const { id: targetUserId, depId } = await params;

    if (!(await canManageMynumber(tenantId, auth.user.userId))) {
      return NextResponse.json({ success: false, error: 'マイナンバー管理権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const { myNumber, status } = body;

    let encryptionData: { encrypted: string; iv: string; tag: string } | null = null;
    if (myNumber) {
      const validation = validateMyNumber(myNumber);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }
      encryptionData = encryptMyNumber(myNumber);
    }

    const dependent = await prisma.employee_dependent_details.findUnique({
      where: { id: depId },
      select: { name: true },
    });

    await prisma.mynumber_records.upsert({
      where: {
        tenantId_userId_subjectType_dependentDetailId: {
          tenantId, userId: targetUserId, subjectType: 'dependent', dependentDetailId: depId,
        },
      },
      create: {
        id: crypto.randomUUID(),
        tenantId,
        userId: targetUserId,
        subjectType: 'dependent',
        dependentDetailId: depId,
        ...(encryptionData && {
          encryptedNumber: encryptionData.encrypted,
          encryptionIv: encryptionData.iv,
          encryptionTag: encryptionData.tag,
        }),
        status: status || 'pending',
      },
      update: {
        ...(encryptionData && {
          encryptedNumber: encryptionData.encrypted,
          encryptionIv: encryptionData.iv,
          encryptionTag: encryptionData.tag,
        }),
        ...(status !== undefined && { status }),
      },
    });

    await recordAuditLogDirect(prisma, {
      tenantId,
      userId: auth.user.userId,
      userName: auth.user.email,
      userRole: auth.user.role,
      action: 'create',
      category: 'mynumber',
      targetType: 'mynumber_dependent',
      targetId: depId,
      targetName: dependent?.name || '',
      description: `扶養家族マイナンバー登録（対象: ${dependent?.name || depId}）`,
      severity: 'info',
    });

    return NextResponse.json({ success: true });
  } catch {
    return errorResponse('扶養家族マイナンバー保存に失敗しました', 500);
  }
}

// DELETE: 扶養家族マイナンバー削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromRequest(request);
    const { id: targetUserId, depId } = await params;

    if (!(await canManageMynumber(tenantId, auth.user.userId))) {
      return NextResponse.json({ success: false, error: 'マイナンバー管理権限がありません' }, { status: 403 });
    }

    const record = await prisma.mynumber_records.findFirst({
      where: { tenantId, userId: targetUserId, subjectType: 'dependent', dependentDetailId: depId, deletedAt: null },
    });

    if (!record) {
      return NextResponse.json({ success: false, error: 'マイナンバーが登録されていません' }, { status: 404 });
    }

    const dependent = await prisma.employee_dependent_details.findUnique({
      where: { id: depId },
      select: { name: true },
    });

    await prisma.mynumber_records.update({
      where: { id: record.id },
      data: { deletedAt: new Date(), deletedBy: auth.user.userId, encryptedNumber: null, encryptionIv: null, encryptionTag: null },
    });

    await recordAuditLogDirect(prisma, {
      tenantId,
      userId: auth.user.userId,
      userName: auth.user.email,
      userRole: auth.user.role,
      action: 'delete',
      category: 'mynumber',
      targetType: 'mynumber_dependent',
      targetId: depId,
      targetName: dependent?.name || '',
      description: `扶養家族マイナンバー削除（対象: ${dependent?.name || depId}）`,
      severity: 'warning',
    });

    return NextResponse.json({ success: true });
  } catch {
    return errorResponse('扶養家族マイナンバー削除に失敗しました', 500);
  }
}
