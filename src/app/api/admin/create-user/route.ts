import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * ユーザー作成API
 * DW管理画面からテナント作成時に呼び出される
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, tenantId } = await request.json();

    // バリデーション
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'メールアドレス、パスワード、氏名は必須です' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上必要です' },
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

    // パスワードをハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);

    // tenantIdのバリデーション
    if (!tenantId) {
      return NextResponse.json(
        { error: 'テナントIDは必須です' },
        { status: 400 }
      );
    }

    // ユーザーを作成
    const userRole = role || 'admin';
    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email,
        name,
        passwordHash,
        role: userRole,
        roles: [userRole], // roles配列も設定（必須フィールド）
        tenantId,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    console.log('User created successfully:', email);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { message: errorMessage, stack: errorStack });

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
