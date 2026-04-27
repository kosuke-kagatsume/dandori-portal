import crypto from 'crypto';

const TOKEN_BYTES = 32;
export const PASSWORD_RESET_EXPIRY_MINUTES = 60;

export function generatePasswordResetToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const tokenHash = hashPasswordResetToken(rawToken);
  return { rawToken, tokenHash };
}

export function hashPasswordResetToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function getPasswordResetExpiry(): Date {
  return new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);
}

export function buildPasswordResetUrl(baseUrl: string, locale: string, rawToken: string): string {
  const trimmed = baseUrl.replace(/\/$/, '');
  return `${trimmed}/${locale}/auth/reset-password?token=${rawToken}`;
}
