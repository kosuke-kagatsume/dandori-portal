/**
 * AWS S3 Client
 * ファイルストレージ用のS3クライアント
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'dandori-portal-storage';
const REGION = process.env.AWS_REGION || 'ap-northeast-1';

// S3クライアントの初期化
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * ファイルをS3にアップロード
 */
export async function uploadToS3(
  file: Buffer | Blob,
  key: string,
  contentType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    let body: Buffer;

    if (file instanceof Blob) {
      const arrayBuffer = await file.arrayBuffer();
      body = Buffer.from(arrayBuffer);
    } else {
      body = file;
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'max-age=3600',
    });

    await s3Client.send(command);

    const url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;

    return { success: true, url };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'アップロードに失敗しました',
    };
  }
}

/**
 * S3からファイルを削除
 */
export async function deleteFromS3(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return { success: true };
  } catch (error) {
    console.error('S3 delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '削除に失敗しました',
    };
  }
}

/**
 * S3からファイルをダウンロード
 */
export async function downloadFromS3(key: string): Promise<{ success: boolean; data?: Buffer; error?: string }> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return { success: false, error: 'ファイルが見つかりません' };
    }

    const data = await response.Body.transformToByteArray();

    return { success: true, data: Buffer.from(data) };
  } catch (error) {
    console.error('S3 download error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ダウンロードに失敗しました',
    };
  }
}

/**
 * S3バケット内のファイル一覧を取得
 */
export async function listS3Files(prefix?: string): Promise<{ success: boolean; files?: string[]; error?: string }> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 100,
    });

    const response = await s3Client.send(command);
    const files = response.Contents?.map((obj) => obj.Key || '') || [];

    return { success: true, files };
  } catch (error) {
    console.error('S3 list error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ファイル一覧取得に失敗しました',
    };
  }
}

/**
 * 署名付きURLを生成（一時的なアクセス用）
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return { success: true, url };
  } catch (error) {
    console.error('Presigned URL error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'URL生成に失敗しました',
    };
  }
}

/**
 * アップロード用の署名付きURLを生成
 */
export async function getUploadPresignedUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return { success: true, url };
  } catch (error) {
    console.error('Upload presigned URL error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'URL生成に失敗しました',
    };
  }
}

/**
 * 公開URLを取得
 */
export function getPublicUrl(key: string): string {
  return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
}

export { BUCKET_NAME, REGION };
