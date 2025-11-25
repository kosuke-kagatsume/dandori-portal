/**
 * Supabase Storage ヘルパー関数
 * ファイルアップロード・ダウンロード・削除機能
 */

import { createClient } from '@/lib/supabase/client';

/**
 * ファイルをアップロード
 */
export async function uploadFile(
  bucket: string,
  file: File,
  path?: string
): Promise<{ data: { path: string } | null; error: string | null }> {
  try {
    const supabase = createClient();

    // ファイル名をユニークにする
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = file.name.split('.').pop();
    const fileName = path || `${timestamp}_${randomString}.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Upload file error:', err);
    return { data: null, error: err instanceof Error ? err.message : 'アップロードに失敗しました' };
  }
}

/**
 * ファイルを削除
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Supabase Storage delete error:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    console.error('Delete file error:', err);
    return { error: err instanceof Error ? err.message : 'ファイル削除に失敗しました' };
  }
}

/**
 * ファイルの公開URLを取得
 */
export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createClient();

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
}

/**
 * ファイルをダウンロード
 */
export async function downloadFile(
  bucket: string,
  path: string
): Promise<{ data: Blob | null; error: string | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error) {
      console.error('Supabase Storage download error:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Download file error:', err);
    return { data: null, error: err instanceof Error ? err.message : 'ダウンロードに失敗しました' };
  }
}

/**
 * バケット内のファイル一覧を取得
 */
export async function listFiles(
  bucket: string,
  path?: string
): Promise<{ data: any[] | null; error: string | null }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('Supabase Storage list error:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('List files error:', err);
    return { data: null, error: err instanceof Error ? err.message : 'ファイル一覧取得に失敗しました' };
  }
}
