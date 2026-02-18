import { sgMail } from './sendgrid-client';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!fromEmail) {
    console.warn('[Email] SENDGRID_FROM_EMAIL is not configured. Skipping email send.');
    return;
  }

  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[Email] SENDGRID_API_KEY is not configured. Skipping email send.');
    return;
  }

  try {
    await sgMail.send({
      to: options.to,
      from: fromEmail,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log(`[Email] Successfully sent email to ${options.to}`);
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    throw error;
  }
}
