"use client";

import {
  getUnsyncedDrafts,
  getUnsyncedActions,
  markDraftAsSynced,
  markActionAsSynced,
  deleteDraft,
  deletePendingAction,
  incrementActionRetry,
} from './offline-storage';
import { toast } from 'sonner';

export interface SyncProgress {
  total: number;
  synced: number;
  failed: number;
  inProgress: boolean;
}

export type SyncCallback = (progress: SyncProgress) => void;

class BackgroundSyncManager {
  private isSyncing = false;
  private syncCallbacks: Set<SyncCallback> = new Set();

  // 同期状態のリスナーを追加
  addSyncListener(callback: SyncCallback): () => void {
    this.syncCallbacks.add(callback);

    // リスナーを削除する関数を返す
    return () => {
      this.syncCallbacks.delete(callback);
    };
  }

  // 同期進捗を通知
  private notifyProgress(progress: SyncProgress): void {
    this.syncCallbacks.forEach((callback) => callback(progress));
  }

  // 全ての未同期データを同期
  async syncAll(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return { success: 0, failed: 0 };
    }

    // オフラインの場合は同期をスキップ
    if (!navigator.onLine) {
      console.log('Cannot sync: offline');
      toast.warning('オフラインのため同期できません');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;

    try {
      const [drafts, actions] = await Promise.all([
        getUnsyncedDrafts(),
        getUnsyncedActions(),
      ]);

      const total = drafts.length + actions.length;

      if (total === 0) {
        this.isSyncing = false;
        return { success: 0, failed: 0 };
      }

      let synced = 0;
      let failed = 0;

      // 初期進捗を通知
      this.notifyProgress({
        total,
        synced: 0,
        failed: 0,
        inProgress: true,
      });

      // ドラフトを同期
      for (const draft of drafts) {
        try {
          await this.syncDraft(draft);
          synced++;

          this.notifyProgress({
            total,
            synced,
            failed,
            inProgress: true,
          });
        } catch (error) {
          console.error('Failed to sync draft:', draft.id, error);
          failed++;

          this.notifyProgress({
            total,
            synced,
            failed,
            inProgress: true,
          });
        }
      }

      // アクションを同期
      for (const action of actions) {
        try {
          await this.syncAction(action);
          synced++;

          this.notifyProgress({
            total,
            synced,
            failed,
            inProgress: true,
          });
        } catch (error) {
          console.error('Failed to sync action:', action.id, error);
          failed++;

          this.notifyProgress({
            total,
            synced,
            failed,
            inProgress: true,
          });
        }
      }

      // 完了を通知
      this.notifyProgress({
        total,
        synced,
        failed,
        inProgress: false,
      });

      if (synced > 0) {
        toast.success(`${synced}件のデータを同期しました`);
      }

      if (failed > 0) {
        toast.error(`${failed}件の同期に失敗しました`);
      }

      return { success: synced, failed };
    } finally {
      this.isSyncing = false;
    }
  }

  // ドラフトを同期
  private async syncDraft(draft: any): Promise<void> {
    // ドラフトのタイプに応じてAPIエンドポイントを決定
    let endpoint = '';
    switch (draft.type) {
      case 'workflow':
        endpoint = '/api/workflows';
        break;
      case 'attendance':
        endpoint = '/api/attendance';
        break;
      case 'leave':
        endpoint = '/api/leave/requests';
        break;
      case 'expense':
        endpoint = '/api/expenses';
        break;
      default:
        throw new Error(`Unknown draft type: ${draft.type}`);
    }

    // APIに送信（実際のAPI実装時に有効化）
    // const response = await fetch(endpoint, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(draft.data),
    // });

    // if (!response.ok) {
    //   throw new Error(`Failed to sync draft: ${response.statusText}`);
    // }

    // 開発環境ではシミュレーション
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 成功したらドラフトを同期済みにマーク
    await markDraftAsSynced(draft.id);
  }

  // アクションを同期
  private async syncAction(action: any): Promise<void> {
    try {
      // APIに送信（実際のAPI実装時に有効化）
      // const response = await fetch(action.endpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(action.data),
      // });

      // if (!response.ok) {
      //   throw new Error(`Failed to sync action: ${response.statusText}`);
      // }

      // 開発環境ではシミュレーション
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 成功したらアクションを同期済みにマークまたは削除
      await markActionAsSynced(action.id);
      await deletePendingAction(action.id);
    } catch (error) {
      // リトライカウントを増やす
      const shouldRetry = await incrementActionRetry(action.id);

      if (!shouldRetry) {
        // 最大リトライ回数を超えた場合
        console.error('Action exceeded max retries:', action.id);
      }

      throw error;
    }
  }

  // オンライン復帰時の自動同期
  setupAutoSync(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // オンライン復帰時に自動同期
    window.addEventListener('online', () => {
      console.log('Network restored, starting auto-sync...');
      toast.info('接続が復旧しました。データを同期しています...');

      setTimeout(() => {
        this.syncAll();
      }, 1000);
    });

    // オフライン時の通知
    window.addEventListener('offline', () => {
      console.log('Network lost');
      toast.warning('オフラインになりました。データはローカルに保存されます。');
    });

    // ページ読み込み時にオンラインなら同期
    if (navigator.onLine) {
      setTimeout(() => {
        this.syncAll();
      }, 2000);
    }
  }

  // 同期中かどうか
  get isInProgress(): boolean {
    return this.isSyncing;
  }
}

// シングルトンインスタンス
export const syncManager = new BackgroundSyncManager();

// 自動同期のセットアップ（アプリ起動時に一度だけ呼び出す）
export function initBackgroundSync(): void {
  syncManager.setupAutoSync();
}
