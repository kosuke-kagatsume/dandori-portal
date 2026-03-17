import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { withAuth } from '@/lib/auth/api-auth';
import { sendEmail } from '@/lib/email/send-email';
import { getUserInviteEmail } from '@/lib/email/templates/user-invite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ランダムパスワード生成（12文字）
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * ユーザー招待API
 * テナント管理者がメンバーを招待する際に使用
 * ユーザー作成 + 初期パスワード設定 + 招待メール送信
 */
export async function POST(request: NextRequest) {
  // 認証チェック（adminまたはhr権限が必要）
  const { auth, errorResponse } = await withAuth(request, ['admin', 'hr']);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();
    const {
      email,
      name,
      role,
      roles,
      department,
      position,
      employeeNumber,
      employmentType,
      hireDate,
      tenantId: requestedTenantId,
    } = body;

    // 認証ユーザーのテナントIDを使用（リクエストのtenantIdより優先）
    const tenantId = auth.user?.tenantId || requestedTenantId;

    // バリデーション
    if (!email || !name) {
      return NextResponse.json(
        { error: 'メールアドレスと氏名は必須です' },
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'テナントIDを取得できません' },
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

    // 既存ユーザーチェック
    const existingUser = await prisma.users.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      );
    }

    // パスワード生成 + ハッシュ化
    const tempPassword = generatePassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // テナント名取得（メールに使用）
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
      select: { name: true, subdomain: true },
    });

    const tenantName = tenant?.name || 'Dandori Portal';

    // ユーザーロール決定
    const userRole = role || 'employee';
    const userRoles = roles || [userRole];

    // ユーザーを作成
    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email,
        name,
        role: userRole,
        roles: userRoles,
        tenantId,
        status: 'active',
        passwordHash,
        passwordResetRequired: true,
        employeeNumber: employeeNumber || undefined,
        department: department || undefined,
        position: position || undefined,
        employmentType: employmentType || undefined,
        hireDate: hireDate ? new Date(hireDate) : undefined,
        invitedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 招待メール送信
    const loginUrl = `https://dandori-portal.com/ja/auth/login`;
    const emailContent = getUserInviteEmail({
      tenantName,
      userName: name,
      email,
      password: tempPassword,
      loginUrl,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!emailResult.success) {
      console.warn(`[Invite] Email sending failed for ${email}:`, emailResult.error);
    }

    return NextResponse.json({
      success: true,
      message: emailResult.success ? '招待メールを送信しました' : 'ユーザーを作成しました（メール送信失敗）',
      emailSent: emailResult.success,
      user: {
        id: user.id,
        email: user.email,
        name,
        role: userRole,
        tenantId,
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
