import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// DW管理者認証情報（環境変数から取得）
// 本番環境ではAWS Secrets Manager等を使用すべき
// デフォルトパスワード: "DwAdmin2025!" (開発・緊急用のみ)
const DEFAULT_PASSWORD_HASH = '$2b$10$cYqBgoWXcW763BOTj5olDuVsqzxKOXY3fqaf.LvGirObCAndm2.1G';

const DW_ADMIN_CREDENTIALS = [
  {
    email: process.env.DW_ADMIN_EMAIL_1 || 'admin@dw-inc.co.jp',
    passwordHash: process.env.DW_ADMIN_PASSWORD_HASH_1 || DEFAULT_PASSWORD_HASH,
  },
  {
    email: process.env.DW_ADMIN_EMAIL_2 || 'super@dw-inc.co.jp',
    passwordHash: process.env.DW_ADMIN_PASSWORD_HASH_2 || DEFAULT_PASSWORD_HASH,
  },
];

// 起動時に環境変数の状態をログ出力（デバッグ用）
if (typeof window === 'undefined') {
  console.log('[DW Admin Auth] Environment check:', {
    hasEmail1: !!process.env.DW_ADMIN_EMAIL_1,
    hasHash1: !!process.env.DW_ADMIN_PASSWORD_HASH_1,
    hasEmail2: !!process.env.DW_ADMIN_EMAIL_2,
    hasHash2: !!process.env.DW_ADMIN_PASSWORD_HASH_2,
    hasJwtSecret: !!process.env.DW_ADMIN_JWT_SECRET,
  });
}

// JWT署名用シークレット
const JWT_SECRET = new TextEncoder().encode(
  process.env.DW_ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'dw-admin-secret-key-change-in-production'
);

/**
 * DW管理者ログインAPI
 * POST /api/dw-admin/auth/login
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // バリデーション
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'メールアドレスとパスワードは必須です' },
        { status: 400 }
      );
    }

    // DW管理者を検索
    const admin = DW_ADMIN_CREDENTIALS.find((a) => a.email === email);

    if (!admin) {
      // セキュリティ: ユーザーが存在するかどうかを漏らさない
      console.log('[DW Admin Auth] Login attempt with unknown email:', email);
      return NextResponse.json(
        { success: false, error: '認証情報が正しくありません' },
        { status: 401 }
      );
    }

    // パスワード検証
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

    if (!isValidPassword) {
      console.log('[DW Admin Auth] Login attempt with wrong password:', email);
      return NextResponse.json(
        { success: false, error: '認証情報が正しくありません' },
        { status: 401 }
      );
    }

    // JWTトークンを生成
    const token = await new SignJWT({
      email: admin.email,
      role: 'dw_admin',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h') // 8時間有効
      .sign(JWT_SECRET);

    console.log('[DW Admin Auth] Login successful:', email);

    // レスポンスを作成
    const response = NextResponse.json({
      success: true,
      message: 'ログインしました',
    });

    // Cookieを設定
    response.cookies.set('dw_access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // CSRF対策: strictに設定
      path: '/dw-admin',
      maxAge: 8 * 60 * 60, // 8時間
    });

    response.cookies.set('dw_user_email', email, {
      httpOnly: false, // クライアントサイドで読み取り可能
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/dw-admin',
      maxAge: 8 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('[DW Admin Auth] Login error:', error);
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
