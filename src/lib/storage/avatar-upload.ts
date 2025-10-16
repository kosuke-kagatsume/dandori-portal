import { createClient } from '@/lib/supabase/client';

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
 * プロフィール画像をSupabase Storageにアップロード
 */
export async function uploadAvatar({
  userId,
  file,
}: UploadAvatarOptions): Promise<UploadAvatarResult> {
  try {
    const supabase = createClient();

    // ファイル名を生成（ユーザーIDとタイムスタンプ）
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${timestamp}.${fileExt}`;

    // アップロード
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Avatar upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return {
      success: true,
      url: publicUrl,
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
 * 既存のプロフィール画像を削除
 */
export async function deleteAvatar(avatarUrl: string): Promise<boolean> {
  try {
    const supabase = createClient();

    // URLからファイルパスを抽出
    const url = new URL(avatarUrl);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts.slice(-2).join('/'); // userId/timestamp.ext

    const { error } = await supabase.storage
      .from('avatars')
      .remove([fileName]);

    if (error) {
      console.error('Avatar delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Avatar delete exception:', error);
    return false;
  }
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
