import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/send-email';
import { getPasswordResetEmail } from '@/lib/email/templates/password-reset';
import {
  generatePasswordResetToken,
  getPasswordResetExpiry,
  buildPasswordResetUrl,
  PASSWORD_RESET_EXPIRY_MINUTES,
} from './password-reset-token';

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

interface SendPasswordResetParams {
  userId: string;
  triggeredBy: 'admin' | 'self';
  locale?: string;
}

interface SendPasswordResetResult {
  emailSent: boolean;
  rateLimited: boolean;
  notFound: boolean;
  error?: string;
}

export async function sendPasswordResetEmail(
  params: SendPasswordResetParams
): Promise<SendPasswordResetResult> {
  const { userId, triggeredBy, locale = 'ja' } = params;

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      tenantId: true,
      passwordResetTokenExpiry: true,
      tenants: { select: { subdomain: true, name: true } },
    },
  });

  if (!user || user.status === 'retired' || user.status === 'inactive') {
    return { emailSent: false, rateLimited: false, notFound: true };
  }

  if (user.passwordResetTokenExpiry) {
    const issuedAt = user.passwordResetTokenExpiry.getTime() - PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000;
    if (Date.now() - issuedAt < RATE_LIMIT_WINDOW_MS) {
      return { emailSent: false, rateLimited: true, notFound: false };
    }
  }

  const { rawToken, tokenHash } = generatePasswordResetToken();
  const expiry = getPasswordResetExpiry();

  await prisma.users.update({
    where: { id: user.id },
    data: {
      passwordResetToken: tokenHash,
      passwordResetTokenExpiry: expiry,
      updatedAt: new Date(),
    },
  });

  const subdomain = user.tenants?.subdomain;
  const baseUrl = subdomain
    ? `https://${subdomain}.dandori-portal.com`
    : process.env.NEXT_PUBLIC_APP_URL || 'https://dandori-portal.com';
  const resetUrl = buildPasswordResetUrl(baseUrl, locale, rawToken);

  const emailContent = getPasswordResetEmail({
    userName: user.name || user.email,
    email: user.email,
    resetUrl,
    expiresInMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
    triggeredBy,
  });

  const emailResult = await sendEmail({
    to: user.email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });

  if (!emailResult.success) {
    console.warn(`[PasswordReset] Email send failed for ${user.email}:`, emailResult.error);
    return { emailSent: false, rateLimited: false, notFound: false, error: emailResult.error };
  }

  return { emailSent: true, rateLimited: false, notFound: false };
}

export async function findUserByEmailForReset(email: string) {
  return prisma.users.findFirst({
    where: { email },
    select: { id: true, status: true, tenantId: true },
  });
}
