import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/storage/s3-client';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    await getTenantIdFromRequest(request);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const certificationId = formData.get('certificationId') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    if (!userId || !certificationId) {
      return NextResponse.json(
        { success: false, error: 'ユーザーIDと資格IDが必要です' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'JPEG, PNG, WebP, PDF ファイルのみアップロード可能です' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'ファイルサイズは10MB以下にしてください' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const key = `certifications/${userId}/${certificationId}/${timestamp}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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
    console.error('Certification upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'アップロードに失敗しました' },
      { status: 500 }
    );
  }
}
