/**
 * マイナンバー確認書類 API
 * GET: 書類閲覧用presigned URL取得（5分期限）
 * POST: 書類アップロード
 * DELETE: 書類削除 + ログ
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/api-auth';
import { getTenantIdFromRequest, errorResponse } from '@/lib/api/api-helpers';
import { canReadMynumber, canManageMynumber } from '@/lib/api/mynumber-permission';
import { uploadToS3, deleteFromS3, getPresignedUrl } from '@/lib/storage/s3-client';
import { recordAuditLogDirect } from '@/lib/audit-logger';

type DocType = 'number' | 'identity';

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PRESIGNED_URL_EXPIRY = 300; // 5分

function getDocKeyField(docType: DocType): 'numberDocKey' | 'identityDocKey' {
  return docType === 'number' ? 'numberDocKey' : 'identityDocKey';
}

function getDocLabel(docType: DocType): string {
  return docType === 'number' ? '番号確認書類' : '身元確認書類';
}

// GET: presigned URL取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromRequest(request);
    const { id: targetUserId } = await params;
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get('docType') as DocType;
    const dependentDetailId = searchParams.get('dependentDetailId');

    if (!docType || !['number', 'identity'].includes(docType)) {
      return NextResponse.json({ success: false, error: 'docType (number|identity) は必須です' }, { status: 400 });
    }

    const hasPermission = await canReadMynumber(tenantId, auth.user.userId);
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'マイナンバー閲覧権限がありません' }, { status: 403 });
    }

    const record = await prisma.mynumber_records.findFirst({
      where: {
        tenantId,
        userId: targetUserId,
        subjectType: dependentDetailId ? 'dependent' : 'employee',
        ...(dependentDetailId ? { dependentDetailId } : { OR: [{ dependentDetailId: null }, { dependentDetailId: '' }] }),
        deletedAt: null,
      },
    });

    const keyField = getDocKeyField(docType);
    const s3Key = record?.[keyField];
    if (!s3Key) {
      return NextResponse.json({ success: false, error: `${getDocLabel(docType)}が登録されていません` }, { status: 404 });
    }

    const url = await getPresignedUrl(s3Key, PRESIGNED_URL_EXPIRY);

    // 監査ログ: 書類閲覧
    const targetUser = await prisma.users.findUnique({ where: { id: targetUserId }, select: { name: true } });
    await recordAuditLogDirect(prisma, {
      tenantId,
      userId: auth.user.userId,
      userName: auth.user.email,
      userRole: auth.user.role,
      action: 'access',
      category: 'mynumber',
      targetType: 'mynumber_document',
      targetId: targetUserId,
      targetName: targetUser?.name || '',
      description: `${getDocLabel(docType)}閲覧（対象: ${targetUser?.name || targetUserId}）`,
      severity: 'info',
    });

    return NextResponse.json({ success: true, data: { url } });
  } catch {
    return errorResponse('書類URL取得に失敗しました', 500);
  }
}

// POST: 書類アップロード
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromRequest(request);
    const { id: targetUserId } = await params;

    const hasPermission = await canManageMynumber(tenantId, auth.user.userId);
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'マイナンバー管理権限がありません' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const docType = formData.get('docType') as DocType;
    const dependentDetailId = formData.get('dependentDetailId') as string | null;

    if (!file || !docType || !['number', 'identity'].includes(docType)) {
      return NextResponse.json({ success: false, error: 'file と docType (number|identity) は必須です' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'JPEG または PNG のみアップロード可能です' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'ファイルサイズは10MB以下にしてください' }, { status: 400 });
    }

    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const timestamp = Date.now();
    const basePath = dependentDetailId
      ? `mynumber/${tenantId}/${targetUserId}/dependent/${dependentDetailId}`
      : `mynumber/${tenantId}/${targetUserId}`;
    const s3Key = `${basePath}/${docType}-doc-${timestamp}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToS3(buffer, s3Key, file.type);

    // レコード更新（なければ作成）
    const subjectType = dependentDetailId ? 'dependent' : 'employee';
    const keyField = getDocKeyField(docType);

    await prisma.mynumber_records.upsert({
      where: {
        tenantId_userId_subjectType_dependentDetailId: {
          tenantId,
          userId: targetUserId,
          subjectType,
          dependentDetailId: dependentDetailId || '',
        },
      },
      create: {
        id: crypto.randomUUID(),
        tenantId,
        userId: targetUserId,
        subjectType,
        dependentDetailId: dependentDetailId || null,
        [keyField]: s3Key,
      },
      update: {
        [keyField]: s3Key,
      },
    });

    // 監査ログ
    const targetUser = await prisma.users.findUnique({ where: { id: targetUserId }, select: { name: true } });
    await recordAuditLogDirect(prisma, {
      tenantId,
      userId: auth.user.userId,
      userName: auth.user.email,
      userRole: auth.user.role,
      action: 'create',
      category: 'mynumber',
      targetType: 'mynumber_document',
      targetId: targetUserId,
      targetName: targetUser?.name || '',
      description: `${getDocLabel(docType)}アップロード（対象: ${targetUser?.name || targetUserId}）`,
      severity: 'info',
    });

    return NextResponse.json({ success: true });
  } catch {
    return errorResponse('書類アップロードに失敗しました', 500);
  }
}

// DELETE: 書類削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: '認証が必要です' }, { status: 401 });
    }

    const tenantId = await getTenantIdFromRequest(request);
    const { id: targetUserId } = await params;
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get('docType') as DocType;
    const dependentDetailId = searchParams.get('dependentDetailId');

    if (!docType || !['number', 'identity'].includes(docType)) {
      return NextResponse.json({ success: false, error: 'docType (number|identity) は必須です' }, { status: 400 });
    }

    const hasPermission = await canManageMynumber(tenantId, auth.user.userId);
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: 'マイナンバー管理権限がありません' }, { status: 403 });
    }

    const subjectType = dependentDetailId ? 'dependent' : 'employee';
    const record = await prisma.mynumber_records.findFirst({
      where: { tenantId, userId: targetUserId, subjectType, deletedAt: null },
    });

    const keyField = getDocKeyField(docType);
    const s3Key = record?.[keyField];
    if (!s3Key) {
      return NextResponse.json({ success: false, error: `${getDocLabel(docType)}が登録されていません` }, { status: 404 });
    }

    // S3から削除
    await deleteFromS3(s3Key);

    // DB更新
    await prisma.mynumber_records.update({
      where: { id: record.id },
      data: { [keyField]: null },
    });

    // 監査ログ
    const targetUser = await prisma.users.findUnique({ where: { id: targetUserId }, select: { name: true } });
    await recordAuditLogDirect(prisma, {
      tenantId,
      userId: auth.user.userId,
      userName: auth.user.email,
      userRole: auth.user.role,
      action: 'delete',
      category: 'mynumber',
      targetType: 'mynumber_document',
      targetId: targetUserId,
      targetName: targetUser?.name || '',
      description: `${getDocLabel(docType)}削除（対象: ${targetUser?.name || targetUserId}）`,
      severity: 'warning',
    });

    return NextResponse.json({ success: true });
  } catch {
    return errorResponse('書類削除に失敗しました', 500);
  }
}
