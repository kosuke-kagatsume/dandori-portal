import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * ユーザー招待API
 * テナント管理者がメンバーを招待する際に使用
 * 招待トークンを生成してユーザーを仮登録
 */
export async function POST(request: NextRequest) {
  try {
    const { email, name, role, tenantId, tenantName } = await request.json();

    // バリデーション
    if (!email || !name) {
      return NextResponse.json(
        { error: 'メールアドレスと氏名は必須です' },
        { status: 400 }
      );
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // 既存ユーザーチェック
    const existingUser = await prisma.users.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      );
    }

    // 招待トークンを生成
    const inviteToken = randomBytes(32).toString('hex');
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7日後

    // ユーザーを招待状態で作成
    const user = await prisma.users.create({
      data: {
        email,
        name,
        role: role || 'employee',
        tenantId: tenantId || null,
        status: 'inactive', // 招待受諾まで無効
        inviteToken,
        inviteExpiry,
      },
    });

    // 招待メール送信 (ここでは招待URLを生成のみ)
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://dandori-portal.com'}/auth/accept-invite?token=${inviteToken}`;

    console.log('User invited successfully:', email);
    console.log('Invite URL:', inviteUrl);

    // TODO: 実際のメール送信処理を実装 (SES, SendGrid等)
    // await sendInviteEmail(email, name, inviteUrl, tenantName);

    return NextResponse.json({
      success: true,
      message: '招待を作成しました',
      user: {
        id: user.id,
        email: user.email,
        name,
        role: role || 'employee',
        tenantId,
        invitedAt: new Date().toISOString(),
      },
      // 開発時のみ招待URLを返す
      ...(process.env.NODE_ENV !== 'production' && { inviteUrl }),
    });
  } catch (error) {
    console.error('Invite user error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
