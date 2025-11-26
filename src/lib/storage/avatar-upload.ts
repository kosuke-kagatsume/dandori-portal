/**
 * アバターアップロード
 * プロフィール画像をAWS S3にアップロード
 */

import { uploadToS3, deleteFromS3, getPublicUrl } from './s3-client';

export interface UploadAvatarOptions {
  userId: string;
  file: File;
}

export interface UploadAvatarResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * プロフィール画像をS3にアップロード
 */
export async function uploadAvatar({
  userId,
  file,
}: UploadAvatarOptions): Promise<UploadAvatarResult> {
  try {
    // ファイル名を生成（ユーザーIDとタイムスタンプ）
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const key = `avatars/${userId}/${timestamp}.${fileExt}`;

    // FileをBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToS3(buffer, key, file.type);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      url: result.url,
    };
  } catch (error) {
    console.error('Avatar upload exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 既存のプロフィール画像をS3から削除
 */
export async function deleteAvatar(avatarUrl: string): Promise<boolean> {
  try {
    // URLからキーを抽出
    const url = new URL(avatarUrl);
    const key = url.pathname.slice(1); // 先頭の "/" を除去

    const result = await deleteFromS3(key);

    return result.success;
  } catch (error) {
    console.error('Avatar delete exception:', error);
    return false;
  }
}

/**
 * アバターの公開URLを取得
 */
export function getAvatarUrl(userId: string, filename: string): string {
  return getPublicUrl(`avatars/${userId}/${filename}`);
}

/**
 * 画像ファイルのバリデーション
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // ファイルサイズチェック（5MB以下）
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'ファイルサイズは5MB以下にしてください',
    };
  }

  // ファイルタイプチェック
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '画像ファイル（JPEG, PNG, WebP, GIF）のみアップロード可能です',
    };
  }

  return { valid: true };
}
