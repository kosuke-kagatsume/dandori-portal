import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // トークン検証（環境変数がない場合はハードコードされたトークンを使用）
    const token = process.env.DEMO_LOGIN_TOKEN || '2b723ccc348073981432fcc0741efcd05c50915144d7d144e16e3cf384a85134';
    const authz = req.headers.get('authorization') || '';
    
    console.log('Demo login API called');
    console.log('Token from env:', !!process.env.DEMO_LOGIN_TOKEN);
    console.log('Using token:', token.substring(0, 20) + '...');
    console.log('Auth header:', authz.substring(0, 20) + '...');
    
    if (authz !== `Bearer ${token}`) {
      console.log('Token validation failed');
      console.log('Expected:', `Bearer ${token.substring(0, 20)}...`);
      console.log('Received:', authz.substring(0, 20) + '...');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // リクエストボディ取得
    const body = await req.json().catch(() => ({}));
    const email = body.email ?? 'demo@dandori.local';
    const password = body.password ?? 'demo-demo-demo';

    // Supabaseクライアント作成
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
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

    // Service Roleクライアントで管理者操作（Supabaseが利用可能な場合のみ）
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (serviceRoleKey && serviceRoleKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_service_key_replace_with_real_key' && supabaseUrl) {
      // 1) ユーザーの存在確認
      const adminRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
        {
          method: 'GET',
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        }
      );
      
      if (adminRes.ok) {
        const { users } = await adminRes.json();
        const exists = (users ?? []).some((u: any) => u.email === email);
        
        // 2) 存在しなければ作成
        if (!exists) {
          const createRes = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                  name: 'デモユーザー',
                  role: 'demo',
                },
              }),
            }
          );
          
          if (!createRes.ok) {
            console.error('Failed to create demo user:', await createRes.text());
          }
        }
      }
    }

    // Supabaseが使用可能な場合は認証を試行、そうでなければデモモード
    let userData = null;
    let authError = null;
    
    try {
      // 3) パスワードでログイン
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // デモユーザーが存在しない場合は作成を試みる
        if (error.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: 'デモユーザー',
                role: 'demo',
              },
            },
          });
          
          if (!signUpError) {
            // サインアップ後、再度ログイン
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            
            if (!retryError) {
              userData = retryData.user;
            } else {
              authError = retryError;
            }
          } else {
            authError = signUpError;
          }
        } else {
          authError = error;
        }
      } else {
        userData = data.user;
      }
    } catch (networkError) {
      // Supabase接続エラー（DNS解決失敗など）の場合はデモモードにフォールバック
      console.warn('Supabase connection failed, falling back to demo mode:', networkError);
      authError = { message: 'network_error' };
    }

    // Supabase認証が成功した場合
    if (userData) {
      return NextResponse.json({ 
        ok: true, 
        user: userData,
        message: 'Successfully logged in as demo user via Supabase' 
      });
    }

    // Supabase認証が失敗した場合、デモモードで応答
    if (authError) {
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

      return NextResponse.json({ 
        ok: true, 
        user: demoUser,
        message: 'Successfully logged in as demo user (fallback mode)',
        mode: 'demo_fallback'
      });
    }
    
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
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