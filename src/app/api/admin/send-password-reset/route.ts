import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { sendPasswordResetEmail } from '@/lib/auth/send-password-reset';
import { recordAuditLogDirect } from '@/lib/audit-logger';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { auth, errorResponse } = await withAuth(request, ['admin', 'hr']);
  if (errorResponse) return errorResponse;

  try {
    const { userId, locale } = await request.json();

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'ユーザーIDが指定されていません' },
        { status: 400 }
      );
    }

    const target = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, tenantId: true, status: true },
    });

    if (!target) {
      return NextResponse.json(
        { success: false, error: '対象のユーザーが見つかりません' },
        { status: 404 }
      );
    }

    if (target.tenantId !== auth.user?.tenantId) {
      return NextResponse.json(
        { success: false, error: '他テナントのユーザーは操作できません' },
        { status: 403 }
      );
    }

    if (target.status === 'retired' || target.status === 'inactive') {
      return NextResponse.json(
        { success: false, error: '退職済み・無効化済みユーザーには送信できません' },
        { status: 400 }
      );
    }

    const result = await sendPasswordResetEmail({
      userId: target.id,
      triggeredBy: 'admin',
      locale: typeof locale === 'string' ? locale : 'ja',
    });

    if (result.rateLimited) {
      return NextResponse.json(
        { success: false, error: '直近で送信済みです。5分後に再度お試しください。' },
        { status: 429 }
      );
    }

    if (!result.emailSent) {
      return NextResponse.json(
        { success: false, error: result.error || 'メール送信に失敗しました' },
        { status: 500 }
      );
    }

    await recordAuditLogDirect(prisma, {
      tenantId: target.tenantId,
      userId: auth.user?.userId,
      userName: auth.user?.email,
      userRole: auth.user?.role,
      action: 'update',
      category: 'auth',
      targetType: 'ユーザー',
      targetId: target.id,
      targetName: target.name || target.email,
      description: `管理者が「${target.name || target.email}」へパスワード再設定メールを送信しました`,
      severity: 'info',
    });

    return NextResponse.json({
      success: true,
      message: `${target.email} にパスワード再設定メールを送信しました`,
    });
  } catch (error) {
    console.error('Admin send password reset error:', error);
    return NextResponse.json(
      { success: false, error: 'メール送信に失敗しました' },
      { status: 500 }
    );
  }
}
