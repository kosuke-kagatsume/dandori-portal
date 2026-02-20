interface OnboardingInvitationEmailParams {
  applicantName: string;
  companyName: string;
  hireDate: string;
  department: string;
  position: string;
  deadline: string;
  accessUrl: string;
}

export function getOnboardingInvitationEmail(params: OnboardingInvitationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { applicantName, companyName, hireDate, department, position, deadline, accessUrl } = params;

  const subject = `【${companyName}】入社手続きのご案内`;

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
    .info-box {
      background-color: #f3f4f6;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .info-box h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: #374151;
    }
    .info-box p {
      margin: 8px 0;
    }
    .info-box strong {
      color: #374151;
    }
    .deadline-warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 24px 0;
      border-radius: 0 8px 8px 0;
    }
    .deadline-warning p {
      margin: 0;
      color: #92400e;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 0;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    .steps {
      margin: 24px 0;
    }
    .steps h3 {
      margin-bottom: 12px;
      color: #374151;
    }
    .steps ol {
      padding-left: 20px;
    }
    .steps li {
      margin: 8px 0;
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
      <div class="logo">${companyName}</div>
    </div>

    <h1>${applicantName} 様</h1>

    <p>
      この度は${companyName}へのご入社、誠におめでとうございます。<br>
      入社にあたり、以下の手続きをオンラインでお願いいたします。
    </p>

    <div class="info-box">
      <h3>入社情報</h3>
      <p><strong>入社予定日:</strong> ${hireDate}</p>
      <p><strong>配属部署:</strong> ${department}</p>
      <p><strong>役職:</strong> ${position}</p>
    </div>

    <div class="deadline-warning">
      <p>📅 <strong>提出期限: ${deadline}</strong></p>
      <p>期限までに全ての書類の入力・提出をお願いいたします。</p>
    </div>

    <div class="steps">
      <h3>入力いただく内容</h3>
      <ol>
        <li><strong>基本情報</strong> - 氏名、住所、緊急連絡先など</li>
        <li><strong>家族情報</strong> - 扶養家族、配偶者情報など</li>
        <li><strong>給与振込口座</strong> - 銀行口座情報</li>
        <li><strong>通勤経路</strong> - 通勤手段、経路申請</li>
      </ol>
    </div>

    <p style="text-align: center;">
      <a href="${accessUrl}" class="button">入社手続きを開始する</a>
    </p>

    <p>
      上のボタンが機能しない場合は、以下のURLをブラウザに直接入力してください：<br>
      <a href="${accessUrl}">${accessUrl}</a>
    </p>

    <p style="color: #6b7280; font-size: 14px;">
      ※ このリンクはご本人専用です。他の方と共有しないでください。<br>
      ※ ご不明な点がございましたら、人事担当までお問い合わせください。
    </p>

    <div class="footer">
      <p>このメールは自動送信されています。</p>
      <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
${applicantName} 様

この度は${companyName}へのご入社、誠におめでとうございます。
入社にあたり、以下の手続きをオンラインでお願いいたします。

■ 入社情報
入社予定日: ${hireDate}
配属部署: ${department}
役職: ${position}

■ 提出期限
${deadline}
期限までに全ての書類の入力・提出をお願いいたします。

■ 入力いただく内容
1. 基本情報 - 氏名、住所、緊急連絡先など
2. 家族情報 - 扶養家族、配偶者情報など
3. 給与振込口座 - 銀行口座情報
4. 通勤経路 - 通勤手段、経路申請

■ 入社手続きURL
${accessUrl}

※ このリンクはご本人専用です。他の方と共有しないでください。
※ ご不明な点がございましたら、人事担当までお問い合わせください。

---
このメールは自動送信されています。
© ${new Date().getFullYear()} ${companyName}. All rights reserved.
  `.trim();

  return { subject, html, text };
}
