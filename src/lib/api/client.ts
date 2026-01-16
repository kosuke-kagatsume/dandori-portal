/**
 * API Client
 *
 * バックエンドAPIとの通信を管理するクライアント
 * Phase 4機能:
 * - 型安全なリクエスト処理
 * - トークンベース認証（自動リフレッシュ）
 * - リクエスト/レスポンスインターセプター
 * - エラーハンドリングとリトライロジック
 * - タイムアウト処理
 */

import type {
  // ApiResponse - 将来使用予定
  // ApiErrorType - 将来使用予定
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  // RefreshTokenResponse - 将来使用予定
} from './types';

/**
 * API クライアント設定
 */
interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  onTokenRefresh?: (accessToken: string) => void;
  onUnauthorized?: () => void;
}

/**
 * APIエラークラス
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * ネットワークエラークラス
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * タイムアウトエラークラス
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export interface APIResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface APIErrorResponse {
  error: string;
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

class APIClient {
  private baseURL: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];
  private onTokenRefresh?: (accessToken: string) => void;
  private onUnauthorized?: () => void;

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || process.env.NEXT_PUBLIC_API_URL || '/api';
    this.timeout = config.timeout || 30000; // 30秒
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000; // 1秒
    this.onTokenRefresh = config.onTokenRefresh;
    this.onUnauthorized = config.onUnauthorized;

    // localStorageからトークンを復元（クライアントサイドのみ）
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('access_token', token);
      } else {
        localStorage.removeItem('access_token');
      }
    }
  }

  /**
   * Set refresh token
   */
  setRefreshToken(token: string | null) {
    this.refreshToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('refresh_token', token);
      } else {
        localStorage.removeItem('refresh_token');
      }
    }
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Clear tokens
   */
  clearTokens(): void {
    this.token = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new APIError('リフレッシュトークンがありません', 401, 'NO_REFRESH_TOKEN');
    }

    // 既にリフレッシュ中の場合は待機
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    this.isRefreshing = true;

    try {
      const response = await this.post<LoginResponse>('/api/auth/refresh', {
        refreshToken: this.refreshToken,
      } as RefreshTokenRequest);

      const { accessToken } = response;
      this.setToken(accessToken);

      // コールバックを実行
      if (this.onTokenRefresh) {
        this.onTokenRefresh(accessToken);
      }

      // 待機中のリクエストに新しいトークンを通知
      this.refreshSubscribers.forEach((callback) => callback(accessToken));
      this.refreshSubscribers = [];

      return accessToken;
    } catch (error) {
      // リフレッシュ失敗時は認証エラーとして処理
      if (this.onUnauthorized) {
        this.onUnauthorized();
      }
      this.clearTokens();
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Build request headers
   */
  private getHeaders(customHeaders?: HeadersInit): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJSON = contentType?.includes('application/json');

    // タイムアウトチェック
    if (!response.ok && response.status === 408) {
      throw new TimeoutError('リクエストがタイムアウトしました');
    }

    // ネットワークエラーチェック
    if (!response.ok && response.status >= 500) {
      throw new NetworkError(`サーバーエラー: ${response.status}`);
    }

    if (!response.ok) {
      if (isJSON) {
        const error: APIErrorResponse = await response.json();
        throw new APIError(
          error.message || 'API request failed',
          response.status,
          error.code,
          error.details
        );
      } else {
        const text = await response.text();
        throw new APIError(
          text || 'API request failed',
          response.status
        );
      }
    }

    if (isJSON) {
      const json: APIResponse<T> = await response.json();
      return json.data;
    }

    return {} as T;
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<T> {
    try {
      // タイムアウト処理
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // 401エラーの場合、トークンリフレッシュを試行
        if (response.status === 401 && !url.includes('/auth/refresh')) {
          try {
            await this.refreshAccessToken();
            // トークンリフレッシュ成功後、リクエストを再実行
            const refreshedHeaders = this.getHeaders(options.headers);
            return await this.executeWithRetry<T>(
              url,
              { ...options, headers: refreshedHeaders },
              retryCount
            );
          } catch {
            // リフレッシュ失敗時は元のレスポンスを処理
            return await this.handleResponse<T>(response);
          }
        }

        return await this.handleResponse<T>(response);
      } catch (error) {
        clearTimeout(timeoutId);

        // AbortError の場合はタイムアウト
        if (error instanceof Error && error.name === 'AbortError') {
          throw new TimeoutError('リクエストがタイムアウトしました');
        }

        throw error;
      }
    } catch (error) {
      // リトライ可能なエラーの場合
      const isRetryable = error instanceof NetworkError || error instanceof TimeoutError;
      if (isRetryable && retryCount < this.maxRetries) {
        // 指数バックオフでリトライ
        const delay = this.retryDelay * Math.pow(2, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return await this.executeWithRetry<T>(url, options, retryCount + 1);
      }

      // リトライ不可 or 最大リトライ回数到達
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    return await this.executeWithRetry<T>(url, {
      method: 'GET',
      headers: this.getHeaders(options?.headers),
      ...options,
    });
  }

  /**
   * POST request
   */
  async post<T, D = unknown>(
    endpoint: string,
    data?: D,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    return await this.executeWithRetry<T>(url, {
      method: 'POST',
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put<T, D = unknown>(
    endpoint: string,
    data?: D,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    return await this.executeWithRetry<T>(url, {
      method: 'PUT',
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * PATCH request
   */
  async patch<T, D = unknown>(
    endpoint: string,
    data?: D,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    return await this.executeWithRetry<T>(url, {
      method: 'PATCH',
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    return await this.executeWithRetry<T>(url, {
      method: 'DELETE',
      headers: this.getHeaders(options?.headers),
      ...options,
    });
  }

  /**
   * Login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>('/api/auth/login', credentials);

    // トークンを保存
    if (response) {
      this.setToken(response.accessToken);
      this.setRefreshToken(response.refreshToken);
    }

    return response;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await this.post('/api/auth/logout');
    this.clearTokens();
  }

  /**
   * Upload file
   */
  async upload<T>(
    endpoint: string,
    formData: FormData,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Don't set Content-Type for FormData - browser will set it with boundary
    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      ...options,
    });

    return this.handleResponse<T>(response);
  }
}

// ============================================================================
// シングルトンインスタンス
// ============================================================================

/**
 * デフォルトAPIクライアントインスタンス
 */
let defaultClient: APIClient | null = null;

/**
 * デフォルトAPIクライアントを取得
 */
export function getAPIClient(): APIClient {
  if (!defaultClient) {
    defaultClient = new APIClient({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
      onTokenRefresh: () => {
        console.log('[API Client] Token refreshed successfully');
      },
      onUnauthorized: () => {
        console.log('[API Client] Unauthorized - redirecting to login');
        if (typeof window !== 'undefined') {
          // 現在のロケールをURLから取得
          const locale = window.location.pathname.split('/')[1] || 'ja';
          window.location.href = `/${locale}/auth/login`;
        }
      },
    });
  }

  return defaultClient;
}

/**
 * APIクライアントをリセット（テスト用）
 */
export function resetAPIClient(): void {
  defaultClient = null;
}

// Export singleton instance (backward compatibility)
export const apiClient = getAPIClient();

// Export class for testing
export { APIClient };
