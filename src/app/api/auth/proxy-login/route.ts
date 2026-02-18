import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sign } from 'jsonwebtoken';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 代理ログイントークン用シークレット
const PROXY_LOGIN_SECRET = new TextEncoder().encode(
  process.env.PROXY_LOGIN_SECRET || process.env.JWT_SECRET || 'proxy-login-secret-key-change-in-production'
);

// テナントユーザー用JWT設定
const JWT_SECRET = process.env.JWT_SECRET || 'dandori-portal-secret-key-change-in-production';
const TOKEN_EXPIRY = 60 * 60 * 24; // 24 hours in seconds

/**
 * 代理ログイントークン検証＋セッション作成API
 * POST /api/auth/proxy-login
 *
 * 代理ログイントークンを検証し、テナントユーザーのセッションを作成
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'トークンが必要です' },
        { status: 400 }
      );
    }

    // 代理ログイントークンを検証
    let payload;
    try {
      const verified = await jwtVerify(token, PROXY_LOGIN_SECRET);
      payload = verified.payload as {
        type: string;
        tenantId: string;
        userId: string;
        userEmail: string;
        dwAdminEmail: string;
      };
    } catch {
      return NextResponse.json(
        { success: false, error: 'トークンが無効または期限切れです' },
        { status: 401 }
      );
    }

    // トークンタイプの確認
    if (payload.type !== 'proxy_login') {
      return NextResponse.json(
        { success: false, error: '無効なトークンタイプです' },
        { status: 401 }
      );
    }

    // ユーザー情報を取得
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
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

    // テナントIDの確認
    if (user.tenantId !== payload.tenantId) {
      return NextResponse.json(
        { success: false, error: 'テナント情報が一致しません' },
        { status: 401 }
      );
    }

    // JWTトークン生成
    const accessToken = sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        isProxyLogin: true,
        proxyBy: payload.dwAdminEmail,
      },
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

    // 代理ログイン情報をCookieに保存（表示用）
    cookieStore.set('proxy_login', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: TOKEN_EXPIRY,
    });

    // 監査ログを記録
    console.log('[Proxy Login] Session created', {
      dwAdminEmail: payload.dwAdminEmail,
      targetUserId: user.id,
      targetUserEmail: user.email,
      tenantId: user.tenantId,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
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
        tenant: user.tenants ? {
          id: user.tenants.id,
          name: user.tenants.name,
          timezone: user.tenants.timezone,
          closingDay: user.tenants.closingDay,
          weekStartDay: user.tenants.weekStartDay,
        } : null,
        accessToken,
        refreshToken,
        expiresIn: TOKEN_EXPIRY,
        isProxyLogin: true,
        proxyBy: payload.dwAdminEmail,
      },
    });
  } catch (error) {
    console.error('[Proxy Login] Error creating session:', error);
    return NextResponse.json(
      {
        success: false,
        error: '代理ログインに失敗しました',
        details: process.env.NODE_ENV === 'development'
          ? error instanceof Error ? error.message : String(error)
          : undefined,
      },
      { status: 500 }
    );
  }
}
