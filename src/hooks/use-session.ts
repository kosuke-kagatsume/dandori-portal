/**
 * useSession フック
 *
 * セッション管理をReactコンポーネントで使用するためのフック
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSessionManager } from '@/lib/session/session-manager';

/**
 * セッション状態
 */
interface SessionState {
  /** セッションが有効かどうか */
  isValid: boolean;
  /** アイドル状態かどうか */
  isIdle: boolean;
  /** 残り時間（ミリ秒） */
  remainingTime: number;
  /** アイドル時間（ミリ秒） */
  idleTime: number;
  /** ユーザーID */
  userId?: string;
}

/**
 * セッション操作
 */
interface SessionActions {
  /** セッションを開始 */
  startSession: (userId?: string, metadata?: Record<string, unknown>) => void;
  /** セッションを終了 */
  endSession: () => void;
  /** セッションをリフレッシュ */
  refreshSession: () => void;
  /** アクティビティを記録 */
  recordActivity: () => void;
}

/**
 * useSession の戻り値
 */
interface UseSessionReturn extends SessionState, SessionActions {}

/**
 * セッション管理フック
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     isValid,
 *     isIdle,
 *     remainingTime,
 *     startSession,
 *     endSession,
 *     refreshSession,
 *   } = useSession();
 *
 *   useEffect(() => {
 *     if (user) {
 *       startSession(user.id);
 *     }
 *   }, [user]);
 *
 *   return (
 *     <div>
 *       <p>Session valid: {isValid ? 'Yes' : 'No'}</p>
 *       <p>Remaining time: {Math.floor(remainingTime / 1000 / 60)} minutes</p>
 *       <button onClick={refreshSession}>Refresh Session</button>
 *       <button onClick={endSession}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSession(): UseSessionReturn {
  const [sessionState, setSessionState] = useState<SessionState>({
    isValid: false,
    isIdle: true,
    remainingTime: 0,
    idleTime: 0,
  });

  // セッション状態を更新
  const updateSessionState = useCallback(() => {
    const manager = getSessionManager();
    const session = manager.getSession();

    setSessionState({
      isValid: manager.isSessionValid(),
      isIdle: manager.isIdle(),
      remainingTime: manager.getRemainingTime(),
      idleTime: manager.getIdleTime(),
      userId: session?.userId,
    });
  }, []);

  // セッションを開始
  const startSession = useCallback(
    (userId?: string, metadata?: Record<string, unknown>) => {
      const manager = getSessionManager();
      manager.startSession(userId, metadata);
      updateSessionState();
    },
    [updateSessionState]
  );

  // セッションを終了
  const endSession = useCallback(() => {
    const manager = getSessionManager();
    manager.endSession();
    updateSessionState();
  }, [updateSessionState]);

  // セッションをリフレッシュ
  const refreshSession = useCallback(() => {
    const manager = getSessionManager();
    manager.refreshSession();
    updateSessionState();
  }, [updateSessionState]);

  // アクティビティを記録
  const recordActivity = useCallback(() => {
    const manager = getSessionManager();
    manager.recordActivity();
    updateSessionState();
  }, [updateSessionState]);

  // 初回マウント時とタイマー設定
  useEffect(() => {
    // 初回状態更新
    updateSessionState();

    // 1秒ごとに状態を更新
    const interval = setInterval(updateSessionState, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [updateSessionState]);

  return {
    ...sessionState,
    startSession,
    endSession,
    refreshSession,
    recordActivity,
  };
}

/**
 * セッションタイマー表示用のフック
 *
 * @example
 * ```tsx
 * function SessionTimer() {
 *   const { minutes, seconds, isExpiringSoon } = useSessionTimer();
 *
 *   return (
 *     <div className={isExpiringSoon ? 'text-red-500' : ''}>
 *       Session expires in: {minutes}:{seconds.toString().padStart(2, '0')}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSessionTimer(warningThreshold = 5 * 60 * 1000) {
  const { remainingTime } = useSession();

  const minutes = Math.floor(remainingTime / 1000 / 60);
  const seconds = Math.floor((remainingTime / 1000) % 60);
  const hours = Math.floor(minutes / 60);
  const isExpiringSoon = remainingTime <= warningThreshold && remainingTime > 0;

  return {
    remainingTime,
    hours,
    minutes: minutes % 60,
    seconds,
    isExpiringSoon,
  };
}

/**
 * アイドル警告用のフック
 *
 * @example
 * ```tsx
 * function IdleWarning() {
 *   const showWarning = useIdleWarning(25 * 60 * 1000); // 25分でwarning
 *
 *   if (!showWarning) return null;
 *
 *   return (
 *     <Dialog>
 *       <p>You've been idle for a while. Click to stay logged in.</p>
 *       <Button onClick={() => window.location.reload()}>Stay Logged In</Button>
 *     </Dialog>
 *   );
 * }
 * ```
 */
export function useIdleWarning(warningThreshold = 25 * 60 * 1000): boolean {
  const { idleTime, isValid } = useSession();
  return isValid && idleTime >= warningThreshold;
}
