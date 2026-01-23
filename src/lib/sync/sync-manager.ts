/**
 * Sync Manager
 *
 * バックエンドとのデータ同期を管理
 * - 楽観的更新（Optimistic Update）
 * - データキャッシュ
 * - コンフリクト解決
 * - オフライン時のキューイング
 */

/**
 * 同期操作の種類
 */
export type SyncOperation = 'create' | 'update' | 'delete';

/**
 * 同期アイテム
 */
interface SyncItem<T = unknown> {
  /** 一意のID */
  id: string;
  /** エンドポイント */
  endpoint: string;
  /** 操作種類 */
  operation: SyncOperation;
  /** データ */
  data: T;
  /** タイムスタンプ */
  timestamp: number;
  /** リトライ回数 */
  retries: number;
  /** 最後のエラー */
  lastError?: string;
}

/**
 * キャッシュアイテム
 */
interface CacheItem<T = unknown> {
  /** データ */
  data: T;
  /** タイムスタンプ */
  timestamp: number;
  /** 有効期限（ミリ秒） */
  expiresAt: number;
}

/**
 * 同期設定
 */
interface SyncConfig {
  /** 最大リトライ回数 */
  maxRetries?: number;
  /** リトライ遅延（ミリ秒） */
  retryDelay?: number;
  /** キャッシュ有効期限（ミリ秒） */
  cacheTTL?: number;
  /** 同期失敗時のコールバック */
  onSyncError?: (error: Error, item: SyncItem) => void;
  /** 同期成功時のコールバック */
  onSyncSuccess?: (item: SyncItem) => void;
}

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG: Required<SyncConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  cacheTTL: 5 * 60 * 1000, // 5分
  onSyncError: () => {},
  onSyncSuccess: () => {},
};

/**
 * 同期マネージャークラス
 */
export class SyncManager {
  private config: Required<SyncConfig>;
  private syncQueue: Map<string, SyncItem> = new Map();
  private cache: Map<string, CacheItem> = new Map();
  private isSyncing = false;
  private storageKey = 'sync_queue';
  private cacheKey = 'sync_cache';

  constructor(config: SyncConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // localStorageから復元
    this.restoreFromStorage();
  }

  // --------------------------------------------------------------------------
  // 楽観的更新（Optimistic Update）
  // --------------------------------------------------------------------------

  /**
   * 楽観的更新を実行
   *
   * @param endpoint APIエンドポイント
   * @param operation 操作種類
   * @param data データ
   * @param optimisticData 楽観的に表示するデータ
   * @returns 操作ID
   */
  async optimisticUpdate<T>(
    endpoint: string,
    operation: SyncOperation,
    data: T,
    optimisticData?: T
  ): Promise<string> {
    const id = this.generateId();

    // 楽観的データをキャッシュに即座に反映
    if (optimisticData) {
      this.setCache(endpoint, optimisticData);
    }

    // 同期キューに追加
    const item: SyncItem<T> = {
      id,
      endpoint,
      operation,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.syncQueue.set(id, item);
    this.saveToStorage();

    // バックグラウンドで同期を開始
    this.startSync();

    return id;
  }

  /**
   * 楽観的更新をロールバック
   *
   * @param id 操作ID
   */
  rollbackOptimisticUpdate(id: string): void {
    const item = this.syncQueue.get(id);
    if (item) {
      // キャッシュから削除
      this.cache.delete(item.endpoint);
      // キューから削除
      this.syncQueue.delete(id);
      this.saveToStorage();
    }
  }

  // --------------------------------------------------------------------------
  // データキャッシュ
  // --------------------------------------------------------------------------

  /**
   * キャッシュを設定
   *
   * @param key キー
   * @param data データ
   * @param ttl 有効期限（ミリ秒）
   */
  setCache<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.cacheTTL);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });

    this.saveCacheToStorage();
  }

  /**
   * キャッシュを取得
   *
   * @param key キー
   * @returns データ（キャッシュがない場合はnull）
   */
  getCache<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // 有効期限チェック
    const now = Date.now();
    if (now >= item.expiresAt) {
      this.cache.delete(key);
      this.saveCacheToStorage();
      return null;
    }

    return item.data as T;
  }

  /**
   * キャッシュをクリア
   *
   * @param key キー（指定しない場合は全てクリア）
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }

    this.saveCacheToStorage();
  }

  /**
   * キャッシュが有効かチェック
   *
   * @param key キー
   * @returns 有効な場合true
   */
  isCacheValid(key: string): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    const now = Date.now();
    return now < item.expiresAt;
  }

  // --------------------------------------------------------------------------
  // 同期処理
  // --------------------------------------------------------------------------

  /**
   * 同期を開始
   */
  private async startSync(): Promise<void> {
    if (this.isSyncing || this.syncQueue.size === 0) {
      return;
    }

    this.isSyncing = true;

    try {
      // キューのアイテムを順番に処理
      for (const [id, item] of Array.from(this.syncQueue.entries())) {
        try {
          await this.syncItem(item);

          // 成功したらキューから削除
          this.syncQueue.delete(id);
          this.config.onSyncSuccess(item);
        } catch (error) {
          console.error('[SyncManager] Sync failed:', error);

          // リトライ回数をインクリメント
          item.retries++;
          item.lastError = error instanceof Error ? error.message : 'Unknown error';

          // 最大リトライ回数に達したらキューから削除
          if (item.retries >= this.config.maxRetries) {
            this.syncQueue.delete(id);
            this.config.onSyncError(
              error instanceof Error ? error : new Error('Unknown error'),
              item
            );
          }
        }
      }
    } finally {
      this.isSyncing = false;
      this.saveToStorage();
    }
  }

  /**
   * アイテムを同期
   *
   * @param item 同期アイテム
   */
  private async syncItem(item: SyncItem): Promise<void> {
    // 実際のAPI呼び出しはここで行う
    // TODO: API Clientを使用して実装
    console.log('[SyncManager] Syncing item:', item);

    // シミュレーション（実際の実装ではAPI Clientを使用）
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * 手動で同期を実行
   */
  async sync(): Promise<void> {
    await this.startSync();
  }

  /**
   * 同期キューを取得
   */
  getSyncQueue(): SyncItem[] {
    return Array.from(this.syncQueue.values());
  }

  /**
   * 同期キューのサイズを取得
   */
  getSyncQueueSize(): number {
    return this.syncQueue.size;
  }

  /**
   * 同期中かチェック
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  // --------------------------------------------------------------------------
  // ストレージ管理
  // --------------------------------------------------------------------------

  /**
   * localStorageに保存
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const data = Array.from(this.syncQueue.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('[SyncManager] Failed to save to storage:', error);
    }
  }

  /**
   * localStorageから復元
   */
  private restoreFromStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const entries: [string, SyncItem][] = JSON.parse(data);
        this.syncQueue = new Map(entries);
      }

      // キャッシュも復元
      const cacheData = localStorage.getItem(this.cacheKey);
      if (cacheData) {
        const cacheEntries: [string, CacheItem][] = JSON.parse(cacheData);
        this.cache = new Map(cacheEntries);
      }
    } catch (error) {
      console.error('[SyncManager] Failed to restore from storage:', error);
    }
  }

  /**
   * キャッシュをlocalStorageに保存
   */
  private saveCacheToStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem(this.cacheKey, JSON.stringify(data));
    } catch (error) {
      console.error('[SyncManager] Failed to save cache to storage:', error);
    }
  }

  // --------------------------------------------------------------------------
  // ユーティリティ
  // --------------------------------------------------------------------------

  /**
   * 一意のIDを生成
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// シングルトンインスタンス
// ============================================================================

/**
 * デフォルト同期マネージャーインスタンス
 */
let defaultManager: SyncManager | null = null;

/**
 * デフォルト同期マネージャーを取得
 */
export function getSyncManager(config?: SyncConfig): SyncManager {
  if (!defaultManager) {
    defaultManager = new SyncManager(config);
  }

  return defaultManager;
}

/**
 * 同期マネージャーをリセット（テスト用）
 */
export function resetSyncManager(): void {
  defaultManager = null;
}
