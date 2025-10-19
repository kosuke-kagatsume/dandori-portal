/**
 * OfflineManager Tests
 *
 * オフライン検出機能のユニットテスト
 */

import { OfflineManager, getOfflineManager, resetOfflineManager } from '../offline-manager';

// navigator.onLine のモック
Object.defineProperty(window.navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('OfflineManager', () => {
  let manager: OfflineManager;

  beforeEach(() => {
    // navigator.onLine を true に初期化
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });

    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    if (manager) {
      manager.destroy();
    }
    resetOfflineManager();
    jest.useRealTimers();
  });

  describe('初期化', () => {
    it('オンライン状態で初期化される', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });

      manager = new OfflineManager();

      expect(manager.getOnlineStatus()).toBe(true);
      expect(manager.isOffline()).toBe(false);
    });

    it('オフライン状態で初期化される', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      manager = new OfflineManager();

      expect(manager.getOnlineStatus()).toBe(false);
      expect(manager.isOffline()).toBe(true);
    });
  });

  describe('オンライン/オフライン検出', () => {
    it('getOnlineStatus()が正しい状態を返す', () => {
      manager = new OfflineManager();

      expect(manager.getOnlineStatus()).toBe(true);
    });

    it('isOffline()が正しい状態を返す', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      manager = new OfflineManager();

      expect(manager.isOffline()).toBe(true);
    });
  });

  describe('オフラインイベント', () => {
    it('オフラインイベントが検出される', () => {
      const onOffline = jest.fn();

      manager = new OfflineManager({
        onOffline,
      });

      // オフラインイベントをディスパッチ
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));

      expect(onOffline).toHaveBeenCalled();
      expect(manager.isOffline()).toBe(true);
    });

    it('オフライン時にonOfflineコールバックが呼ばれる', () => {
      const onOffline = jest.fn();

      manager = new OfflineManager({
        onOffline,
      });

      // オフラインにする
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));

      expect(onOffline).toHaveBeenCalledTimes(1);
    });
  });

  describe('オンラインイベント', () => {
    it('オンラインイベントが検出される', () => {
      // オフラインで開始
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const onOnline = jest.fn();

      manager = new OfflineManager({
        onOnline,
      });

      // オンラインにする
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));

      expect(onOnline).toHaveBeenCalled();
      expect(manager.getOnlineStatus()).toBe(true);
    });

    it('オンライン時にonOnlineコールバックが呼ばれる', () => {
      // オフラインで開始
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const onOnline = jest.fn();

      manager = new OfflineManager({
        onOnline,
      });

      // オンラインにする
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));

      expect(onOnline).toHaveBeenCalledTimes(1);
    });
  });

  describe('オンライン復帰後の同期', () => {
    it('オフラインからオンラインに復帰すると同期が開始される', async () => {
      const onSyncStart = jest.fn();
      const onSyncComplete = jest.fn();

      manager = new OfflineManager({
        onSyncStart,
        onSyncComplete,
      });

      // オフラインにする
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));

      // オンラインに復帰
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));

      // タイマーを進めて同期を完了
      await jest.runAllTimersAsync();

      expect(onSyncStart).toHaveBeenCalled();
      expect(onSyncComplete).toHaveBeenCalled();
    });

    it('オンライン→オンラインの場合は同期しない', () => {
      const onSyncStart = jest.fn();
      const onSyncComplete = jest.fn();

      manager = new OfflineManager({
        onSyncStart,
        onSyncComplete,
      });

      // オンラインのまま online イベントを発火
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));

      expect(onSyncStart).not.toHaveBeenCalled();
      expect(onSyncComplete).not.toHaveBeenCalled();
    });
  });

  describe('イベントリスナー管理', () => {
    it('destroy()でイベントリスナーが削除される', () => {
      const onOffline = jest.fn();
      const onOnline = jest.fn();

      manager = new OfflineManager({
        onOffline,
        onOnline,
      });

      // destroy を呼ぶ
      manager.destroy();

      // イベントを発火しても反応しない
      window.dispatchEvent(new Event('offline'));
      window.dispatchEvent(new Event('online'));

      expect(onOffline).not.toHaveBeenCalled();
      expect(onOnline).not.toHaveBeenCalled();
    });
  });

  describe('コールバック設定', () => {
    it('全てのコールバックが正しく設定される', () => {
      const onOffline = jest.fn();
      const onOnline = jest.fn();
      const onSyncStart = jest.fn();
      const onSyncComplete = jest.fn();

      manager = new OfflineManager({
        onOffline,
        onOnline,
        onSyncStart,
        onSyncComplete,
      });

      expect(manager).toBeDefined();
    });

    it('コールバックなしで初期化できる', () => {
      manager = new OfflineManager();

      expect(manager).toBeDefined();
      expect(manager.getOnlineStatus()).toBe(true);
    });

    it('部分的なコールバック設定で初期化できる', () => {
      const onOffline = jest.fn();

      manager = new OfflineManager({
        onOffline,
      });

      expect(manager).toBeDefined();

      // オフラインイベント
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));

      expect(onOffline).toHaveBeenCalled();
    });
  });

  describe('シングルトンインスタンス', () => {
    it('getOfflineManager()が同じインスタンスを返す', () => {
      const manager1 = getOfflineManager();
      const manager2 = getOfflineManager();

      expect(manager1).toBe(manager2);

      manager1.destroy();
      resetOfflineManager();
    });

    it('resetOfflineManager()で新しいインスタンスが作成される', () => {
      const manager1 = getOfflineManager();
      manager1.destroy();
      resetOfflineManager();

      const manager2 = getOfflineManager();

      expect(manager1).not.toBe(manager2);

      manager2.destroy();
      resetOfflineManager();
    });

    it('getOfflineManager()にカスタム設定を渡せる', () => {
      const onOffline = jest.fn();

      const manager = getOfflineManager({
        onOffline,
      });

      expect(manager).toBeDefined();

      manager.destroy();
      resetOfflineManager();
    });
  });

  describe('複数のイベント処理', () => {
    it('オフライン→オンライン→オフラインのサイクルが正しく動作する', async () => {
      const onOffline = jest.fn();
      const onOnline = jest.fn();
      const onSyncStart = jest.fn();
      const onSyncComplete = jest.fn();

      manager = new OfflineManager({
        onOffline,
        onOnline,
        onSyncStart,
        onSyncComplete,
      });

      // オフラインにする
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));

      expect(manager.isOffline()).toBe(true);
      expect(onOffline).toHaveBeenCalledTimes(1);

      // オンラインに復帰
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));

      // タイマーを進めて同期を完了
      await jest.runAllTimersAsync();

      expect(manager.getOnlineStatus()).toBe(true);
      expect(onOnline).toHaveBeenCalledTimes(1);
      expect(onSyncStart).toHaveBeenCalledTimes(1);
      expect(onSyncComplete).toHaveBeenCalledTimes(1);

      // 再度オフラインにする
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));

      expect(manager.isOffline()).toBe(true);
      expect(onOffline).toHaveBeenCalledTimes(2);
    });
  });
});
