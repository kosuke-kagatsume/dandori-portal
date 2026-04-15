/**
 * マイナンバー監査履歴 API
 * GET: audit_logs から mynumber カテゴリのログを取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/api-auth';
import { getTenantIdFromRequest, errorResponse } from '@/lib/api/api-helpers';
import { canReadMynumber } from '@/lib/api/mynumber-permission';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromRequest(request);

    const hasPermission = await canReadMynumber(tenantId, auth.user.userId);
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'マイナンバー閲覧権限がありません' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      category: 'mynumber',
      ...(targetUserId && { targetId: targetUserId }),
    };

    const [logs, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          userName: true,
          action: true,
          targetType: true,
          targetId: true,
          targetName: true,
          description: true,
          severity: true,
          createdAt: true,
        },
      }),
      prisma.audit_logs.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return errorResponse('監査履歴取得に失敗しました', 500);
  }
}
