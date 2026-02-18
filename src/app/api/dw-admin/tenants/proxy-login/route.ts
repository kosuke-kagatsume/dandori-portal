import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// JWT署名用シークレット（DW管理者用）
const DW_JWT_SECRET = new TextEncoder().encode(
  process.env.DW_ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'dw-admin-secret-key-change-in-production'
);

// 代理ログイントークン用シークレット
const PROXY_LOGIN_SECRET = new TextEncoder().encode(
  process.env.PROXY_LOGIN_SECRET || process.env.JWT_SECRET || 'proxy-login-secret-key-change-in-production'
);

// 代理ログイントークンの有効期限（15分）
const PROXY_TOKEN_EXPIRY_MINUTES = 15;

/**
 * 代理ログイントークン生成API
 * POST /api/dw-admin/tenants/proxy-login
 *
 * DW管理者がテナントに代理ログインするためのトークンを生成
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // DW管理者の認証確認
    const dwAccessToken = cookieStore.get('dw_access_token')?.value;
    const dwUserEmail = cookieStore.get('dw_user_email')?.value;

    if (!dwAccessToken || !dwUserEmail) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    // JWTトークン検証
    try {
      await jwtVerify(dwAccessToken, DW_JWT_SECRET);
    } catch {
      return NextResponse.json(
        { success: false, error: 'セッションが無効です。再ログインしてください' },
        { status: 401 }
      );
    }

    // リクエストボディ取得
    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'テナントIDが必要です' },
        { status: 400 }
      );
    }

    // テナント情報を取得
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        subdomain: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'テナントが見つかりません' },
        { status: 404 }
      );
    }

    // テナントのオーナーユーザーを取得（role = 'owner' または 'admin' の最初のユーザー）
    const ownerUser = await prisma.users.findFirst({
      where: {
        tenantId: tenantId,
        role: {
          in: ['owner', 'admin'],
        },
      },
      orderBy: [
        { role: 'asc' }, // ownerが先に来る（アルファベット順でadminより後だが、roleの定義順で最優先）
        { createdAt: 'asc' }, // 最初に作成されたユーザー
      ],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!ownerUser) {
      return NextResponse.json(
        { success: false, error: 'このテナントにはオーナーユーザーが存在しません' },
        { status: 404 }
      );
    }

    // 代理ログイントークンを生成（短命：15分）
    const proxyToken = await new SignJWT({
      type: 'proxy_login',
      tenantId: tenant.id,
      userId: ownerUser.id,
      userEmail: ownerUser.email,
      dwAdminEmail: dwUserEmail,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${PROXY_TOKEN_EXPIRY_MINUTES}m`)
      .sign(PROXY_LOGIN_SECRET);

    // 監査ログを記録
    console.log('[Proxy Login] Token generated', {
      dwAdminEmail: dwUserEmail,
      tenantId: tenant.id,
      tenantName: tenant.name,
      targetUserId: ownerUser.id,
      targetUserEmail: ownerUser.email,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    // 代理ログインURLを生成
    const proxyLoginUrl = `/ja/auth/proxy-login?token=${proxyToken}`;

    return NextResponse.json({
      success: true,
      data: {
        proxyLoginUrl,
        tenant: {
          id: tenant.id,
          name: tenant.name,
        },
        targetUser: {
          id: ownerUser.id,
          email: ownerUser.email,
          name: ownerUser.name,
          role: ownerUser.role,
        },
        expiresInMinutes: PROXY_TOKEN_EXPIRY_MINUTES,
      },
    });
  } catch (error) {
    console.error('[Proxy Login] Error generating token:', error);
    return NextResponse.json(
      {
        success: false,
        error: '代理ログイントークンの生成に失敗しました',
        details: process.env.NODE_ENV === 'development'
          ? error instanceof Error ? error.message : String(error)
          : undefined,
      },
      { status: 500 }
    );
  }
}
