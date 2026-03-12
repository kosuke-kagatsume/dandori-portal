import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withDWAdminAuth } from '@/lib/auth/api-auth';
import { createSuccessResponse, handleError, notFoundError, badRequestError } from '@/lib/api/response';
import { sendEmail, getTenantWelcomeEmail } from '@/lib/email';

const prisma = new PrismaClient();

/**
 * DW管理 - テナントオーナーへ招待メール再送API
 * POST /api/dw-admin/tenants/[id]/resend-invite
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await withDWAdminAuth();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const { id: tenantId } = await params;

    // テナント取得
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return notFoundError('テナント');
    }

    // テナントのオーナー（最初のadminユーザー）を取得
    const owner = await prisma.users.findFirst({
      where: {
        tenantId,
        role: 'admin',
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!owner) {
      return badRequestError('このテナントにはオーナーが設定されていません');
    }

    // 仮パスワードを生成してリセット
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let tempPassword = '';
    for (let i = 0; i < 12; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // bcryptでハッシュ化
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // ユーザーのパスワードを更新（初回ログインでリセット必須）
    await prisma.users.update({
      where: { id: owner.id },
      data: {
        passwordHash,
        passwordResetRequired: true,
        invitedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 招待メール送信
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dandori-portal.com';
    const loginUrl = `${baseUrl}/ja/auth/login`;

    const emailContent = getTenantWelcomeEmail({
      tenantName: tenant.name,
      ownerName: owner.name,
      email: owner.email,
      password: tempPassword,
      loginUrl,
    });

    const emailResult = await sendEmail({
      to: owner.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!emailResult.success) {
      return badRequestError(`招待メールの送信に失敗しました: ${emailResult.error || '不明なエラー'}`);
    }

    return createSuccessResponse(
      {
        tenantId,
        tenantName: tenant.name,
        ownerEmail: owner.email,
        ownerName: owner.name,
      },
      { message: `${owner.email} へ招待メールを再送しました` }
    );
  } catch (error) {
    return handleError(error, '招待メールの再送');
  }
}
