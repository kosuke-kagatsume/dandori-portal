import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmailForReset, sendPasswordResetEmail } from '@/lib/auth/send-password-reset';
import { recordAuditLogDirect } from '@/lib/audit-logger';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUCCESS_MESSAGE = '入力されたメールアドレスが登録されている場合、パスワード再設定用のメールを送信しました。';

export async function POST(request: NextRequest) {
  try {
    const { email, locale } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'メールアドレスを入力してください' },
        { status: 400 }
      );
    }

    const user = await findUserByEmailForReset(email);

    if (!user) {
      return NextResponse.json({ success: true, message: SUCCESS_MESSAGE });
    }

    const result = await sendPasswordResetEmail({
      userId: user.id,
      triggeredBy: 'self',
      locale: typeof locale === 'string' ? locale : 'ja',
    });

    if (result.emailSent) {
      await recordAuditLogDirect(prisma, {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'access',
        category: 'auth',
        targetType: 'ユーザー',
        targetId: user.id,
        description: `${email} がパスワード再設定メールを要求しました`,
        severity: 'info',
      });
    }

    return NextResponse.json({ success: true, message: SUCCESS_MESSAGE });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: true, message: SUCCESS_MESSAGE });
  }
}
