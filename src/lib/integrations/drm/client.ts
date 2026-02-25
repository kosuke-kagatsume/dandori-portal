/**
 * DRM Suite APIクライアント
 *
 * Dandori Portal から DRM Suite へのAPI呼び出し
 */

import {
  type IntegrationApiResponse,
  type EmployeeSyncRequest,
  type EmployeeSyncResponse,
  type DepartmentSyncData,
  type PositionSyncData,
  type HealthCheckResponse,
  IntegrationErrorCodes,
} from './types';
import { createIntegrationHeaders, generateRequestId } from './auth';

// ============================================================
// 設定
// ============================================================

const getDrmApiUrl = () =>
  process.env.DRM_API_URL ||
  'https://www.dandori-relationship-management.com/api/integration';

/** リクエストタイムアウト（ミリ秒） */
const REQUEST_TIMEOUT_MS = 30000;

// ============================================================
// 基本クライアント
// ============================================================

/**
 * DRM APIクライアントクラス
 */
export class DrmApiClient {
  private baseUrl: string;
  private tenantId?: string;

  constructor(tenantId?: string) {
    this.baseUrl = getDrmApiUrl();
    this.tenantId = tenantId;
  }

  /**
   * GETリクエスト
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<IntegrationApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return this.request<T>('GET', url.toString());
  }

  /**
   * POSTリクエスト
   */
  async post<T>(
    endpoint: string,
    body: unknown
  ): Promise<IntegrationApiResponse<T>> {
    return this.request<T>('POST', `${this.baseUrl}${endpoint}`, body);
  }

  /**
   * PATCHリクエスト
   */
  async patch<T>(
    endpoint: string,
    body: unknown
  ): Promise<IntegrationApiResponse<T>> {
    return this.request<T>('PATCH', `${this.baseUrl}${endpoint}`, body);
  }

  /**
   * DELETEリクエスト
   */
  async delete<T>(endpoint: string): Promise<IntegrationApiResponse<T>> {
    return this.request<T>('DELETE', `${this.baseUrl}${endpoint}`);
  }

  /**
   * 共通リクエスト処理
   */
  private async request<T>(
    method: string,
    url: string,
    body?: unknown
  ): Promise<IntegrationApiResponse<T>> {
    const requestId = generateRequestId();
    const payload = body ? JSON.stringify(body) : '';
    const headers = createIntegrationHeaders(payload, this.tenantId);

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    );

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? payload : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          errorCode: data.errorCode,
          requestId,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: data.data || data,
        requestId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      clearTimeout(timeoutId);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const isTimeout = errorMessage.includes('aborted');

      return {
        success: false,
        error: isTimeout ? 'Request timeout' : errorMessage,
        errorCode: isTimeout
          ? IntegrationErrorCodes.SERVICE_UNAVAILABLE
          : IntegrationErrorCodes.INTERNAL_ERROR,
        requestId,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// ============================================================
// 高レベルAPI
// ============================================================

/**
 * DRM連携サービス
 */
export const drmService = {
  /**
   * ヘルスチェック
   */
  async healthCheck(): Promise<IntegrationApiResponse<HealthCheckResponse>> {
    const client = new DrmApiClient();
    return client.get<HealthCheckResponse>('/health');
  },

  /**
   * 従業員を同期
   */
  async syncEmployees(
    request: EmployeeSyncRequest
  ): Promise<IntegrationApiResponse<EmployeeSyncResponse>> {
    const client = new DrmApiClient(request.tenantId);
    return client.post<EmployeeSyncResponse>('/employees/sync', request);
  },

  /**
   * 部署を同期
   */
  async syncDepartments(
    tenantId: string,
    departments: DepartmentSyncData[]
  ): Promise<
    IntegrationApiResponse<{ syncedCount: number; syncedAt: string }>
  > {
    const client = new DrmApiClient(tenantId);
    return client.post('/departments/sync', {
      tenantId,
      departments,
      syncedAt: new Date().toISOString(),
    });
  },

  /**
   * 役職を同期
   */
  async syncPositions(
    tenantId: string,
    positions: PositionSyncData[]
  ): Promise<
    IntegrationApiResponse<{ syncedCount: number; syncedAt: string }>
  > {
    const client = new DrmApiClient(tenantId);
    return client.post('/positions/sync', {
      tenantId,
      positions,
      syncedAt: new Date().toISOString(),
    });
  },

  /**
   * 従業員情報を取得（DRMから）
   */
  async getEmployee(
    tenantId: string,
    employeeNumber: string
  ): Promise<IntegrationApiResponse<unknown>> {
    const client = new DrmApiClient(tenantId);
    return client.get(`/employees/${employeeNumber}`);
  },

  /**
   * 顧客情報を取得（DRMから）
   */
  async getCustomer(
    tenantId: string,
    customerId: string
  ): Promise<IntegrationApiResponse<unknown>> {
    const client = new DrmApiClient(tenantId);
    return client.get(`/customers/${customerId}`);
  },

  /**
   * 案件情報を取得（DRMから）
   */
  async getOpportunity(
    tenantId: string,
    opportunityId: string
  ): Promise<IntegrationApiResponse<unknown>> {
    const client = new DrmApiClient(tenantId);
    return client.get(`/opportunities/${opportunityId}`);
  },
};

// ============================================================
// シングルトンエクスポート
// ============================================================

export function createDrmClient(tenantId?: string): DrmApiClient {
  return new DrmApiClient(tenantId);
}
