interface TenantWelcomeEmailParams {
  tenantName: string;
  ownerName: string;
  email: string;
  password: string;
  loginUrl: string;
}

export function getTenantWelcomeEmail(params: TenantWelcomeEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { tenantName, ownerName, email, password, loginUrl } = params;

  const subject = `【Dandori Portal】${tenantName} への招待`;

  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 16px;
      color: #1f2937;
    }
    .credentials {
      background-color: #f3f4f6;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .credentials p {
      margin: 8px 0;
    }
    .credentials strong {
      color: #374151;
    }
    .credentials code {
      background-color: #e5e7eb;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 24px 0;
      border-radius: 0 8px 8px 0;
    }
    .warning p {
      margin: 0;
      color: #92400e;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      margin: 16px 0;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Dandori Portal</div>
    </div>

    <h1>${ownerName} 様</h1>

    <p>
      ${tenantName} のDandori Portalへようこそ。<br>
      テナント管理者としてアカウントが作成されました。
    </p>

    <div class="credentials">
      <p><strong>メールアドレス:</strong> <code>${email}</code></p>
      <p><strong>初期パスワード:</strong> <code>${password}</code></p>
    </div>

    <div class="warning">
      <p>⚠️ セキュリティのため、初回ログイン時にパスワードの変更が必要です。</p>
    </div>

    <p style="text-align: center;">
      <a href="${loginUrl}" class="button">ログインする</a>
    </p>

    <p>
      上のボタンが機能しない場合は、以下のURLをブラウザに直接入力してください：<br>
      <a href="${loginUrl}">${loginUrl}</a>
    </p>

    <div class="footer">
      <p>このメールは自動送信されています。</p>
      <p>© ${new Date().getFullYear()} Dandori Portal. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
${ownerName} 様

${tenantName} のDandori Portalへようこそ。
テナント管理者としてアカウントが作成されました。

■ ログイン情報
メールアドレス: ${email}
初期パスワード: ${password}

■ 重要
セキュリティのため、初回ログイン時にパスワードの変更が必要です。

■ ログインURL
${loginUrl}

---
このメールは自動送信されています。
© ${new Date().getFullYear()} Dandori Portal. All rights reserved.
  `.trim();

  return { subject, html, text };
}
