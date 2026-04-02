'use client';

import { useEffect, useState, useCallback } from 'react';

// カラーパレット
export const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#a855f7',
  pink: '#ec4899',
};

export const CHART_COLORS = [
  COLORS.danger, COLORS.primary, COLORS.purple,
  COLORS.info, COLORS.success, COLORS.warning,
];

export const CATEGORY_COLORS: Record<string, string> = {
  '営業支援': COLORS.danger,
  '開発ツール': COLORS.primary,
  'プロジェクト管理': COLORS.purple,
  'コミュニケーション': COLORS.info,
  '生産性ツール': COLORS.success,
  'デザインツール': COLORS.warning,
  'その他': COLORS.secondary,
};

// API取得用フック
export function useFetchChartData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) { setIsLoading(false); return; }
    try {
      setIsLoading(true);
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
