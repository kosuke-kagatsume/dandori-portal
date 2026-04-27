import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { hashPasswordResetToken } from '@/lib/auth/password-reset-token';
import { recordAuditLogDirect } from '@/lib/audit-logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'トークンが無効です' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { success: false, error: '新しいパスワードを入力してください' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'パスワードは8文字以上必要です' },
        { status: 400 }
      );
    }

    const tokenHash = hashPasswordResetToken(token);

    const user = await prisma.users.findFirst({
      where: { passwordResetToken: tokenHash },
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true,
        passwordResetTokenExpiry: true,
      },
    });

    if (!user || !user.passwordResetTokenExpiry || user.passwordResetTokenExpiry < new Date()) {
      return NextResponse.json(
        { success: false, error: 'リンクの有効期限が切れているか、無効です。再度パスワード再設定を依頼してください。' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetRequired: false,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
        updatedAt: new Date(),
      },
    });

    await recordAuditLogDirect(prisma, {
      tenantId: user.tenantId,
      userId: user.id,
      userName: user.name || user.email,
      action: 'update',
      category: 'auth',
      targetType: 'ユーザー',
      targetId: user.id,
      targetName: user.name || user.email,
      description: `${user.name || user.email} がパスワードを再設定しました`,
      severity: 'info',
    });

    return NextResponse.json({
      success: true,
      message: 'パスワードを再設定しました。新しいパスワードでログインしてください。',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'パスワードの再設定に失敗しました' },
      { status: 500 }
    );
  }
}
