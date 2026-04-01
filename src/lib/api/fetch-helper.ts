/**
 * クライアントサイド用 fetch ヘルパー
 *
 * コンポーネントやstoreからAPIを呼ぶ際の共通処理:
 * - レスポンス型の統一 (ApiResponse<T>)
 * - エラーハンドリング
 * - JSON parse
 */

import type { ApiResponse } from './types';

export class FetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json() as ApiResponse<T>;
  if (!res.ok || json.success === false) {
    throw new FetchError(
      json.error?.message || json.message || `API error: ${res.status}`,
      res.status,
      json.error?.code,
    );
  }
  return json.data as T;
}

/** GET リクエスト */
export async function apiGet<T>(
  url: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const query = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
  const res = await fetch(`${url}${query}`);
  return handleResponse<T>(res);
}

/** POST リクエスト */
export async function apiPost<T>(
  url: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

/** PUT リクエスト */
export async function apiPut<T>(
  url: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

/** PATCH リクエスト */
export async function apiPatch<T>(
  url: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

/** DELETE リクエスト */
export async function apiDelete<T = void>(
  url: string,
  params?: Record<string, string>,
): Promise<T> {
  const query = params
    ? '?' + new URLSearchParams(params).toString()
    : '';
  const res = await fetch(`${url}${query}`, { method: 'DELETE' });
  return handleResponse<T>(res);
}
