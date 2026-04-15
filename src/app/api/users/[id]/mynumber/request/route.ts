/**
 * マイナンバー提供依頼 API
 * POST: ステータスを requested に更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/api-auth';
import { getTenantIdFromRequest, errorResponse } from '@/lib/api/api-helpers';
import { canManageMynumber } from '@/lib/api/mynumber-permission';
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

    const hasPermission = await canManageMynumber(tenantId, auth.user.userId);
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'マイナンバー管理権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const { dependentDetailId } = body;
    const subjectType = dependentDetailId ? 'dependent' : 'employee';

    const existing = await prisma.mynumber_records.findFirst({
      where: {
        tenantId,
        userId: targetUserId,
        subjectType,
        ...(dependentDetailId ? { dependentDetailId } : {}),
        deletedAt: null,
      },
    });

    if (existing) {
      await prisma.mynumber_records.update({
        where: { id: existing.id },
        data: {
          status: 'requested',
          requestedAt: new Date(),
          requestedBy: auth.user.userId,
        },
      });
    } else {
      await prisma.mynumber_records.create({
        data: {
          id: crypto.randomUUID(),
          tenantId,
          userId: targetUserId,
          subjectType,
          ...(dependentDetailId ? { dependentDetailId } : {}),
          status: 'requested',
          requestedAt: new Date(),
          requestedBy: auth.user.userId,
        },
      });
    }

    const targetUser = await prisma.users.findUnique({ where: { id: targetUserId }, select: { name: true } });
    await recordAuditLogDirect(prisma, {
      tenantId,
      userId: auth.user.userId,
      userName: auth.user.email,
      userRole: auth.user.role,
      action: 'update',
      category: 'mynumber',
      targetType: 'mynumber',
      targetId: targetUserId,
      targetName: targetUser?.name || '',
      description: `マイナンバー提供依頼（対象: ${targetUser?.name || targetUserId}）`,
      severity: 'info',
    });

    return NextResponse.json({ success: true });
  } catch {
    return errorResponse('提供依頼に失敗しました', 500);
  }
}
