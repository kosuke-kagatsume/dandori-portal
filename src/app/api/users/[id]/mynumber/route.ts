/**
 * マイナンバー CRUD API
 * GET: メタデータ取得（番号はマスク）
 * POST: 登録・更新（暗号化保存）
 * DELETE: ソフトデリート + ログ
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/api-auth';
import { getTenantIdFromRequest, errorResponse } from '@/lib/api/api-helpers';
import { canReadMynumber, canManageMynumber } from '@/lib/api/mynumber-permission';
import { encryptMyNumber, validateMyNumber } from '@/lib/crypto/mynumber-encryption';
import { recordAuditLogDirect } from '@/lib/audit-logger';

// GET: マイナンバーメタデータ取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromRequest(request);
    const { id: targetUserId } = await params;

    const hasPermission = await canReadMynumber(tenantId, auth.user.userId);
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'マイナンバー閲覧権限がありません' }, { status: 403 });
    }

    const record = await prisma.mynumber_records.findFirst({
      where: {
        tenantId,
        userId: targetUserId,
        subjectType: 'employee',
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        purpose: true,
        memo: true,
        numberDocKey: true,
        identityDocKey: true,
        requestedAt: true,
        encryptedNumber: true, // presence check only
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: record ? {
        id: record.id,
        hasNumber: !!record.encryptedNumber,
        maskedNumber: record.encryptedNumber ? '************' : null,
        status: record.status,
        purpose: record.purpose,
        memo: record.memo,
        hasNumberDoc: !!record.numberDocKey,
        hasIdentityDoc: !!record.identityDocKey,
        requestedAt: record.requestedAt,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      } : null,
    });
  } catch {
    return errorResponse('マイナンバー取得に失敗しました', 500);
  }
}

// POST: マイナンバー登録・更新
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromRequest(request);
    const { id: targetUserId } = await params;

    const hasPermission = await canManageMynumber(tenantId, auth.user.userId);
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'マイナンバー管理権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const { myNumber, purpose, memo, status } = body;

    // マイナンバーが含まれる場合はバリデーション + 暗号化
    let encryptionData: { encrypted: string; iv: string; tag: string } | null = null;
    if (myNumber) {
      const validation = validateMyNumber(myNumber);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }
      encryptionData = encryptMyNumber(myNumber);
    }

    const existing = await prisma.mynumber_records.findFirst({
      where: { tenantId, userId: targetUserId, subjectType: 'employee', deletedAt: null },
    });

    const isUpdate = !!existing;
    let recordId: string;

    if (existing) {
      await prisma.mynumber_records.update({
        where: { id: existing.id },
        data: {
          ...(encryptionData && {
            encryptedNumber: encryptionData.encrypted,
            encryptionIv: encryptionData.iv,
            encryptionTag: encryptionData.tag,
          }),
          ...(purpose !== undefined && { purpose }),
          ...(memo !== undefined && { memo }),
          ...(status !== undefined && { status }),
        },
      });
      recordId = existing.id;
    } else {
      const created = await prisma.mynumber_records.create({
        data: {
          id: crypto.randomUUID(),
          tenantId,
          userId: targetUserId,
          subjectType: 'employee',
          ...(encryptionData && {
            encryptedNumber: encryptionData.encrypted,
            encryptionIv: encryptionData.iv,
            encryptionTag: encryptionData.tag,
          }),
          purpose: purpose || null,
          memo: memo || null,
          status: status || 'pending',
        },
      });
      recordId = created.id;
    }

    // 監査ログ
    await recordAuditLogDirect(prisma, {
      tenantId,
      userId: auth.user.userId,
      userName: auth.user.email,
      userRole: auth.user.role,
      action: isUpdate ? 'update' : 'create',
      category: 'mynumber',
      targetType: 'mynumber',
      targetId: targetUserId,
      description: isUpdate ? 'マイナンバー情報更新' : 'マイナンバー登録',
      severity: 'info',
    });

    return NextResponse.json({ success: true, data: { id: recordId } });
  } catch {
    return errorResponse('マイナンバー保存に失敗しました', 500);
  }
}

// DELETE: ソフトデリート
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromRequest(request);
    const { id: targetUserId } = await params;

    const hasPermission = await canManageMynumber(tenantId, auth.user.userId);
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'マイナンバー管理権限がありません' }, { status: 403 });
    }

    // ターゲットユーザー名を取得（ログ用）
    const targetUser = await prisma.users.findUnique({
      where: { id: targetUserId },
      select: { name: true },
    });

    const record = await prisma.mynumber_records.findFirst({
      where: { tenantId, userId: targetUserId, subjectType: 'employee', deletedAt: null },
    });

    if (!record) {
      return NextResponse.json({ success: false, error: 'マイナンバーが登録されていません' }, { status: 404 });
    }

    await prisma.mynumber_records.update({
      where: { id: record.id },
      data: {
        deletedAt: new Date(),
        deletedBy: auth.user.userId,
        encryptedNumber: null,
        encryptionIv: null,
        encryptionTag: null,
      },
    });

    // 監査ログ
    await recordAuditLogDirect(prisma, {
      tenantId,
      userId: auth.user.userId,
      userName: auth.user.email,
      userRole: auth.user.role,
      action: 'delete',
      category: 'mynumber',
      targetType: 'mynumber',
      targetId: targetUserId,
      targetName: targetUser?.name || '',
      description: `マイナンバー削除（対象: ${targetUser?.name || targetUserId}）`,
      severity: 'warning',
    });

    return NextResponse.json({ success: true });
  } catch {
    return errorResponse('マイナンバー削除に失敗しました', 500);
  }
}
