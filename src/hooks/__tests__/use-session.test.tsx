/**
 * useSession Hook Tests
 *
 * セッション管理フックのユニットテスト
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSession, useSessionTimer, useIdleWarning } from '../use-session';
import * as SessionManagerModule from '@/lib/session/session-manager';

// SessionManagerのモック
const mockGetSession = jest.fn();
const mockIsSessionValid = jest.fn();
const mockIsIdle = jest.fn();
const mockGetRemainingTime = jest.fn();
const mockGetIdleTime = jest.fn();
const mockStartSession = jest.fn();
const mockEndSession = jest.fn();
const mockRefreshSession = jest.fn();
const mockRecordActivity = jest.fn();
const mockDestroy = jest.fn();

const mockSessionManager = {
  getSession: mockGetSession,
  isSessionValid: mockIsSessionValid,
  isIdle: mockIsIdle,
  getRemainingTime: mockGetRemainingTime,
  getIdleTime: mockGetIdleTime,
  startSession: mockStartSession,
  endSession: mockEndSession,
  refreshSession: mockRefreshSession,
  recordActivity: mockRecordActivity,
  destroy: mockDestroy,
};

// getSessionManagerをモック
jest.mock('@/lib/session/session-manager', () => ({
  getSessionManager: jest.fn(),
  resetSessionManager: jest.fn(),
  SessionManager: jest.fn(),
}));

describe('useSession', () => {
  beforeEach(() => {
    // デフォルト値を設定
    mockGetSession.mockReturnValue({
      userId: 'user-123',
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
      expiresAt: Date.now() + 60000,
    });
    mockIsSessionValid.mockReturnValue(true);
    mockIsIdle.mockReturnValue(false);
    mockGetRemainingTime.mockReturnValue(60000); // 1分
    mockGetIdleTime.mockReturnValue(0);

    // モックをリセット
    jest.clearAllMocks();

    // getSessionManagerのモック実装
    (SessionManagerModule.getSessionManager as jest.Mock).mockReturnValue(mockSessionManager);

    // setIntervalのモック
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useSession', () => {
    it('初期状態を正しく返す', () => {
      const { result } = renderHook(() => useSession());

      expect(result.current.userId).toBe('user-123');
      expect(result.current.isValid).toBe(true);
      expect(result.current.isIdle).toBe(false);
      expect(result.current.remainingTime).toBe(60000);
      expect(result.current.idleTime).toBe(0);
    });

    it('SessionManagerを初期化する', () => {
      renderHook(() => useSession());

      expect(SessionManagerModule.getSessionManager).toHaveBeenCalled();
    });

    it('startSession アクションを提供する', () => {
      const { result } = renderHook(() => useSession());

      act(() => {
        result.current.startSession('user-456', { role: 'admin' });
      });

      expect(mockStartSession).toHaveBeenCalledWith('user-456', { role: 'admin' });
    });

    it('endSession アクションを提供する', () => {
      const { result } = renderHook(() => useSession());

      act(() => {
        result.current.endSession();
      });

      expect(mockEndSession).toHaveBeenCalled();
    });

    it('refreshSession アクションを提供する', () => {
      const { result } = renderHook(() => useSession());

      act(() => {
        result.current.refreshSession();
      });

      expect(mockRefreshSession).toHaveBeenCalled();
    });

    it('recordActivity アクションを提供する', () => {
      const { result } = renderHook(() => useSession());

      act(() => {
        result.current.recordActivity();
      });

      expect(mockRecordActivity).toHaveBeenCalled();
    });

    it('1秒ごとに状態を更新する', () => {
      renderHook(() => useSession());

      const initialCalls = mockGetSession.mock.calls.length;

      // 1秒進める
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // getSessionが再度呼ばれたことを確認
      expect(mockGetSession.mock.calls.length).toBeGreaterThan(initialCalls);
    });

    it('アンマウント時にintervalがクリアされる', () => {
      const { unmount } = renderHook(() => useSession());

      const initialCalls = mockGetSession.mock.calls.length;

      unmount();

      // タイマーを進めてもgetSessionが呼ばれないことを確認
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockGetSession.mock.calls.length).toBe(initialCalls);
    });

    it('セッションが無効な場合にisValidがfalseになる', async () => {
      mockIsSessionValid.mockReturnValue(false);

      const { result, rerender } = renderHook(() => useSession());

      // タイマーを進めて更新をトリガー
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      rerender();

      await waitFor(() => {
        expect(result.current.isValid).toBe(false);
      });
    });

    it('セッションがアイドル状態になる', async () => {
      mockIsIdle.mockReturnValue(true);

      const { result, rerender } = renderHook(() => useSession());

      // タイマーを進めて更新をトリガー
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      rerender();

      await waitFor(() => {
        expect(result.current.isIdle).toBe(true);
      });
    });
  });

  describe('useSessionTimer', () => {
    it('残り時間をオブジェクトで返す', () => {
      mockGetRemainingTime.mockReturnValue(3661000); // 1時間1分1秒

      const { result } = renderHook(() => useSessionTimer());

      expect(result.current).toEqual({
        remainingTime: 3661000,
        hours: 1,
        minutes: 1,
        seconds: 1,
        isExpiringSoon: false,
      });
    });

    it('1分未満の場合にisExpiringSoonがtrueになる', () => {
      mockGetRemainingTime.mockReturnValue(59000); // 59秒

      const { result } = renderHook(() => useSessionTimer());

      expect(result.current).toEqual({
        remainingTime: 59000,
        hours: 0,
        minutes: 0,
        seconds: 59,
        isExpiringSoon: true,
      });
    });

    it('残り時間が0の場合に全て0を返す', () => {
      mockGetRemainingTime.mockReturnValue(0);

      const { result } = renderHook(() => useSessionTimer());

      expect(result.current).toEqual({
        remainingTime: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpiringSoon: false,
      });
    });

    it('時間が経過するとカウントダウンする', () => {
      let remainingTime = 10000; // 10秒
      mockGetRemainingTime.mockImplementation(() => remainingTime);

      const { result, rerender } = renderHook(() => useSessionTimer());

      expect(result.current.seconds).toBe(10);

      // 1秒進める
      act(() => {
        remainingTime -= 1000;
        jest.advanceTimersByTime(1000);
      });

      rerender();

      expect(result.current.seconds).toBe(9);
    });

    it('セッションがない場合に0を返す', () => {
      mockGetSession.mockReturnValue(null);
      mockGetRemainingTime.mockReturnValue(0);

      const { result } = renderHook(() => useSessionTimer());

      expect(result.current.remainingTime).toBe(0);
      expect(result.current.isExpiringSoon).toBe(false);
    });
  });

  describe('useIdleWarning', () => {
    it('アイドル時間が閾値未満の場合にfalseを返す', () => {
      mockGetIdleTime.mockReturnValue(5000); // 5秒

      const { result } = renderHook(() => useIdleWarning(10000)); // 閾値10秒

      expect(result.current).toBe(false);
    });

    it('アイドル時間が閾値を超えた場合にtrueを返す', async () => {
      mockGetIdleTime.mockReturnValue(15000); // 15秒

      const { result, rerender } = renderHook(() => useIdleWarning(10000)); // 閾値10秒

      // タイマーを進めて更新をトリガー
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      rerender();

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('アイドル時間が閾値と等しい場合にtrueを返す', async () => {
      mockGetIdleTime.mockReturnValue(10000); // 10秒

      const { result, rerender } = renderHook(() => useIdleWarning(10000)); // 閾値10秒

      // タイマーを進めて更新をトリガー
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      rerender();

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('閾値が変更された場合に正しく動作する', async () => {
      mockGetIdleTime.mockReturnValue(8000); // 8秒

      const { result, rerender } = renderHook(
        ({ threshold }) => useIdleWarning(threshold),
        { initialProps: { threshold: 10000 } }
      );

      expect(result.current).toBe(false);

      // 閾値を5秒に変更
      rerender({ threshold: 5000 });

      // タイマーを進めて更新をトリガー
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('セッションがない場合にfalseを返す', () => {
      mockGetSession.mockReturnValue(null);
      mockGetIdleTime.mockReturnValue(0);

      const { result } = renderHook(() => useIdleWarning(10000));

      expect(result.current).toBe(false);
    });
  });

  describe('統合テスト', () => {
    it('セッション開始から終了までの流れ', async () => {
      // 初期状態: セッションなし
      mockGetSession.mockReturnValue(null);
      mockIsSessionValid.mockReturnValue(false);

      const { result, rerender } = renderHook(() => useSession());

      expect(result.current.userId).toBeUndefined();
      expect(result.current.isValid).toBe(false);

      // セッション開始
      act(() => {
        mockGetSession.mockReturnValue({
          userId: 'user-789',
          startedAt: Date.now(),
          lastActivityAt: Date.now(),
          expiresAt: Date.now() + 60000,
        });
        mockIsSessionValid.mockReturnValue(true);
        result.current.startSession('user-789');
        jest.advanceTimersByTime(1000);
      });

      rerender();

      await waitFor(() => {
        expect(result.current.userId).toBe('user-789');
        expect(result.current.isValid).toBe(true);
      });

      // セッション終了
      act(() => {
        mockGetSession.mockReturnValue(null);
        mockIsSessionValid.mockReturnValue(false);
        result.current.endSession();
        jest.advanceTimersByTime(1000);
      });

      rerender();

      await waitFor(() => {
        expect(result.current.userId).toBeUndefined();
        expect(result.current.isValid).toBe(false);
      });
    });
  });
});
