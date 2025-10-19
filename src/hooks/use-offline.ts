/**
 * useOffline フック
 *
 * オフライン検出をReactコンポーネントで使用するためのフック
 */

'use client';

import { useEffect, useState } from 'react';
import { getOfflineManager } from '@/lib/offline/offline-manager';

/**
 * オフライン状態
 */
interface OfflineState {
  /** オンライン状態 */
  isOnline: boolean;
  /** オフライン状態 */
  isOffline: boolean;
  /** 同期中かどうか */
  isSyncing: boolean;
}

/**
 * オフライン検出フック
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOnline, isOffline, isSyncing } = useOffline();
 *
 *   return (
 *     <div>
 *       {isOffline && (
 *         <Alert variant="warning">
 *           You are offline. Changes will be synced when you're back online.
 *         </Alert>
 *       )}
 *       {isSyncing && (
 *         <div>Syncing changes...</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOffline(): OfflineState {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const manager = getOfflineManager({
      onOffline: () => {
        setIsOnline(false);
      },
      onOnline: () => {
        setIsOnline(true);
      },
      onSyncStart: () => {
        setIsSyncing(true);
      },
      onSyncComplete: () => {
        setIsSyncing(false);
      },
    });

    // 初期状態を設定
    setIsOnline(manager.getOnlineStatus());

    return () => {
      manager.destroy();
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    isSyncing,
  };
}

/**
 * オンライン状態のみを返すシンプルなフック
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isOnline = useOnlineStatus();
 *
 *   return (
 *     <div>
 *       Status: {isOnline ? 'Online' : 'Offline'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOnlineStatus(): boolean {
  const { isOnline } = useOffline();
  return isOnline;
}
