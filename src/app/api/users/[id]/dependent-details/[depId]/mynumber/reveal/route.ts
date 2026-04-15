/**
 * 扶養家族マイナンバー復号 API
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
  { params }: { params: Promise<{ id: string; depId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromRequest(request);
    const { depId } = await params;

    if (!(await canReadMynumber(tenantId, auth.user.userId))) {
      return NextResponse.json({ success: false, error: 'マイナンバー閲覧権限がありません' }, { status: 403 });
    }

    const record = await prisma.mynumber_records.findFirst({
      where: {
        tenantId,
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
      userId: auth.user.userId,
      userName: auth.user.email,
      userRole: auth.user.role,
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
