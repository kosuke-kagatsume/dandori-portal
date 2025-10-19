/**
 * API型定義
 *
 * バックエンドAPIとの通信用の型定義
 */

// ============================================================================
// 共通型
// ============================================================================

/**
 * APIレスポンスの基本型
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

/**
 * APIエラー型
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

/**
 * ページネーション型
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

// ============================================================================
// 認証関連
// ============================================================================

/**
 * ログインリクエスト
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * ログインレスポンス
 */
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * トークンリフレッシュリクエスト
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * トークンリフレッシュレスポンス
 */
export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// ============================================================================
// Onboarding API
// ============================================================================

/**
 * 入社申請取得リクエスト
 */
export interface GetOnboardingApplicationRequest {
  applicationId: string;
}

/**
 * 入社申請一覧取得リクエスト
 */
export interface ListOnboardingApplicationsRequest {
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  employeeId?: string;
  page?: number;
  limit?: number;
}

/**
 * 入社申請作成リクエスト
 */
export interface CreateOnboardingApplicationRequest {
  employeeId: string;
  applicantEmail: string;
  applicantName: string;
  hireDate: string;
  department: string;
  position: string;
  deadline?: string;
}

/**
 * 入社申請更新リクエスト
 */
export interface UpdateOnboardingApplicationRequest {
  applicationId: string;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  hrNotes?: string;
}

/**
 * フォーム提出リクエスト
 */
export interface SubmitFormRequest {
  applicationId: string;
  formType: 'basicInfo' | 'familyInfo' | 'bankAccount' | 'commuteRoute';
  formData: Record<string, unknown>;
}

/**
 * フォーム承認リクエスト
 */
export interface ApproveFormRequest {
  applicationId: string;
  formType: 'basicInfo' | 'familyInfo' | 'bankAccount' | 'commuteRoute';
  approvedBy: string;
}

/**
 * フォーム差し戻しリクエスト
 */
export interface ReturnFormRequest {
  applicationId: string;
  formType: 'basicInfo' | 'familyInfo' | 'bankAccount' | 'commuteRoute';
  returnedBy: string;
  returnReason: string;
}

// ============================================================================
// エンドポイント定義
// ============================================================================

/**
 * APIエンドポイント
 */
export const API_ENDPOINTS = {
  // 認証
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
  },

  // 入社手続き
  ONBOARDING: {
    // 申請管理
    LIST_APPLICATIONS: '/api/onboarding/applications',
    GET_APPLICATION: '/api/onboarding/applications/:id',
    CREATE_APPLICATION: '/api/onboarding/applications',
    UPDATE_APPLICATION: '/api/onboarding/applications/:id',
    DELETE_APPLICATION: '/api/onboarding/applications/:id',

    // フォーム管理
    GET_BASIC_INFO: '/api/onboarding/applications/:id/basic-info',
    SUBMIT_BASIC_INFO: '/api/onboarding/applications/:id/basic-info',
    APPROVE_BASIC_INFO: '/api/onboarding/applications/:id/basic-info/approve',
    RETURN_BASIC_INFO: '/api/onboarding/applications/:id/basic-info/return',

    GET_FAMILY_INFO: '/api/onboarding/applications/:id/family-info',
    SUBMIT_FAMILY_INFO: '/api/onboarding/applications/:id/family-info',
    APPROVE_FAMILY_INFO: '/api/onboarding/applications/:id/family-info/approve',
    RETURN_FAMILY_INFO: '/api/onboarding/applications/:id/family-info/return',

    GET_BANK_ACCOUNT: '/api/onboarding/applications/:id/bank-account',
    SUBMIT_BANK_ACCOUNT: '/api/onboarding/applications/:id/bank-account',
    APPROVE_BANK_ACCOUNT: '/api/onboarding/applications/:id/bank-account/approve',
    RETURN_BANK_ACCOUNT: '/api/onboarding/applications/:id/bank-account/return',

    GET_COMMUTE_ROUTE: '/api/onboarding/applications/:id/commute-route',
    SUBMIT_COMMUTE_ROUTE: '/api/onboarding/applications/:id/commute-route',
    APPROVE_COMMUTE_ROUTE: '/api/onboarding/applications/:id/commute-route/approve',
    RETURN_COMMUTE_ROUTE: '/api/onboarding/applications/:id/commute-route/return',
  },

  // ユーザー管理
  USERS: {
    LIST: '/api/users',
    GET: '/api/users/:id',
    CREATE: '/api/users',
    UPDATE: '/api/users/:id',
    DELETE: '/api/users/:id',
  },
} as const;

/**
 * HTTPメソッド
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API リクエスト設定
 */
export interface ApiRequestConfig {
  method: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  timeout?: number;
}
