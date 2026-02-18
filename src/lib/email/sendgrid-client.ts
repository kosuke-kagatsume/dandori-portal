import sgMail from '@sendgrid/mail';

// SendGrid API Key設定
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export { sgMail };
