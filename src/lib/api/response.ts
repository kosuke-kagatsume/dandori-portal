/**
 * API レスポンス標準形式
 *
 * 全APIエンドポイントで統一されたレスポンス形式を使用することで、
 * クライアント側での処理を簡素化し、エラーハンドリングを統一する
 */

import { NextResponse } from 'next/server';

/**
 * ページネーション情報
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * 成功レスポンスの型定義
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  pagination?: PaginationInfo;
  count?: number;
}

/**
 * エラーレスポンスの型定義
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
  details?: Record<string, string>; // フィールドエラー
}

/**
 * エラーコード定義
 */
export const ErrorCodes = {
  // 認証・認可
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // バリデーション
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // リソース
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // サーバー
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * 成功レスポンスを生成
 */
export function createSuccessResponse<T>(
  data: T,
  options?: {
    message?: string;
    pagination?: PaginationInfo;
    count?: number;
    status?: number;
    cacheSeconds?: number;
  }
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(options?.message && { message: options.message }),
    ...(options?.pagination && { pagination: options.pagination }),
    ...(options?.count !== undefined && { count: options.count }),
  };

  const nextResponse = NextResponse.json(response, { status: options?.status || 200 });

  // キャッシュヘッダー設定
  if (options?.cacheSeconds) {
    nextResponse.headers.set('Cache-Control', `private, max-age=${options.cacheSeconds}`);
  }

  return nextResponse;
}

/**
 * エラーレスポンスを生成
 */
export function createErrorResponse(
  error: string,
  status: number,
  options?: {
    errorCode?: ErrorCode;
    details?: Record<string, string>;
  }
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error,
    ...(options?.errorCode && { errorCode: options.errorCode }),
    ...(options?.details && { details: options.details }),
  };

  return NextResponse.json(response, { status });
}

/**
 * 400 Bad Request エラー
 */
export function badRequestError(
  error: string,
  details?: Record<string, string>
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(error, 400, {
    errorCode: ErrorCodes.VALIDATION_ERROR,
    details,
  });
}

/**
 * 401 Unauthorized エラー
 */
export function unauthorizedError(error = '認証が必要です'): NextResponse<ApiErrorResponse> {
  return createErrorResponse(error, 401, {
    errorCode: ErrorCodes.UNAUTHORIZED,
  });
}

/**
 * 403 Forbidden エラー
 */
export function forbiddenError(error = '権限がありません'): NextResponse<ApiErrorResponse> {
  return createErrorResponse(error, 403, {
    errorCode: ErrorCodes.FORBIDDEN,
  });
}

/**
 * 404 Not Found エラー
 */
export function notFoundError(resource: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(`${resource}が見つかりません`, 404, {
    errorCode: ErrorCodes.NOT_FOUND,
  });
}

/**
 * 409 Conflict エラー
 */
export function conflictError(error: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(error, 409, {
    errorCode: ErrorCodes.CONFLICT,
  });
}

/**
 * 500 Internal Server Error
 */
export function internalError(
  error = 'サーバーエラーが発生しました',
  originalError?: Error
): NextResponse<ApiErrorResponse> {
  // 開発環境でのみ詳細を含める
  const details =
    process.env.NODE_ENV === 'development' && originalError
      ? { detail: originalError.message }
      : undefined;

  return createErrorResponse(error, 500, {
    errorCode: ErrorCodes.INTERNAL_ERROR,
    details,
  });
}

/**
 * エラーハンドリングユーティリティ
 * try-catchで捕捉したエラーを適切なレスポンスに変換
 */
export function handleError(error: unknown, context?: string): NextResponse<ApiErrorResponse> {
  console.error(context ? `[${context}]` : '[API Error]', error);

  if (error instanceof Error) {
    // Prismaエラーの判定
    if (error.message.includes('Unique constraint')) {
      return conflictError('このデータは既に存在します');
    }
    if (error.message.includes('Record to update not found')) {
      return notFoundError('対象のレコード');
    }
    if (error.message.includes('テナントID')) {
      return badRequestError(error.message);
    }

    return internalError(
      context ? `${context}に失敗しました` : 'サーバーエラーが発生しました',
      error
    );
  }

  return internalError(context ? `${context}に失敗しました` : 'サーバーエラーが発生しました');
}
