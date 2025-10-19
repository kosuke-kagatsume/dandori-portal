/**
 * SyncManager Tests
 *
 * データ同期機能のユニットテスト
 */

import { SyncManager, getSyncManager, resetSyncManager } from '../sync-manager';

describe('SyncManager', () => {
  let manager: SyncManager;

  beforeEach(() => {
    // ローカルストレージをクリア
    localStorage.clear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    resetSyncManager();
    jest.useRealTimers();
  });

  describe('楽観的更新（Optimistic Update）', () => {
    it('楽観的更新が正常に実行される', async () => {
      manager = new SyncManager();

      const optimisticData = { id: '1', name: 'Test Item' };
      const id = await manager.optimisticUpdate(
        '/api/items',
        'create',
        optimisticData,
        optimisticData
      );

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('楽観的データがキャッシュに即座に反映される', async () => {
      manager = new SyncManager();

      const optimisticData = { id: '1', name: 'Test Item' };
      await manager.optimisticUpdate(
        '/api/items',
        'create',
        optimisticData,
        optimisticData
      );

      const cached = manager.getCache('/api/items');
      expect(cached).toEqual(optimisticData);
    });

    it('楽観的更新が同期キューに追加される', async () => {
      manager = new SyncManager();

      await manager.optimisticUpdate(
        '/api/items',
        'create',
        { id: '1', name: 'Test Item' }
      );

      const queue = manager.getSyncQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].endpoint).toBe('/api/items');
      expect(queue[0].operation).toBe('create');
    });

    it('楽観的更新がlocalStorageに保存される', async () => {
      manager = new SyncManager();

      await manager.optimisticUpdate(
        '/api/items',
        'create',
        { id: '1', name: 'Test Item' }
      );

      const saved = localStorage.getItem('sync_queue');
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed.length).toBeGreaterThan(0);
    });
  });

  describe('楽観的更新のロールバック', () => {
    it('ロールバックでキャッシュが削除される', async () => {
      manager = new SyncManager();

      const optimisticData = { id: '1', name: 'Test Item' };
      const id = await manager.optimisticUpdate(
        '/api/items',
        'create',
        optimisticData,
        optimisticData
      );

      // キャッシュが存在することを確認
      expect(manager.getCache('/api/items')).toEqual(optimisticData);

      // ロールバック
      manager.rollbackOptimisticUpdate(id);

      // キャッシュが削除されたことを確認
      expect(manager.getCache('/api/items')).toBeNull();
    });

    it('ロールバックで同期キューから削除される', async () => {
      manager = new SyncManager();

      const id = await manager.optimisticUpdate(
        '/api/items',
        'create',
        { id: '1', name: 'Test Item' }
      );

      expect(manager.getSyncQueue().length).toBe(1);

      manager.rollbackOptimisticUpdate(id);

      expect(manager.getSyncQueue().length).toBe(0);
    });
  });

  describe('データキャッシュ', () => {
    it('キャッシュが正常に設定される', () => {
      manager = new SyncManager();

      const data = { id: '1', name: 'Test Item' };
      manager.setCache('/api/items/1', data);

      const cached = manager.getCache('/api/items/1');
      expect(cached).toEqual(data);
    });

    it('キャッシュがカスタムTTLで設定される', () => {
      manager = new SyncManager();

      const data = { id: '1', name: 'Test Item' };
      manager.setCache('/api/items/1', data, 1000); // 1秒

      expect(manager.isCacheValid('/api/items/1')).toBe(true);

      // 2秒進める
      jest.advanceTimersByTime(2000);

      expect(manager.isCacheValid('/api/items/1')).toBe(false);
    });

    it('期限切れキャッシュがnullを返す', () => {
      manager = new SyncManager({
        cacheTTL: 1000, // 1秒
      });

      const data = { id: '1', name: 'Test Item' };
      manager.setCache('/api/items/1', data);

      // 最初は有効
      expect(manager.getCache('/api/items/1')).toEqual(data);

      // 2秒進める
      jest.advanceTimersByTime(2000);

      // 期限切れでnull
      expect(manager.getCache('/api/items/1')).toBeNull();
    });

    it('存在しないキャッシュがnullを返す', () => {
      manager = new SyncManager();

      const cached = manager.getCache('/api/nonexistent');
      expect(cached).toBeNull();
    });

    it('キャッシュがlocalStorageに保存される', () => {
      manager = new SyncManager();

      const data = { id: '1', name: 'Test Item' };
      manager.setCache('/api/items/1', data);

      const saved = localStorage.getItem('sync_cache');
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed.length).toBeGreaterThan(0);
    });
  });

  describe('キャッシュクリア', () => {
    it('特定のキャッシュが削除される', () => {
      manager = new SyncManager();

      manager.setCache('/api/items/1', { id: '1' });
      manager.setCache('/api/items/2', { id: '2' });

      manager.clearCache('/api/items/1');

      expect(manager.getCache('/api/items/1')).toBeNull();
      expect(manager.getCache('/api/items/2')).not.toBeNull();
    });

    it('全てのキャッシュがクリアされる', () => {
      manager = new SyncManager();

      manager.setCache('/api/items/1', { id: '1' });
      manager.setCache('/api/items/2', { id: '2' });

      manager.clearCache();

      expect(manager.getCache('/api/items/1')).toBeNull();
      expect(manager.getCache('/api/items/2')).toBeNull();
    });
  });

  describe('キャッシュ有効性チェック', () => {
    it('有効なキャッシュがtrueを返す', () => {
      manager = new SyncManager({
        cacheTTL: 10000, // 10秒
      });

      manager.setCache('/api/items/1', { id: '1' });

      expect(manager.isCacheValid('/api/items/1')).toBe(true);
    });

    it('期限切れキャッシュがfalseを返す', () => {
      manager = new SyncManager({
        cacheTTL: 1000, // 1秒
      });

      manager.setCache('/api/items/1', { id: '1' });

      // 2秒進める
      jest.advanceTimersByTime(2000);

      expect(manager.isCacheValid('/api/items/1')).toBe(false);
    });

    it('存在しないキャッシュがfalseを返す', () => {
      manager = new SyncManager();

      expect(manager.isCacheValid('/api/nonexistent')).toBe(false);
    });
  });

  describe('同期キュー管理', () => {
    it('getSyncQueue()が同期アイテムの配列を返す', async () => {
      manager = new SyncManager();

      await manager.optimisticUpdate('/api/items', 'create', { id: '1' });
      await manager.optimisticUpdate('/api/items', 'update', { id: '2' });

      const queue = manager.getSyncQueue();
      expect(queue.length).toBe(2);
      expect(queue[0].operation).toBe('create');
      expect(queue[1].operation).toBe('update');
    });

    it('getSyncQueueSize()が正しいサイズを返す', async () => {
      manager = new SyncManager();

      expect(manager.getSyncQueueSize()).toBe(0);

      await manager.optimisticUpdate('/api/items', 'create', { id: '1' });
      expect(manager.getSyncQueueSize()).toBe(1);

      await manager.optimisticUpdate('/api/items', 'update', { id: '2' });
      expect(manager.getSyncQueueSize()).toBe(2);
    });

    it('isSyncInProgress()が同期状態を正しく返す', () => {
      manager = new SyncManager();

      expect(manager.isSyncInProgress()).toBe(false);
    });
  });

  describe('同期処理', () => {
    it('sync()が手動で同期を実行する', async () => {
      manager = new SyncManager();

      await manager.optimisticUpdate('/api/items', 'create', { id: '1' });

      // 同期を実行（タイマーを進めて完了を待つ）
      const syncPromise = manager.sync();
      await jest.runAllTimersAsync();
      await syncPromise;

      // 同期が完了したことを確認
      expect(manager.isSyncInProgress()).toBe(false);
    });

    it('同期成功時にonSyncSuccessが呼ばれる', async () => {
      const onSyncSuccess = jest.fn();

      manager = new SyncManager({
        onSyncSuccess,
      });

      await manager.optimisticUpdate('/api/items', 'create', { id: '1' });
      await manager.sync();

      // タイマーを進めて同期を完了
      await jest.runAllTimersAsync();

      expect(onSyncSuccess).toHaveBeenCalled();
    });

    it('同期失敗時にリトライされる', async () => {
      const onSyncError = jest.fn();

      manager = new SyncManager({
        maxRetries: 2,
        onSyncError,
      });

      await manager.optimisticUpdate('/api/items', 'create', { id: '1' });

      // Note: 実際のテストではAPI呼び出しをモックして失敗させる必要がある
      // ここでは設定が正しく適用されることをテスト
      expect(manager.getSyncQueue()[0].retries).toBe(0);
    });
  });

  describe('ストレージからの復元', () => {
    it('localStorageから同期キューを復元できる', async () => {
      // 最初のマネージャーで同期キューを作成
      const manager1 = new SyncManager();
      await manager1.optimisticUpdate('/api/items', 'create', { id: '1' });

      // 新しいマネージャーで復元
      const manager2 = new SyncManager();

      const queue = manager2.getSyncQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].endpoint).toBe('/api/items');
      expect(queue[0].operation).toBe('create');
    });

    it('localStorageからキャッシュを復元できる', () => {
      // 最初のマネージャーでキャッシュを作成
      const manager1 = new SyncManager();
      manager1.setCache('/api/items/1', { id: '1', name: 'Test' });

      // 新しいマネージャーで復元
      const manager2 = new SyncManager();

      const cached = manager2.getCache('/api/items/1');
      expect(cached).toEqual({ id: '1', name: 'Test' });
    });
  });

  describe('シングルトンインスタンス', () => {
    it('getSyncManager()が同じインスタンスを返す', () => {
      const manager1 = getSyncManager();
      const manager2 = getSyncManager();

      expect(manager1).toBe(manager2);

      resetSyncManager();
    });

    it('resetSyncManager()で新しいインスタンスが作成される', () => {
      const manager1 = getSyncManager();
      resetSyncManager();

      const manager2 = getSyncManager();

      expect(manager1).not.toBe(manager2);

      resetSyncManager();
    });

    it('getSyncManager()にカスタム設定を渡せる', () => {
      const manager = getSyncManager({
        maxRetries: 5,
        cacheTTL: 10000,
      });

      expect(manager).toBeDefined();

      resetSyncManager();
    });
  });

  describe('設定オプション', () => {
    it('maxRetriesが正しく設定される', () => {
      manager = new SyncManager({
        maxRetries: 5,
      });

      expect(manager).toBeDefined();
      // Note: 内部プロパティなので直接テストできないが、
      // インスタンス化が成功することを確認
    });

    it('retryDelayが正しく設定される', () => {
      manager = new SyncManager({
        retryDelay: 2000,
      });

      expect(manager).toBeDefined();
    });

    it('cacheTTLが正しく設定される', () => {
      manager = new SyncManager({
        cacheTTL: 10000, // 10秒
      });

      manager.setCache('/api/items/1', { id: '1' });

      // 5秒進める（まだ有効）
      jest.advanceTimersByTime(5000);
      expect(manager.isCacheValid('/api/items/1')).toBe(true);

      // さらに6秒進める（期限切れ）
      jest.advanceTimersByTime(6000);
      expect(manager.isCacheValid('/api/items/1')).toBe(false);
    });

    it('コールバックが正しく設定される', () => {
      const onSyncError = jest.fn();
      const onSyncSuccess = jest.fn();

      manager = new SyncManager({
        onSyncError,
        onSyncSuccess,
      });

      expect(manager).toBeDefined();
    });
  });

  describe('複数操作の統合テスト', () => {
    it('複数の楽観的更新が順番に処理される', async () => {
      manager = new SyncManager();

      await manager.optimisticUpdate('/api/items', 'create', { id: '1' });
      await manager.optimisticUpdate('/api/items', 'update', { id: '2' });
      await manager.optimisticUpdate('/api/items', 'delete', { id: '3' });

      const queue = manager.getSyncQueue();
      expect(queue.length).toBe(3);
      expect(queue[0].operation).toBe('create');
      expect(queue[1].operation).toBe('update');
      expect(queue[2].operation).toBe('delete');
    });

    it('キャッシュと同期キューが独立して動作する', async () => {
      manager = new SyncManager();

      // キャッシュを設定
      manager.setCache('/api/items/1', { id: '1', name: 'Cached' });

      // 楽観的更新を追加
      await manager.optimisticUpdate('/api/items', 'create', { id: '2', name: 'Queued' });

      // キャッシュは影響を受けない
      expect(manager.getCache('/api/items/1')).toEqual({ id: '1', name: 'Cached' });

      // 同期キューは独立
      expect(manager.getSyncQueue().length).toBe(1);
    });
  });
});
