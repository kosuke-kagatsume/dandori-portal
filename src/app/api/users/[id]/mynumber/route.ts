/**
 * マイナンバー CRUD API
 * GET: メタデータ取得（番号はマスク）
 * POST: 登録・更新（暗号化保存）
 * DELETE: ソフトデリート + ログ
 *
 * 認可: requireMynumberAccess ヘルパで以下を一括チェック
 * - 認証
 * - ターゲットの自テナント所属（テナント越境ブロック）
 * - mynumber 個別権限（read / manage）
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api/api-helpers';
import { encryptMyNumber, validateMyNumber } from '@/lib/crypto/mynumber-encryption';
import { recordAuditLogDirect } from '@/lib/audit-logger';
import { requireMynumberAccess } from '@/lib/auth/user-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: マイナンバーメタデータ取得（read 権限）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;
  const access = await requireMynumberAccess(request, targetUserId, 'read');
  if (access.errorResponse) return access.errorResponse;

  try {
    const tenantId = access.targetUser.tenantId;

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

// POST: マイナンバー登録・更新（manage 権限）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;
  const access = await requireMynumberAccess(request, targetUserId, 'manage');
  if (access.errorResponse) return access.errorResponse;

  try {
    const tenantId = access.targetUser.tenantId;

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
      userId: access.user.userId,
      userName: access.user.email,
      userRole: access.user.role,
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

// DELETE: ソフトデリート（manage 権限）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;
  const access = await requireMynumberAccess(request, targetUserId, 'manage');
  if (access.errorResponse) return access.errorResponse;

  try {
    const tenantId = access.targetUser.tenantId;

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
        deletedBy: access.user.userId,
        encryptedNumber: null,
        encryptionIv: null,
        encryptionTag: null,
      },
    });

    // 監査ログ
    await recordAuditLogDirect(prisma, {
      tenantId,
      userId: access.user.userId,
      userName: access.user.email,
      userRole: access.user.role,
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
