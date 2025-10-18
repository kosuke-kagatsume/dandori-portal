/**
 * API Client
 *
 * Central API client for making HTTP requests to the backend.
 * Features:
 * - Automatic token injection
 * - Error handling
 * - Request/Response interceptors
 * - Type-safe API calls
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

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || '/api') {
    this.baseURL = baseURL;
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token;
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.token;
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
   * GET request
   */
  async get<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(options?.headers),
      ...options,
    });

    return this.handleResponse<T>(response);
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
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
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
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
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
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(options?.headers),
      ...options,
    });

    return this.handleResponse<T>(response);
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

// Export singleton instance
export const apiClient = new APIClient();

// Export class for testing
export { APIClient };
