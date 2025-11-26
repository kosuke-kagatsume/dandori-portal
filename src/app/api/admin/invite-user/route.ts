import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * ユーザー招待API
 * テナント管理者がメンバーを招待する際に使用
 * Supabase Authの招待メール機能を利用
 */
export async function POST(request: NextRequest) {
  try {
    const { email, name, role, tenantId, tenantName, redirectUrl } = await request.json();

    // バリデーション
    if (!email || !name) {
      return NextResponse.json(
        { error: 'メールアドレスと氏名は必須です' },
        { status: 400 }
      );
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Supabase configuration missing');
      return NextResponse.json(
        { error: 'サーバー設定エラー' },
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

    // 招待メールを送信
    // Supabaseは自動的にパスワード設定リンク付きのメールを送信
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        name,
        role: role || 'user',
        roles: [role || 'user'],
        tenantId: tenantId || null,
        tenantName: tenantName || null,
        invited: true,
        invitedAt: new Date().toISOString(),
      },
      redirectTo: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://dandori-portal.com'}/auth/callback`,
    });

    if (error) {
      console.error('Failed to invite user:', error);

      // 既存ユーザーの場合
      if (error.message.includes('already been registered') || error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に登録されています' },
          { status: 400 }
        );
      }

      // レート制限の場合
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: '招待メールの送信制限に達しました。しばらく待ってから再試行してください。' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: error.message || '招待メールの送信に失敗しました' },
        { status: 400 }
      );
    }

    console.log('User invited successfully:', email);

    return NextResponse.json({
      success: true,
      message: '招待メールを送信しました',
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
        role: role || 'user',
        tenantId,
        invitedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Invite user error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
