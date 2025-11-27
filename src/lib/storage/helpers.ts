/**
 * ストレージヘルパー関数
 * AWS S3を使用したファイルアップロード・ダウンロード・削除機能
 */

import { uploadToS3, deleteFromS3, downloadFromS3, listS3Files, getPublicUrl as getS3PublicUrl } from '@/lib/storage/s3-client';

/**
 * ファイルをアップロード
 */
export async function uploadFile(
  bucket: string,
  file: File,
  path?: string
): Promise<{ data: { path: string } | null; error: string | null }> {
  try {
    // ファイル名をユニークにする
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = file.name.split('.').pop();
    const fileName = path || `${timestamp}_${randomString}.${ext}`;
    const key = `${bucket}/${fileName}`;

    // FileをBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToS3(buffer, key, file.type);

    if (!result.success) {
      return { data: null, error: result.error || 'アップロードに失敗しました' };
    }

    return { data: { path: key }, error: null };
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
    // pathがbucket/を含まない場合は追加
    const key = path.startsWith(`${bucket}/`) ? path : `${bucket}/${path}`;

    const result = await deleteFromS3(key);

    if (!result.success) {
      return { error: result.error || '削除に失敗しました' };
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
  // pathがbucket/を含まない場合は追加
  const key = path.startsWith(`${bucket}/`) ? path : `${bucket}/${path}`;
  return getS3PublicUrl(key);
}

/**
 * ファイルをダウンロード
 */
export async function downloadFile(
  bucket: string,
  path: string
): Promise<{ data: Blob | null; error: string | null }> {
  try {
    // pathがbucket/を含まない場合は追加
    const key = path.startsWith(`${bucket}/`) ? path : `${bucket}/${path}`;

    const result = await downloadFromS3(key);

    if (!result.success || !result.data) {
      return { data: null, error: result.error || 'ダウンロードに失敗しました' };
    }

    // BufferをBlobに変換
    const blob = new Blob([result.data]);
    return { data: blob, error: null };
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
): Promise<{ data: { name: string; id: string }[] | null; error: string | null }> {
  try {
    const prefix = path ? `${bucket}/${path}` : bucket;

    const result = await listS3Files(prefix);

    if (!result.success || !result.files) {
      return { data: null, error: result.error || 'ファイル一覧取得に失敗しました' };
    }

    const files = result.files.map((key) => ({
      name: key.replace(`${bucket}/`, ''),
      id: key,
    }));

    return { data: files, error: null };
  } catch (err) {
    console.error('List files error:', err);
    return { data: null, error: err instanceof Error ? err.message : 'ファイル一覧取得に失敗しました' };
  }
}
