/**
 * マイナンバー提供依頼 API
 * POST: ステータスを requested に更新
 *
 * 認可: requireMynumberAccess(manage)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api/api-helpers';
import { recordAuditLogDirect } from '@/lib/audit-logger';
import { requireMynumberAccess } from '@/lib/auth/user-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
          requestedBy: access.user.userId,
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
          requestedBy: access.user.userId,
        },
      });
    }

    const targetUser = await prisma.users.findUnique({ where: { id: targetUserId }, select: { name: true } });
    await recordAuditLogDirect(prisma, {
      tenantId,
      userId: access.user.userId,
      userName: access.user.email,
      userRole: access.user.role,
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
