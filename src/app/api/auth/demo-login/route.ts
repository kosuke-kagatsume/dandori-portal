import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    console.log('Demo login request received');

    // リクエストボディ取得
    const body = await req.json().catch(() => ({}));
    const email = body.email ?? 'demo@dandori.local';

    console.log('Creating demo user');

    const cookieStore = await cookies();

    // デモユーザー情報を作成
    const demoUser = {
      id: 'demo-user-' + Date.now(),
      email: email,
      name: 'デモユーザー',
      role: 'admin',
      roles: ['admin'],
      department: '営業部',
      tenantId: 'tenant-1',
      created_at: new Date().toISOString(),
    };

    // デモセッションCookieを設定
    cookieStore.set('demo_session', JSON.stringify(demoUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24時間
    });

    // ユーザーロールCookieも設定（middleware用）
    cookieStore.set('user_role', 'admin', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    console.log('Demo user created successfully');

    return NextResponse.json({
      ok: true,
      user: demoUser,
      message: 'Successfully logged in as demo user',
      mode: 'demo'
    });

  } catch (error) {
    console.error('Demo login error:', error);

    // エラー時もデモモードにフォールバック
    try {
      const cookieStore = await cookies();
      const demoUser = {
        id: 'demo-user-' + Date.now(),
        email: 'demo@dandori.local',
        name: 'デモユーザー',
        role: 'admin',
        roles: ['admin'],
        department: '営業部',
        tenantId: 'tenant-1',
        created_at: new Date().toISOString(),
      };

      cookieStore.set('demo_session', JSON.stringify(demoUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      return NextResponse.json({
        ok: true,
        user: demoUser,
        message: 'Successfully logged in as demo user (error fallback)',
        mode: 'demo_error_fallback'
      });
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return NextResponse.json(
        { ok: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}

// デバッグ用GETエンドポイント
export async function GET() {
  return NextResponse.json({
    message: 'Demo login endpoint is ready',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer <DEMO_LOGIN_TOKEN>',
      'Content-Type': 'application/json',
    },
    body: {
      email: 'demo@dandori.local (optional)',
      password: 'demo-demo-demo (optional)',
    },
  });
}