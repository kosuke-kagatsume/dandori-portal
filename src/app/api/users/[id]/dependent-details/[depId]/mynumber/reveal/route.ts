/**
 * 扶養家族マイナンバー復号 API
 *
 * 認可: requireMynumberAccess(read)
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
  { params }: { params: Promise<{ id: string; depId: string }> }
) {
  const { id: targetUserId, depId } = await params;
  const access = await requireMynumberAccess(request, targetUserId, 'read');
  if (access.errorResponse) return access.errorResponse;

  try {
    const tenantId = access.targetUser.tenantId;

    const record = await prisma.mynumber_records.findFirst({
      where: {
        tenantId,
        userId: targetUserId,
        subjectType: 'dependent',
        dependentDetailId: depId,
        deletedAt: null,
        encryptedNumber: { not: null },
      },
    });

    if (!record?.encryptedNumber || !record.encryptionIv || !record.encryptionTag) {
      return NextResponse.json({ success: false, error: 'マイナンバーが登録されていません' }, { status: 404 });
    }

    const decrypted = decryptMyNumber(record.encryptedNumber, record.encryptionIv, record.encryptionTag);

    const dependent = await prisma.employee_dependent_details.findUnique({
      where: { id: depId },
      select: { name: true },
    });

    await recordAuditLogDirect(prisma, {
      tenantId,
      userId: access.user.userId,
      userName: access.user.email,
      userRole: access.user.role,
      action: 'access',
      category: 'mynumber',
      targetType: 'mynumber_dependent',
      targetId: depId,
      targetName: dependent?.name || '',
      description: `扶養家族マイナンバー表示（対象: ${dependent?.name || depId}）`,
      severity: 'info',
    });

    return NextResponse.json({ success: true, data: { myNumber: decrypted } });
  } catch {
    return errorResponse('扶養家族マイナンバー復号に失敗しました', 500);
  }
}
