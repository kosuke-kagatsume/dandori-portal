import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verify, sign, JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'dandori-portal-secret-key-change-in-production';
const TOKEN_EXPIRY = 60 * 60 * 24; // 24 hours

interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
}

/**
 * パスワード変更API
 * 初回ログイン後のパスワード変更に使用
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    // トークンを検証してユーザーIDを取得
    let decoded: TokenPayload;
    try {
      decoded = verify(accessToken, JWT_SECRET) as TokenPayload;
    } catch {
      return NextResponse.json(
        { success: false, error: 'セッションが無効です。再度ログインしてください' },
        { status: 401 }
      );
    }

    const { newPassword } = await request.json();

    // パスワードのバリデーション
    if (!newPassword) {
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

    // ユーザーを取得
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: {
        tenants: {
          select: {
            id: true,
            name: true,
            timezone: true,
            closingDay: true,
            weekStartDay: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // パスワードをハッシュ化して更新
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetRequired: false,
        updatedAt: new Date(),
      },
    });

    // 新しいトークンを発行
    const newAccessToken = sign(
      { userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    const newRefreshToken = sign(
      { userId: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY * 7 }
    );

    // Cookieを更新
    cookieStore.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_EXPIRY,
    });

    cookieStore.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_EXPIRY * 7,
    });

    return NextResponse.json({
      success: true,
      message: 'パスワードを変更しました',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          roles: [user.role || 'employee'],
          department: user.department,
          position: user.position,
          tenantId: user.tenantId,
        },
        tenant: user.tenants ? {
          id: user.tenants.id,
          name: user.tenants.name,
          timezone: user.tenants.timezone,
          closingDay: user.tenants.closingDay,
          weekStartDay: user.tenants.weekStartDay,
        } : null,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: TOKEN_EXPIRY,
      },
    });
  } catch (error) {
    console.error('Change password error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'パスワードの変更に失敗しました',
        ...(process.env.NODE_ENV === 'development' && { debug: errorMessage }),
      },
      { status: 500 }
    );
  }
}
