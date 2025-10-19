/**
 * SessionManager Tests
 *
 * セッション管理機能のユニットテスト
 */

import { SessionManager, getSessionManager, resetSessionManager } from '../session-manager';

describe('SessionManager', () => {
  let manager: SessionManager;

  beforeEach(() => {
    // ローカルストレージをクリア
    localStorage.clear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    if (manager) {
      manager.destroy();
    }
    resetSessionManager();
    jest.useRealTimers();
  });

  describe('セッション開始', () => {
    it('セッションを正常に開始できる', () => {
      manager = new SessionManager();
      manager.startSession('user-123', { role: 'admin' });

      const session = manager.getSession();
      expect(session).not.toBeNull();
      expect(session?.userId).toBe('user-123');
      expect(session?.metadata?.role).toBe('admin');
    });

    it('セッション開始時に有効期限が設定される', () => {
      manager = new SessionManager({
        sessionTimeout: 24 * 60 * 60 * 1000, // 24時間
      });

      manager.startSession('user-123');

      const session = manager.getSession();
      expect(session?.expiresAt).toBeGreaterThan(Date.now());
    });

    it('セッションがlocalStorageに保存される', () => {
      manager = new SessionManager();
      manager.startSession('user-123');

      const saved = localStorage.getItem('session_data');
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed.userId).toBe('user-123');
    });
  });

  describe('セッション有効性チェック', () => {
    it('有効なセッションがtrueを返す', () => {
      manager = new SessionManager({
        sessionTimeout: 24 * 60 * 60 * 1000,
      });

      manager.startSession('user-123');
      expect(manager.isSessionValid()).toBe(true);
    });

    it('期限切れセッションがfalseを返す', () => {
      manager = new SessionManager({
        sessionTimeout: 1000, // 1秒
      });

      manager.startSession('user-123');

      // 2秒進める
      jest.advanceTimersByTime(2000);

      expect(manager.isSessionValid()).toBe(false);
    });

    it('セッションがない場合はfalseを返す', () => {
      manager = new SessionManager();
      expect(manager.isSessionValid()).toBe(false);
    });
  });

  describe('アイドルタイムアウト', () => {
    it('アクティビティがない場合isIdleがtrueになる', () => {
      manager = new SessionManager({
        idleTimeout: 1000, // 1秒
      });

      manager.startSession('user-123');

      // 2秒進める
      jest.advanceTimersByTime(2000);

      expect(manager.isIdle()).toBe(true);
    });

    it('recordActivity後にisIdleがfalseになる', () => {
      manager = new SessionManager({
        idleTimeout: 1000,
      });

      manager.startSession('user-123');
      manager.recordActivity();

      expect(manager.isIdle()).toBe(false);
    });

    it('アイドルタイムアウト時にonIdleTimeoutが呼ばれる', () => {
      const onIdleTimeout = jest.fn();

      manager = new SessionManager({
        idleTimeout: 1000,
        onIdleTimeout,
      });

      manager.startSession('user-123');

      // アイドルタイムアウトまで進める
      jest.advanceTimersByTime(1100);

      expect(onIdleTimeout).toHaveBeenCalled();
    });
  });

  describe('セッションリフレッシュ', () => {
    it('refreshSession()で有効期限が延長される', () => {
      manager = new SessionManager({
        sessionTimeout: 1000,
      });

      manager.startSession('user-123');

      const firstExpiry = manager.getSession()?.expiresAt;

      // 500ms進める
      jest.advanceTimersByTime(500);

      manager.refreshSession();

      const secondExpiry = manager.getSession()?.expiresAt;

      expect(secondExpiry).toBeGreaterThan(firstExpiry!);
    });

    it('refreshSession時にonSessionRefreshが呼ばれる', () => {
      const onSessionRefresh = jest.fn();

      manager = new SessionManager({
        onSessionRefresh,
      });

      manager.startSession('user-123');
      manager.refreshSession();

      expect(onSessionRefresh).toHaveBeenCalled();
    });
  });

  describe('セッション終了', () => {
    it('endSession()でセッションが削除される', () => {
      manager = new SessionManager();
      manager.startSession('user-123');

      manager.endSession();

      expect(manager.getSession()).toBeNull();
      expect(manager.isSessionValid()).toBe(false);
    });

    it('endSession()でlocalStorageがクリアされる', () => {
      manager = new SessionManager();
      manager.startSession('user-123');

      manager.endSession();

      const saved = localStorage.getItem('session_data');
      expect(saved).toBeNull();
    });
  });

  describe('残り時間計算', () => {
    it('getRemainingTime()が正しい残り時間を返す', () => {
      manager = new SessionManager({
        sessionTimeout: 10000, // 10秒
      });

      manager.startSession('user-123');

      const remaining = manager.getRemainingTime();
      expect(remaining).toBeGreaterThan(9000);
      expect(remaining).toBeLessThanOrEqual(10000);
    });

    it('セッションがない場合は0を返す', () => {
      manager = new SessionManager();
      expect(manager.getRemainingTime()).toBe(0);
    });
  });

  describe('アイドル時間計算', () => {
    it('getIdleTime()が正しいアイドル時間を返す', () => {
      manager = new SessionManager();
      manager.startSession('user-123');

      // 5秒進める
      jest.advanceTimersByTime(5000);

      const idleTime = manager.getIdleTime();
      expect(idleTime).toBeGreaterThanOrEqual(5000);
    });

    it('recordActivity後にアイドル時間がリセットされる', () => {
      manager = new SessionManager();
      manager.startSession('user-123');

      // 5秒進める
      jest.advanceTimersByTime(5000);

      manager.recordActivity();

      const idleTime = manager.getIdleTime();
      expect(idleTime).toBeLessThan(1000);
    });
  });

  describe('シングルトンインスタンス', () => {
    it('getSessionManager()が同じインスタンスを返す', () => {
      const manager1 = getSessionManager();
      const manager2 = getSessionManager();

      expect(manager1).toBe(manager2);

      manager1.destroy();
      resetSessionManager();
    });

    it('resetSessionManager()で新しいインスタンスが作成される', () => {
      const manager1 = getSessionManager();
      manager1.destroy();
      resetSessionManager();

      const manager2 = getSessionManager();

      expect(manager1).not.toBe(manager2);

      manager2.destroy();
      resetSessionManager();
    });
  });

  describe('ストレージからの復元', () => {
    it('localStorageから有効なセッションを復元できる', () => {
      // 最初のマネージャーでセッションを作成
      const manager1 = new SessionManager();
      manager1.startSession('user-123', { role: 'admin' });
      manager1.destroy();

      // 新しいマネージャーで復元
      const manager2 = new SessionManager();

      const session = manager2.getSession();
      expect(session?.userId).toBe('user-123');
      expect(session?.metadata?.role).toBe('admin');

      manager2.destroy();
    });

    it('期限切れセッションは復元されない', () => {
      // 期限切れのセッションをlocalStorageに保存
      const expiredSession = {
        startedAt: Date.now() - 100000,
        lastActivityAt: Date.now() - 100000,
        expiresAt: Date.now() - 50000, // 既に期限切れ
        userId: 'user-123',
      };

      localStorage.setItem('session_data', JSON.stringify(expiredSession));

      const manager = new SessionManager();

      expect(manager.getSession()).toBeNull();
      expect(manager.isSessionValid()).toBe(false);

      manager.destroy();
    });
  });
});
