/**
 * マイナンバー復号 API
 * POST: 暗号化されたマイナンバーを復号して返却（監査ログ記録）
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/api-auth';
import { getTenantIdFromRequest, errorResponse } from '@/lib/api/api-helpers';
import { canReadMynumber } from '@/lib/api/mynumber-permission';
import { decryptMyNumber } from '@/lib/crypto/mynumber-encryption';
import { recordAuditLogDirect } from '@/lib/audit-logger';

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
      userId: auth.user.userId,
      userName: auth.user.email,
      userRole: auth.user.role,
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
