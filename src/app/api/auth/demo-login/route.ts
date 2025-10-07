import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    console.log('Demo login request received');

    // デモモードかSupabase接続可能かチェック
    const isDemoMode = process.env.DEMO_MODE === 'true' ||
                      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // リクエストボディ取得
    const body = await req.json().catch(() => ({}));
    const email = body.email ?? 'demo@dandori.local';
    const password = body.password ?? 'demo-demo-demo';

    console.log('Demo mode:', isDemoMode);

    // デモモードの場合は直接デモユーザーを作成
    if (isDemoMode) {
      console.log('Running in demo mode, creating demo user');

      const cookieStore = await cookies();

      // デモユーザー情報を作成
      const demoUser = {
        id: 'demo-user-' + Date.now(),
        email: email,
        user_metadata: {
          name: 'デモユーザー',
          role: 'demo',
          department: '営業部',
        },
        created_at: new Date().toISOString(),
      };

      // デモセッションCookieを設定
      cookieStore.set('demo_session', JSON.stringify(demoUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24時間
      });

      console.log('Demo user created successfully');

      return NextResponse.json({
        ok: true,
        user: demoUser,
        message: 'Successfully logged in as demo user',
        mode: 'demo'
      });
    }

    // Supabaseが利用可能な場合の処理
    const { createServerClient } = await import('@supabase/ssr');
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component errors can be ignored
            }
          },
        },
      }
    );

    // Supabase認証を試行
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // 認証失敗時はデモモードにフォールバック
      console.warn('Supabase auth failed, falling back to demo mode:', error.message);

      const demoUser = {
        id: 'demo-user-' + Date.now(),
        email: email,
        user_metadata: {
          name: 'デモユーザー',
          role: 'demo',
          department: '営業部',
        },
        created_at: new Date().toISOString(),
      };

      cookieStore.set('demo_session', JSON.stringify(demoUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
      });

      return NextResponse.json({
        ok: true,
        user: demoUser,
        message: 'Successfully logged in as demo user (fallback mode)',
        mode: 'demo_fallback'
      });
    }

    // Supabase認証成功
    return NextResponse.json({
      ok: true,
      user: data.user,
      message: 'Successfully logged in via Supabase',
      mode: 'supabase'
    });

  } catch (error) {
    console.error('Demo login error:', error);

    // エラー時もデモモードにフォールバック
    try {
      const cookieStore = await cookies();
      const demoUser = {
        id: 'demo-user-' + Date.now(),
        email: 'demo@dandori.local',
        user_metadata: {
          name: 'デモユーザー',
          role: 'demo',
          department: '営業部',
        },
        created_at: new Date().toISOString(),
      };

      cookieStore.set('demo_session', JSON.stringify(demoUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
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