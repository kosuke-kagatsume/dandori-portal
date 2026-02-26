import { sgMail } from './sendgrid-client';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!fromEmail) {
    const error = 'SENDGRID_FROM_EMAIL is not configured';
    console.warn(`[Email] ${error}. Skipping email send.`);
    return { success: false, error };
  }

  if (!process.env.SENDGRID_API_KEY) {
    const error = 'SENDGRID_API_KEY is not configured';
    console.warn(`[Email] ${error}. Skipping email send.`);
    return { success: false, error };
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
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Email] Failed to send email:', error);
    return { success: false, error: errorMessage };
  }
}
