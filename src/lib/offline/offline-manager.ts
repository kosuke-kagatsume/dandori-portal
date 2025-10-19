/**
 * Offline Manager
 *
 * オフライン対応機能
 * - オフライン検出
 * - オンライン復帰時の自動同期
 * - オフライン時のUI制御
 */

/**
 * オフライン設定
 */
interface OfflineConfig {
  /** オフライン時のコールバック */
  onOffline?: () => void;
  /** オンライン時のコールバック */
  onOnline?: () => void;
  /** 同期開始時のコールバック */
  onSyncStart?: () => void;
  /** 同期完了時のコールバック */
  onSyncComplete?: () => void;
}

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG: Required<OfflineConfig> = {
  onOffline: () => {},
  onOnline: () => {},
  onSyncStart: () => {},
  onSyncComplete: () => {},
};

/**
 * オフラインマネージャークラス
 */
export class OfflineManager {
  private config: Required<OfflineConfig>;
  private isOnline: boolean;
  private wasOffline = false;

  constructor(config: OfflineConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // 初期状態を設定
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // イベントリスナーを設定
    this.setupEventListeners();
  }

  // --------------------------------------------------------------------------
  // オンライン/オフライン検出
  // --------------------------------------------------------------------------

  /**
   * オンライン状態を取得
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * オフライン状態かチェック
   */
  isOffline(): boolean {
    return !this.isOnline;
  }

  /**
   * オンラインイベントハンドラー
   */
  private handleOnline = (): void => {
    console.log('[OfflineManager] Online');

    this.isOnline = true;
    this.config.onOnline();

    // オフラインから復帰した場合は同期を実行
    if (this.wasOffline) {
      this.syncAfterOnline();
      this.wasOffline = false;
    }
  };

  /**
   * オフラインイベントハンドラー
   */
  private handleOffline = (): void => {
    console.log('[OfflineManager] Offline');

    this.isOnline = false;
    this.wasOffline = true;
    this.config.onOffline();
  };

  /**
   * オンライン復帰後の同期
   */
  private async syncAfterOnline(): Promise<void> {
    console.log('[OfflineManager] Syncing after online');

    this.config.onSyncStart();

    try {
      // 実際の同期処理はここで行う
      // SyncManagerを使用してキューの同期を実行
      // TODO: SyncManagerとの統合

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('[OfflineManager] Sync completed');
      this.config.onSyncComplete();
    } catch (error) {
      console.error('[OfflineManager] Sync failed:', error);
    }
  }

  // --------------------------------------------------------------------------
  // イベントリスナー
  // --------------------------------------------------------------------------

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * イベントリスナーをクリーンアップ
   */
  destroy(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}

// ============================================================================
// シングルトンインスタンス
// ============================================================================

/**
 * デフォルトオフラインマネージャーインスタンス
 */
let defaultManager: OfflineManager | null = null;

/**
 * デフォルトオフラインマネージャーを取得
 */
export function getOfflineManager(config?: OfflineConfig): OfflineManager {
  if (!defaultManager) {
    defaultManager = new OfflineManager({
      onOffline: () => {
        console.log('[OfflineManager] You are offline');
        // UI通知などを表示
      },
      onOnline: () => {
        console.log('[OfflineManager] You are back online');
        // UI通知などを表示
      },
      onSyncStart: () => {
        console.log('[OfflineManager] Syncing pending changes...');
      },
      onSyncComplete: () => {
        console.log('[OfflineManager] Sync completed');
      },
      ...config,
    });
  }

  return defaultManager;
}

/**
 * オフラインマネージャーをリセット（テスト用）
 */
export function resetOfflineManager(): void {
  if (defaultManager) {
    defaultManager.destroy();
    defaultManager = null;
  }
}
