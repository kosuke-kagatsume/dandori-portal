import { NextResponse } from 'next/server';

// 共通のAPIレスポンス型
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: Record<string, number>;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ページネーションパラメータ取得
export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// 成功レスポンス（キャッシュヘッダー付き）
export function successResponse<T>(
  data: T,
  options?: {
    count?: number;
    pagination?: ApiSuccessResponse<T>['pagination'];
    stats?: Record<string, number>;
    cacheSeconds?: number;
  }
) {
  const response = NextResponse.json({
    success: true,
    data,
    ...(options?.count !== undefined && { count: options.count }),
    ...(options?.pagination && { pagination: options.pagination }),
    ...(options?.stats && { stats: options.stats }),
  });

  // GETリクエスト用のキャッシュヘッダー
  if (options?.cacheSeconds) {
    response.headers.set(
      'Cache-Control',
      `private, max-age=${options.cacheSeconds}, stale-while-revalidate=${options.cacheSeconds * 2}`
    );
  }

  return response;
}

// エラーレスポンス
export function errorResponse(
  error: string,
  status: number = 500,
  details?: { message?: string; code?: string }
) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details?.message && { message: details.message }),
      ...(details?.code && { code: details.code }),
    },
    { status }
  );
}

// 共通エラーハンドラー
export function handleApiError(error: unknown, operation: string) {
  console.error(`Error ${operation}:`, error);

  if (error instanceof Error) {
    // Prismaエラーの場合
    if (error.message.includes('Unique constraint')) {
      return errorResponse('このデータは既に存在します', 409, { code: 'DUPLICATE' });
    }
    if (error.message.includes('Foreign key constraint')) {
      return errorResponse('関連するデータが存在しないか、削除できません', 400, { code: 'FK_VIOLATION' });
    }
    if (error.message.includes('Record to update not found')) {
      return errorResponse('対象のデータが見つかりません', 404, { code: 'NOT_FOUND' });
    }

    return errorResponse(`${operation}に失敗しました`, 500, { message: error.message });
  }

  return errorResponse(`${operation}に失敗しました`, 500);
}

// テナントID取得（将来の認証統合用）
export function getTenantId(searchParams: URLSearchParams): string {
  // TODO: 認証からテナントIDを取得するように変更
  return searchParams.get('tenantId') || 'tenant-demo-001';
}

// バリデーションヘルパー
export function validateRequired<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: true } | { valid: false; error: string } {
  const missingFields = requiredFields.filter(field => !data[field]);

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `必須項目が不足しています: ${missingFields.join(', ')}`,
    };
  }

  return { valid: true };
}

// validateRequiredのエイリアス（後方互換性のため）
export const validateRequiredFields = validateRequired;
