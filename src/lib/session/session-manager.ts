/**
 * Session Manager
 *
 * セッション管理とアイドルタイムアウト機能
 * - セッション有効期限の管理
 * - アイドルタイムアウト（一定時間操作がない場合の自動ログアウト）
 * - ブラウザタブ間でのセッション同期
 * - セッションストレージの実装
 */

/**
 * セッション設定
 */
interface SessionConfig {
  /** セッション有効期限（ミリ秒） */
  sessionTimeout?: number;
  /** アイドルタイムアウト（ミリ秒） */
  idleTimeout?: number;
  /** セッション期限切れ時のコールバック */
  onSessionExpired?: () => void;
  /** アイドルタイムアウト時のコールバック */
  onIdleTimeout?: () => void;
  /** セッション更新時のコールバック */
  onSessionRefresh?: () => void;
}

/**
 * セッションデータ
 */
interface SessionData {
  /** セッション開始時刻 */
  startedAt: number;
  /** 最終アクティビティ時刻 */
  lastActivityAt: number;
  /** セッション有効期限 */
  expiresAt: number;
  /** ユーザーID */
  userId?: string;
  /** メタデータ */
  metadata?: Record<string, unknown>;
}

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG: Required<SessionConfig> = {
  sessionTimeout: 24 * 60 * 60 * 1000, // 24時間
  idleTimeout: 30 * 60 * 1000, // 30分
  onSessionExpired: () => {},
  onIdleTimeout: () => {},
  onSessionRefresh: () => {},
};

/**
 * セッション管理クラス
 */
export class SessionManager {
  private config: Required<SessionConfig>;
  private sessionData: SessionData | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private sessionTimer: NodeJS.Timeout | null = null;
  private storageKey = 'session_data';
  private storageEventKey = 'session_sync';
  private activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];

  constructor(config: SessionConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // localStorageからセッションを復元
    this.restoreSession();

    // アクティビティイベントリスナーを設定
    this.setupActivityListeners();

    // タブ間同期のリスナーを設定
    this.setupStorageListener();
  }

  // --------------------------------------------------------------------------
  // セッション管理
  // --------------------------------------------------------------------------

  /**
   * セッションを開始
   */
  startSession(userId?: string, metadata?: Record<string, unknown>): void {
    const now = Date.now();

    this.sessionData = {
      startedAt: now,
      lastActivityAt: now,
      expiresAt: now + this.config.sessionTimeout,
      userId,
      metadata,
    };

    this.saveSession();
    this.startTimers();

    console.log('[SessionManager] Session started', {
      userId,
      expiresAt: new Date(this.sessionData.expiresAt).toISOString(),
    });
  }

  /**
   * セッションを終了
   */
  endSession(): void {
    this.sessionData = null;
    this.clearTimers();
    this.clearSession();

    console.log('[SessionManager] Session ended');
  }

  /**
   * セッションをリフレッシュ
   */
  refreshSession(): void {
    if (!this.sessionData) {
      return;
    }

    const now = Date.now();
    this.sessionData.lastActivityAt = now;
    this.sessionData.expiresAt = now + this.config.sessionTimeout;

    this.saveSession();
    this.config.onSessionRefresh();

    console.log('[SessionManager] Session refreshed', {
      expiresAt: new Date(this.sessionData.expiresAt).toISOString(),
    });
  }

  /**
   * アクティビティを記録
   */
  recordActivity(): void {
    if (!this.sessionData) {
      return;
    }

    const now = Date.now();
    this.sessionData.lastActivityAt = now;

    this.saveSession();
    this.resetIdleTimer();
  }

  /**
   * セッションが有効かチェック
   */
  isSessionValid(): boolean {
    if (!this.sessionData) {
      return false;
    }

    const now = Date.now();
    return now < this.sessionData.expiresAt;
  }

  /**
   * アイドル状態かチェック
   */
  isIdle(): boolean {
    if (!this.sessionData) {
      return true;
    }

    const now = Date.now();
    const idleTime = now - this.sessionData.lastActivityAt;
    return idleTime >= this.config.idleTimeout;
  }

  /**
   * セッション情報を取得
   */
  getSession(): SessionData | null {
    return this.sessionData;
  }

  /**
   * 残り時間を取得（ミリ秒）
   */
  getRemainingTime(): number {
    if (!this.sessionData) {
      return 0;
    }

    const now = Date.now();
    return Math.max(0, this.sessionData.expiresAt - now);
  }

  /**
   * アイドル時間を取得（ミリ秒）
   */
  getIdleTime(): number {
    if (!this.sessionData) {
      return 0;
    }

    const now = Date.now();
    return now - this.sessionData.lastActivityAt;
  }

  // --------------------------------------------------------------------------
  // タイマー管理
  // --------------------------------------------------------------------------

  /**
   * タイマーを開始
   */
  private startTimers(): void {
    this.resetIdleTimer();
    this.resetSessionTimer();
  }

  /**
   * タイマーをクリア
   */
  private clearTimers(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  /**
   * アイドルタイマーをリセット
   */
  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      console.log('[SessionManager] Idle timeout');
      this.config.onIdleTimeout();
      this.endSession();
    }, this.config.idleTimeout);
  }

  /**
   * セッションタイマーをリセット
   */
  private resetSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    if (!this.sessionData) {
      return;
    }

    const remainingTime = this.getRemainingTime();

    this.sessionTimer = setTimeout(() => {
      console.log('[SessionManager] Session expired');
      this.config.onSessionExpired();
      this.endSession();
    }, remainingTime);
  }

  // --------------------------------------------------------------------------
  // ストレージ管理
  // --------------------------------------------------------------------------

  /**
   * セッションを保存
   */
  private saveSession(): void {
    if (typeof window === 'undefined' || !this.sessionData) {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.sessionData));

      // タブ間同期のイベントを発火
      localStorage.setItem(this.storageEventKey, Date.now().toString());
    } catch (error) {
      console.error('[SessionManager] Failed to save session:', error);
    }
  }

  /**
   * セッションを復元
   */
  private restoreSession(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return;
      }

      const session = JSON.parse(data) as SessionData;

      // セッションが有効かチェック
      const now = Date.now();
      if (now >= session.expiresAt) {
        console.log('[SessionManager] Restored session is expired');
        this.clearSession();
        return;
      }

      this.sessionData = session;
      this.startTimers();

      console.log('[SessionManager] Session restored', {
        userId: session.userId,
        expiresAt: new Date(session.expiresAt).toISOString(),
      });
    } catch (error) {
      console.error('[SessionManager] Failed to restore session:', error);
      this.clearSession();
    }
  }

  /**
   * セッションをクリア
   */
  private clearSession(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.storageEventKey);
    } catch (error) {
      console.error('[SessionManager] Failed to clear session:', error);
    }
  }

  // --------------------------------------------------------------------------
  // イベントリスナー
  // --------------------------------------------------------------------------

  /**
   * アクティビティイベントリスナーを設定
   */
  private setupActivityListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const handleActivity = () => {
      this.recordActivity();
    };

    this.activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
  }

  /**
   * ストレージイベントリスナーを設定（タブ間同期）
   */
  private setupStorageListener(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('storage', (event) => {
      // 他のタブでセッション同期イベントが発生した場合
      if (event.key === this.storageEventKey) {
        console.log('[SessionManager] Session synced from another tab');
        this.restoreSession();
      }

      // 他のタブでセッションがクリアされた場合
      if (event.key === this.storageKey && event.newValue === null) {
        console.log('[SessionManager] Session cleared from another tab');
        this.endSession();
      }
    });
  }

  /**
   * クリーンアップ
   */
  destroy(): void {
    this.clearTimers();

    if (typeof window === 'undefined') {
      return;
    }

    const handleActivity = () => {
      this.recordActivity();
    };

    this.activityEvents.forEach((event) => {
      window.removeEventListener(event, handleActivity);
    });
  }
}

// ============================================================================
// シングルトンインスタンス
// ============================================================================

/**
 * デフォルトセッションマネージャーインスタンス
 */
let defaultManager: SessionManager | null = null;

/**
 * デフォルトセッションマネージャーを取得
 */
export function getSessionManager(config?: SessionConfig): SessionManager {
  if (!defaultManager) {
    defaultManager = new SessionManager({
      sessionTimeout: 24 * 60 * 60 * 1000, // 24時間
      idleTimeout: 30 * 60 * 1000, // 30分
      onSessionExpired: () => {
        console.log('[SessionManager] Session expired - redirecting to login');
        if (typeof window !== 'undefined') {
          // 現在のロケールをURLから取得
          const locale = window.location.pathname.split('/')[1] || 'ja';
          window.location.href = `/${locale}/auth/login`;
        }
      },
      onIdleTimeout: () => {
        console.log('[SessionManager] Idle timeout - logging out');
        if (typeof window !== 'undefined') {
          // 現在のロケールをURLから取得
          const locale = window.location.pathname.split('/')[1] || 'ja';
          window.location.href = `/${locale}/auth/login`;
        }
      },
      ...config,
    });
  }

  return defaultManager;
}

/**
 * セッションマネージャーをリセット（テスト用）
 */
export function resetSessionManager(): void {
  if (defaultManager) {
    defaultManager.destroy();
    defaultManager = null;
  }
}
