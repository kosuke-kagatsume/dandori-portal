import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Authにユーザーを作成するAPI
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Role Key exists:', !!serviceRoleKey);

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    // Service Role Keyでadminクライアントを作成
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ユーザーを作成（自動確認）
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // メール確認をスキップ
      user_metadata: {
        name,
        role: role || 'admin',
        roles: [role || 'admin'],
        tenantId: tenantId || null,
      },
    });

    if (error) {
      console.error('Failed to create user:', error);

      // 既存ユーザーの場合
      if (error.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に登録されています' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'ユーザー作成に失敗しました' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
        role: role || 'admin',
        tenantId,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
