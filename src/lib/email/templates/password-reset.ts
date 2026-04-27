interface PasswordResetEmailParams {
  userName: string;
  email: string;
  resetUrl: string;
  expiresInMinutes: number;
  triggeredBy?: 'admin' | 'self';
}

export function getPasswordResetEmail(params: PasswordResetEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { userName, email, resetUrl, expiresInMinutes, triggeredBy = 'self' } = params;

  const subject = '【Dandori Portal】パスワード再設定のご案内';

  const lead =
    triggeredBy === 'admin'
      ? '管理者によりパスワードの再設定が要求されました。'
      : 'パスワード再設定のリクエストを受け付けました。';

  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
    .container { background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
    h1 { font-size: 24px; margin-bottom: 16px; color: #1f2937; }
    .info { background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .info p { margin: 8px 0; }
    .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .warning p { margin: 0; color: #92400e; }
    .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 16px 0; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
    code { background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><div class="logo">Dandori Portal</div></div>

    <h1>${userName} 様</h1>

    <p>${lead}</p>

    <div class="info">
      <p><strong>対象アカウント:</strong> <code>${email}</code></p>
      <p><strong>有効期限:</strong> 発行から ${expiresInMinutes} 分以内</p>
    </div>

    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">パスワードを再設定する</a>
    </p>

    <p>
      上のボタンが機能しない場合は、以下のURLをブラウザに直接入力してください：<br>
      <a href="${resetUrl}">${resetUrl}</a>
    </p>

    <div class="warning">
      <p>⚠️ このリクエストに心当たりがない場合は、本メールを破棄してください。リンクは有効期限が過ぎると自動的に無効になります。</p>
    </div>

    <div class="footer">
      <p>このメールは自動送信されています。</p>
      <p>© ${new Date().getFullYear()} Dandori Portal. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
${userName} 様

${lead}

■ 対象アカウント
${email}

■ パスワード再設定URL（${expiresInMinutes}分以内に開いてください）
${resetUrl}

このリクエストに心当たりがない場合は、本メールを破棄してください。
リンクは有効期限が過ぎると自動的に無効になります。

---
このメールは自動送信されています。
© ${new Date().getFullYear()} Dandori Portal. All rights reserved.
  `.trim();

  return { subject, html, text };
}
