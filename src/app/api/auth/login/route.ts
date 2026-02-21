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
    // デバッグ：リクエストボディの生テキストを取得
    const rawText = await request.text();
    console.log('Login request raw body length:', rawText.length);
    console.log('Login request raw body (first 100 chars):', rawText.substring(0, 100));

    // JSONパース
    let body;
    try {
      body = JSON.parse(rawText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw body causing error:', rawText);
      return NextResponse.json(
        {
          success: false,
          error: 'リクエストの形式が正しくありません',
          ...(process.env.NODE_ENV === 'development' && { debug: String(parseError) }),
        },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'メールアドレスとパスワードを入力してください' },
        { status: 400 }
      );
    }

    // Prismaでユーザーを検索（テナント情報も取得）
    console.log('Searching for user with email:', email);
    const user = await prisma.users.findFirst({
      where: { email },
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

    console.log('User found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('User ID:', user.id);
      console.log('User has passwordHash:', user.passwordHash ? 'YES' : 'NO');
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // パスワードの検証（passwordHashがある場合）
    if (user.passwordHash) {
      console.log('Comparing password with hash...');
      const isValid = await bcrypt.compare(password, user.passwordHash);
      console.log('Password valid:', isValid ? 'YES' : 'NO');
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'メールアドレスまたはパスワードが正しくありません' },
          { status: 401 }
        );
      }
    } else {
      console.log('No passwordHash set for user, allowing login');
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
          passwordResetRequired: user.passwordResetRequired,
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
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'ログインに失敗しました',
        ...(process.env.NODE_ENV === 'development' && { debug: errorMessage }),
      },
      { status: 500 }
    );
  }
}
