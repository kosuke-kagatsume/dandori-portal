import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'dandori-portal-secret-key-change-in-production';
const TOKEN_EXPIRY = 60 * 60 * 24; // 24 hours in seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'メールアドレスとパスワードを入力してください' },
        { status: 400 }
      );
    }

    // デモモードの場合はデモユーザーで認証
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const cookieStore = await cookies();

      const demoUser = {
        id: 'demo-user-' + Date.now(),
        email: email,
        name: 'デモユーザー',
        role: 'admin',
        roles: ['admin'],
        department: '営業部',
        tenantId: 'tenant-demo-001',
      };

      const accessToken = sign(
        { userId: demoUser.id, email: demoUser.email, role: demoUser.role },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      const refreshToken = sign(
        { userId: demoUser.id, type: 'refresh' },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY * 7 } // 7 days
      );

      // Set demo session cookie
      cookieStore.set('demo_session', JSON.stringify(demoUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: TOKEN_EXPIRY,
      });

      // Set user role cookie for middleware
      cookieStore.set('user_role', demoUser.role, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: TOKEN_EXPIRY,
      });

      return NextResponse.json({
        success: true,
        data: {
          user: demoUser,
          accessToken,
          refreshToken,
          expiresIn: TOKEN_EXPIRY,
        },
        mode: 'demo',
      });
    }

    // 本番モード: Prismaでユーザーを検索
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // パスワードの検証（passwordHashがある場合）
    if (user.passwordHash) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'メールアドレスまたはパスワードが正しくありません' },
          { status: 401 }
        );
      }
    }

    // JWTトークン生成
    const accessToken = sign(
      { userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    const refreshToken = sign(
      { userId: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY * 7 }
    );

    const cookieStore = await cookies();

    // Set auth cookies
    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: TOKEN_EXPIRY,
    });

    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: TOKEN_EXPIRY * 7,
    });

    cookieStore.set('user_role', user.role || 'employee', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: TOKEN_EXPIRY,
    });

    return NextResponse.json({
      success: true,
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
        accessToken,
        refreshToken,
        expiresIn: TOKEN_EXPIRY,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'ログインに失敗しました' },
      { status: 500 }
    );
  }
}
