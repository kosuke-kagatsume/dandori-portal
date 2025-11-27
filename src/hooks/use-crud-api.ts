'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// 共通のAPIレスポンス型
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// CRUD操作の結果型
interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// フックのオプション
interface UseCrudApiOptions {
  autoFetch?: boolean;
  cacheKey?: string;
  queryParams?: Record<string, string>;
}

// 汎用CRUDフック
export function useCrudApi<T extends { id: string }>(
  endpoint: string,
  options: UseCrudApiOptions = {}
) {
  const { autoFetch = true, queryParams = {} } = options;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ApiResponse<T[]>['pagination']>();

  // 再レンダリング時の不要なfetch防止
  const isMountedRef = useRef(false);
  const abortControllerRef = useRef<AbortController>();

  // クエリパラメータを構築
  const buildQueryString = useCallback((params: Record<string, string> = {}) => {
    const allParams = { ...queryParams, ...params };
    const searchParams = new URLSearchParams();
    Object.entries(allParams).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }, [queryParams]);

  // 一覧取得
  const fetchItems = useCallback(async (params?: Record<string, string>) => {
    // 前のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${endpoint}${buildQueryString(params)}`,
        { signal: abortControllerRef.current.signal }
      );
      const data: ApiResponse<T[]> = await response.json();

      if (data.success && data.data) {
        setItems(data.data);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        setError(data.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // キャンセルされたリクエストは無視
      }
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  }, [endpoint, buildQueryString]);

  // 作成（楽観的更新）
  const createItem = useCallback(async (item: Partial<T>): Promise<OperationResult<T>> => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data: ApiResponse<T> = await response.json();

      if (data.success && data.data) {
        // 楽観的更新：新しいアイテムを先頭に追加
        setItems(prev => [data.data as T, ...prev]);
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : '不明なエラー' };
    }
  }, [endpoint]);

  // 更新（楽観的更新）
  const updateItem = useCallback(async (id: string, updates: Partial<T>): Promise<OperationResult<T>> => {
    // 楽観的更新のためにオリジナルを保存
    const originalItems = [...items];

    // 先にUIを更新
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));

    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data: ApiResponse<T> = await response.json();

      if (data.success && data.data) {
        // サーバーからの正確なデータで更新
        setItems(prev => prev.map(item =>
          item.id === id ? data.data as T : item
        ));
        return { success: true, data: data.data };
      }

      // エラー時はロールバック
      setItems(originalItems);
      return { success: false, error: data.error };
    } catch (err) {
      // エラー時はロールバック
      setItems(originalItems);
      return { success: false, error: err instanceof Error ? err.message : '不明なエラー' };
    }
  }, [endpoint, items]);

  // 削除（楽観的更新）
  const deleteItem = useCallback(async (id: string): Promise<OperationResult<void>> => {
    // 楽観的更新のためにオリジナルを保存
    const originalItems = [...items];

    // 先にUIを更新
    setItems(prev => prev.filter(item => item.id !== id));

    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
      });
      const data: ApiResponse<void> = await response.json();

      if (data.success) {
        return { success: true };
      }

      // エラー時はロールバック
      setItems(originalItems);
      return { success: false, error: data.error };
    } catch (err) {
      // エラー時はロールバック
      setItems(originalItems);
      return { success: false, error: err instanceof Error ? err.message : '不明なエラー' };
    }
  }, [endpoint, items]);

  // 初回マウント時のfetch
  useEffect(() => {
    if (autoFetch && !isMountedRef.current) {
      isMountedRef.current = true;
      fetchItems();
    }

    // クリーンアップ
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoFetch, fetchItems]);

  return {
    items,
    loading,
    error,
    pagination,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    // ローカル状態を直接更新するユーティリティ
    setItems,
    setError,
  };
}

// 特定のリソース用のプリセット
export function useVehiclesApiOptimized() {
  return useCrudApi<{
    id: string;
    vehicleNumber: string;
    licensePlate: string;
    make: string;
    model: string;
    year: number;
    status: string;
    [key: string]: unknown;
  }>('/api/assets/vehicles');
}

export function usePCAssetsApiOptimized() {
  return useCrudApi<{
    id: string;
    assetNumber: string;
    manufacturer: string;
    model: string;
    status: string;
    [key: string]: unknown;
  }>('/api/assets/pc-assets');
}

export function useVendorsApiOptimized() {
  return useCrudApi<{
    id: string;
    name: string;
    category: string | null;
    phone: string | null;
    [key: string]: unknown;
  }>('/api/assets/vendors');
}
