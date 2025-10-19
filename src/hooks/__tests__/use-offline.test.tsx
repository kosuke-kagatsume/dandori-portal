/**
 * useOffline Hook Tests
 *
 * オフライン検出フックのユニットテスト
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useOffline, useOnlineStatus } from '../use-offline';
import * as OfflineManagerModule from '@/lib/offline/offline-manager';

// OfflineManagerのモック
const mockGetOnlineStatus = jest.fn();
const mockDestroy = jest.fn();

const mockOfflineManager = {
  getOnlineStatus: mockGetOnlineStatus,
  destroy: mockDestroy,
  isOffline: jest.fn(),
};

// getOfflineManagerをモック
jest.mock('@/lib/offline/offline-manager', () => ({
  getOfflineManager: jest.fn(),
  resetOfflineManager: jest.fn(),
  OfflineManager: jest.fn(),
}));

describe('useOffline', () => {
  let onOfflineCallback: (() => void) | undefined;
  let onOnlineCallback: (() => void) | undefined;
  let onSyncStartCallback: (() => void) | undefined;
  let onSyncCompleteCallback: (() => void) | undefined;

  beforeEach(() => {
    // コールバックをリセット
    onOfflineCallback = undefined;
    onOnlineCallback = undefined;
    onSyncStartCallback = undefined;
    onSyncCompleteCallback = undefined;

    // モックをリセット
    mockGetOnlineStatus.mockReturnValue(true);
    mockDestroy.mockClear();

    // getOfflineManagerのモック実装
    (OfflineManagerModule.getOfflineManager as jest.Mock).mockImplementation((config) => {
      // コールバックを保存
      if (config) {
        onOfflineCallback = config.onOffline;
        onOnlineCallback = config.onOnline;
        onSyncStartCallback = config.onSyncStart;
        onSyncCompleteCallback = config.onSyncComplete;
      }
      return mockOfflineManager;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('useOffline', () => {
    it('初期状態でオンラインを返す', () => {
      const { result } = renderHook(() => useOffline());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.isSyncing).toBe(false);
    });

    it('OfflineManagerを初期化する', () => {
      renderHook(() => useOffline());

      expect(OfflineManagerModule.getOfflineManager).toHaveBeenCalledWith({
        onOffline: expect.any(Function),
        onOnline: expect.any(Function),
        onSyncStart: expect.any(Function),
        onSyncComplete: expect.any(Function),
      });
    });

    it('onOfflineコールバックでisOfflineがtrueになる', async () => {
      const { result } = renderHook(() => useOffline());

      // onOfflineコールバックを呼ぶ
      act(() => {
        if (onOfflineCallback) {
          onOfflineCallback();
        }
      });

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
        expect(result.current.isOnline).toBe(false);
      });
    });

    it('onOnlineコールバックでisOnlineがtrueになる', async () => {
      const { result } = renderHook(() => useOffline());

      // まずオフラインにする
      act(() => {
        if (onOfflineCallback) {
          onOfflineCallback();
        }
      });

      // オンラインに戻す
      act(() => {
        if (onOnlineCallback) {
          onOnlineCallback();
        }
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
        expect(result.current.isOffline).toBe(false);
      });
    });

    it('onSyncStartコールバックでisSyncingがtrueになる', async () => {
      const { result } = renderHook(() => useOffline());

      // 同期開始
      act(() => {
        if (onSyncStartCallback) {
          onSyncStartCallback();
        }
      });

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(true);
      });
    });

    it('onSyncCompleteコールバックでisSyncingがfalseになる', async () => {
      const { result } = renderHook(() => useOffline());

      // 同期開始
      act(() => {
        if (onSyncStartCallback) {
          onSyncStartCallback();
        }
      });

      // 同期完了
      act(() => {
        if (onSyncCompleteCallback) {
          onSyncCompleteCallback();
        }
      });

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(false);
      });
    });

    it('アンマウント時にdestroy()が呼ばれる', () => {
      const { unmount } = renderHook(() => useOffline());

      unmount();

      expect(mockDestroy).toHaveBeenCalled();
    });

    it('getOnlineStatus()の初期値を反映する', () => {
      // オフライン状態で開始
      mockGetOnlineStatus.mockReturnValue(false);

      const { result } = renderHook(() => useOffline());

      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(true);
    });
  });

  describe('useOnlineStatus', () => {
    it('オンライン状態を返す', () => {
      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current).toBe(true);
    });

    it('useOfflineの結果と一致する', () => {
      const { result: offlineResult } = renderHook(() => useOffline());
      const { result: onlineResult } = renderHook(() => useOnlineStatus());

      expect(onlineResult.current).toBe(offlineResult.current.isOnline);
    });

    it('オフライン時にfalseを返す', async () => {
      const { result } = renderHook(() => useOnlineStatus());

      // オフラインにする
      act(() => {
        if (onOfflineCallback) {
          onOfflineCallback();
        }
      });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });
  });

  describe('複数のイベント処理', () => {
    it('オフライン→同期開始→同期完了→オンラインのシーケンス', async () => {
      const { result } = renderHook(() => useOffline());

      // 1. オフラインにする
      act(() => {
        if (onOfflineCallback) {
          onOfflineCallback();
        }
      });

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
        expect(result.current.isSyncing).toBe(false);
      });

      // 2. オンラインに復帰（同期開始）
      act(() => {
        if (onOnlineCallback) {
          onOnlineCallback();
        }
        if (onSyncStartCallback) {
          onSyncStartCallback();
        }
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
        expect(result.current.isSyncing).toBe(true);
      });

      // 3. 同期完了
      act(() => {
        if (onSyncCompleteCallback) {
          onSyncCompleteCallback();
        }
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
        expect(result.current.isSyncing).toBe(false);
      });
    });
  });
});
