import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getOnboardingInvitationEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SendInvitationRequest {
  applicationId: string;
  applicantEmail: string;
  applicantName: string;
  companyName: string;
  hireDate: string;
  department: string;
  position: string;
  deadline: string;
  accessToken: string;
}

/**
 * POST /api/onboarding/send-invitation
 * 入社手続き招待メールを送信
 */
export async function POST(request: NextRequest) {
  try {
    const body: SendInvitationRequest = await request.json();

    const {
      applicationId,
      applicantEmail,
      applicantName,
      companyName,
      hireDate,
      department,
      position,
      deadline,
      accessToken,
    } = body;

    // バリデーション
    if (!applicantEmail || !applicantName || !companyName) {
      return NextResponse.json(
        { success: false, error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    // アクセスURL生成（本番環境用）
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dandori-portal.com';
    const accessUrl = `${baseUrl}/ja/onboarding?token=${accessToken}`;

    // 日付フォーマット
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    // メールテンプレート生成
    const emailContent = getOnboardingInvitationEmail({
      applicantName,
      companyName,
      hireDate: formatDate(hireDate),
      department,
      position,
      deadline: formatDate(deadline),
      accessUrl,
    });

    // メール送信
    await sendEmail({
      to: applicantEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    console.log(`[Onboarding] Invitation email sent to ${applicantEmail} for application ${applicationId}`);

    return NextResponse.json({
      success: true,
      message: '招待メールを送信しました',
      sentTo: applicantEmail,
    });
  } catch (error) {
    console.error('[Onboarding] Failed to send invitation email:', error);

    // SendGrid APIエラーの詳細をログ
    if (error instanceof Error) {
      console.error('[Onboarding] Error details:', error.message);
    }

    return NextResponse.json(
      {
        success: false,
        error: '招待メールの送信に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
