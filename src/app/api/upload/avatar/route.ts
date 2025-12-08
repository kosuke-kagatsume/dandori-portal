/**
 * アバターアップロードAPI
 * クライアントから画像を受け取り、サーバーサイドでS3にアップロード
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/storage/s3-client';

// 許可するファイルタイプ
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    // バリデーション
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // ファイルタイプチェック
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '画像ファイル（JPEG, PNG, WebP, GIF）のみアップロード可能です' },
        { status: 400 }
      );
    }

    // ファイルサイズチェック
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'ファイルサイズは5MB以下にしてください' },
        { status: 400 }
      );
    }

    // ファイル名を生成
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const key = `avatars/${userId}/${timestamp}.${fileExt}`;

    // FileをBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // S3にアップロード（サーバーサイドで実行）
    const result = await uploadToS3(buffer, key, file.type);

    if (!result.success) {
      console.error('S3 upload failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'アップロードに失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'アップロードに失敗しました' },
      { status: 500 }
    );
  }
}
