import { useEffect, useState } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';

/**
 * ワークフローデータフック
 * REST API経由でデータを取得し、Zustandストアにキャッシュ
 */
export function useWorkflowData(userId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const store = useWorkflowStore();

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // REST APIからワークフローデータを取得
        const response = await fetch('/api/workflows');

        if (!response.ok) {
          // APIからの取得に失敗した場合はZustandストアのデータを使用
          await store.fetchRequests();
        }
      } catch (err) {
        console.error('Failed to fetch workflow data:', err);
        setError('データの取得に失敗しました');
        // エラー時もZustandストアを初期化
        await store.fetchRequests();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return {
    loading,
    error,
    // Zustandストアのデータを返す
    myRequests: store.getMyRequests(userId),
    pendingApprovals: store.getPendingApprovals(userId),
    delegatedApprovals: store.getDelegatedApprovals(userId),
    statistics: store.getStatistics(userId),
  };
}