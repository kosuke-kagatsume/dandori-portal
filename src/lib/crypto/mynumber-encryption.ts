/**
 * マイナンバー暗号化モジュール
 * AES-256-GCM による暗号化・復号
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended IV length
const TAG_LENGTH = 16;

interface EncryptResult {
  encrypted: string; // base64
  iv: string;        // base64
  tag: string;       // base64
}

function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.MYNUMBER_ENCRYPTION_KEY;
  if (!keyBase64) {
    throw new Error('MYNUMBER_ENCRYPTION_KEY is not configured');
  }
  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) {
    throw new Error('MYNUMBER_ENCRYPTION_KEY must be 32 bytes (256 bits)');
  }
  return key;
}

/**
 * マイナンバーを AES-256-GCM で暗号化
 */
export function encryptMyNumber(plaintext: string): EncryptResult {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

/**
 * AES-256-GCM で暗号化されたマイナンバーを復号
 */
export function decryptMyNumber(encrypted: string, iv: string, tag: string): string {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'base64'),
    { authTagLength: TAG_LENGTH }
  );
  decipher.setAuthTag(Buffer.from(tag, 'base64'));

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * マイナンバーのチェックディジット検証（番号法施行令 第8条）
 * 12桁目がチェックディジット
 */
export function validateMyNumberCheckDigit(myNumber: string): boolean {
  if (!/^\d{12}$/.test(myNumber)) return false;

  const digits = myNumber.split('').map(Number);
  const weights = [6, 7, 8, 9, 10, 5, 4, 3, 2, 7, 6]; // Q1~Q11の重み

  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += digits[i] * weights[i];
  }

  const remainder = sum % 11;
  const checkDigit = remainder <= 1 ? 0 : 11 - remainder;

  return digits[11] === checkDigit;
}

/**
 * マイナンバーのバリデーション（12桁数字 + チェックディジット）
 */
export function validateMyNumber(myNumber: string): { valid: boolean; error?: string } {
  if (!/^\d{12}$/.test(myNumber)) {
    return { valid: false, error: 'マイナンバーは12桁の数字で入力してください' };
  }
  if (!validateMyNumberCheckDigit(myNumber)) {
    return { valid: false, error: 'マイナンバーのチェックディジットが不正です' };
  }
  return { valid: true };
}
