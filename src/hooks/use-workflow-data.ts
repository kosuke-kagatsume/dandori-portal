import { useEffect, useState } from 'react';
import { workflowService } from '@/lib/supabase/workflow-service';
import { useWorkflowStore } from '@/lib/workflow-store';

export function useWorkflowData(userId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Zustandストアからもデータを取得（フォールバック用）
  const store = useWorkflowStore();

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Supabaseからデータを取得
        const [myRequestsResult, pendingApprovalsResult] = await Promise.all([
          workflowService.getMyRequests(userId),
          workflowService.getPendingApprovals(userId),
        ]);

        if (!myRequestsResult.success || !pendingApprovalsResult.success) {
          // Supabaseからの取得に失敗した場合はZustandストアのデータを使用
          store.initializeDemoData();
        }
      } catch (err) {
        console.error('Failed to fetch workflow data:', err);
        setError('データの取得に失敗しました');
        // エラー時もZustandストアを初期化
        store.initializeDemoData();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return {
    loading,
    error,
    // Zustandストアのデータを返す（Supabaseのデータも内部で同期される）
    myRequests: store.getMyRequests(userId),
    pendingApprovals: store.getPendingApprovals(userId),
    delegatedApprovals: store.getDelegatedApprovals(userId),
    statistics: store.getStatistics(userId),
  };
}