/**
 * マイナンバー復号 API
 * POST: 暗号化されたマイナンバーを復号して返却（監査ログ記録）
 *
 * 認可: requireMynumberAccess(read) で
 *       認証 + 自テナント + mynumber:read:company を要求
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api/api-helpers';
import { decryptMyNumber } from '@/lib/crypto/mynumber-encryption';
import { recordAuditLogDirect } from '@/lib/audit-logger';
import { requireMynumberAccess } from '@/lib/auth/user-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
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
        encryptedNumber: { not: null },
      },
    });

    if (!record || !record.encryptedNumber || !record.encryptionIv || !record.encryptionTag) {
      return NextResponse.json({ success: false, error: 'マイナンバーが登録されていません' }, { status: 404 });
    }

    const decrypted = decryptMyNumber(record.encryptedNumber, record.encryptionIv, record.encryptionTag);

    // ターゲットユーザー名を取得（ログ用）
    const targetUser = await prisma.users.findUnique({
      where: { id: targetUserId },
      select: { name: true },
    });

    // 監査ログ: マイナンバー表示
    await recordAuditLogDirect(prisma, {
      tenantId,
      userId: access.user.userId,
      userName: access.user.email,
      userRole: access.user.role,
      action: 'access',
      category: 'mynumber',
      targetType: 'mynumber',
      targetId: targetUserId,
      targetName: targetUser?.name || '',
      description: `マイナンバー表示（対象: ${targetUser?.name || targetUserId}）`,
      severity: 'info',
    });

    return NextResponse.json({ success: true, data: { myNumber: decrypted } });
  } catch {
    return errorResponse('マイナンバー復号に失敗しました', 500);
  }
}
