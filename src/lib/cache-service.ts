// 多層キャッシュサービス

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to Live in milliseconds
  forceRefresh?: boolean;
}

class CacheService {
  // L1: メモリキャッシュ（アプリケーション内）
  private memoryCache = new Map<string, CacheEntry<any>>();
  
  // L2: SessionStorage（ブラウザセッション内）
  private sessionCache = typeof window !== 'undefined' ? window.sessionStorage : null;
  
  // L3: LocalStorage（永続的）
  private localCache = typeof window !== 'undefined' ? window.localStorage : null;

  // デフォルトTTL（ミリ秒）
  private readonly DEFAULT_TTL = {
    memory: 5 * 60 * 1000,      // 5分
    session: 30 * 60 * 1000,     // 30分
    local: 24 * 60 * 60 * 1000,  // 24時間
  };

  // キャッシュキーのプレフィックス
  private readonly CACHE_PREFIX = 'dandori_cache_';

  // キャッシュから値を取得
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = this.DEFAULT_TTL.memory, forceRefresh = false } = options;

    if (!forceRefresh) {
      // L1: メモリキャッシュをチェック
      const memoryData = this.getFromMemory<T>(key);
      if (memoryData !== null) {
        return memoryData;
      }

      // L2: SessionStorageをチェック
      const sessionData = this.getFromSession<T>(key);
      if (sessionData !== null) {
        // メモリキャッシュに昇格
        this.setToMemory(key, sessionData, ttl);
        return sessionData;
      }

      // L3: LocalStorageをチェック
      const localData = this.getFromLocal<T>(key);
      if (localData !== null) {
        // 上位キャッシュに昇格
        this.setToMemory(key, localData, ttl);
        this.setToSession(key, localData, ttl);
        return localData;
      }
    }

    // キャッシュミス：データを取得
    try {
      const data = await fetcher();
      
      // 全レベルのキャッシュに保存
      this.setToMemory(key, data, ttl);
      this.setToSession(key, data, ttl * 2); // セッションは2倍の期間
      this.setToLocal(key, data, ttl * 4);   // ローカルは4倍の期間
      
      return data;
    } catch (error) {
      // エラー時は古いキャッシュがあれば返す（ステイル戦略）
      const staleData = this.getStaleData<T>(key);
      if (staleData !== null) {
        console.warn(`Using stale cache for ${key} due to fetch error`);
        return staleData;
      }
      throw error;
    }
  }

  // メモリキャッシュから取得
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // セッションストレージから取得
  private getFromSession<T>(key: string): T | null {
    if (!this.sessionCache) return null;

    try {
      const stored = this.sessionCache.getItem(this.CACHE_PREFIX + key);
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);
      const now = Date.now();
      
      if (now - entry.timestamp > entry.ttl) {
        this.sessionCache.removeItem(this.CACHE_PREFIX + key);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  // ローカルストレージから取得
  private getFromLocal<T>(key: string): T | null {
    if (!this.localCache) return null;

    try {
      const stored = this.localCache.getItem(this.CACHE_PREFIX + key);
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);
      const now = Date.now();
      
      if (now - entry.timestamp > entry.ttl) {
        this.localCache.removeItem(this.CACHE_PREFIX + key);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  // 期限切れでも任意のキャッシュから取得（ステイル戦略）
  private getStaleData<T>(key: string): T | null {
    // メモリから試す
    const memEntry = this.memoryCache.get(key);
    if (memEntry) return memEntry.data as T;

    // セッションから試す
    if (this.sessionCache) {
      try {
        const stored = this.sessionCache.getItem(this.CACHE_PREFIX + key);
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored);
          return entry.data;
        }
      } catch {}
    }

    // ローカルから試す
    if (this.localCache) {
      try {
        const stored = this.localCache.getItem(this.CACHE_PREFIX + key);
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored);
          return entry.data;
        }
      } catch {}
    }

    return null;
  }

  // メモリキャッシュに保存
  private setToMemory<T>(key: string, data: T, ttl: number): void {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // メモリキャッシュのサイズ制限（100エントリまで）
    if (this.memoryCache.size > 100) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }
  }

  // セッションストレージに保存
  private setToSession<T>(key: string, data: T, ttl: number): void {
    if (!this.sessionCache) return;

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      this.sessionCache.setItem(this.CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      // ストレージ容量エラーの場合は古いエントリを削除
      this.cleanupStorage(this.sessionCache);
    }
  }

  // ローカルストレージに保存
  private setToLocal<T>(key: string, data: T, ttl: number): void {
    if (!this.localCache) return;

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      this.localCache.setItem(this.CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      // ストレージ容量エラーの場合は古いエントリを削除
      this.cleanupStorage(this.localCache);
    }
  }

  // ストレージのクリーンアップ
  private cleanupStorage(storage: Storage): void {
    const keys = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        keys.push(key);
      }
    }

    // 古い順にソート（簡易的にキーでソート）
    keys.sort();

    // 古いものから半分削除
    const toDelete = Math.floor(keys.length / 2);
    for (let i = 0; i < toDelete; i++) {
      storage.removeItem(keys[i]);
    }
  }

  // 特定キーのキャッシュを削除
  invalidate(key: string): void {
    // メモリから削除
    this.memoryCache.delete(key);

    // セッションから削除
    if (this.sessionCache) {
      this.sessionCache.removeItem(this.CACHE_PREFIX + key);
    }

    // ローカルから削除
    if (this.localCache) {
      this.localCache.removeItem(this.CACHE_PREFIX + key);
    }
  }

  // パターンに一致するキャッシュを削除
  invalidatePattern(pattern: RegExp): void {
    // メモリキャッシュ
    for (const key of Array.from(this.memoryCache.keys())) {
      if (pattern.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // セッション・ローカルストレージ
    [this.sessionCache, this.localCache].forEach(storage => {
      if (!storage) return;
      
      const keysToDelete = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          const actualKey = key.substring(this.CACHE_PREFIX.length);
          if (pattern.test(actualKey)) {
            keysToDelete.push(key);
          }
        }
      }
      
      keysToDelete.forEach(key => storage.removeItem(key));
    });
  }

  // すべてのキャッシュをクリア
  clear(): void {
    // メモリキャッシュをクリア
    this.memoryCache.clear();

    // ストレージをクリア
    [this.sessionCache, this.localCache].forEach(storage => {
      if (!storage) return;
      
      const keysToDelete = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => storage.removeItem(key));
    });
  }

  // キャッシュ統計を取得
  getStats(): {
    memoryCount: number;
    sessionCount: number;
    localCount: number;
    totalSize: number;
  } {
    let sessionCount = 0;
    let localCount = 0;
    let totalSize = 0;

    if (this.sessionCache) {
      for (let i = 0; i < this.sessionCache.length; i++) {
        const key = this.sessionCache.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          sessionCount++;
          const value = this.sessionCache.getItem(key);
          if (value) totalSize += value.length;
        }
      }
    }

    if (this.localCache) {
      for (let i = 0; i < this.localCache.length; i++) {
        const key = this.localCache.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          localCount++;
          const value = this.localCache.getItem(key);
          if (value) totalSize += value.length;
        }
      }
    }

    return {
      memoryCount: this.memoryCache.size,
      sessionCount,
      localCount,
      totalSize,
    };
  }
}

// シングルトンインスタンス
export const cacheService = new CacheService();

// React用のキャッシュフック
import { useState, useEffect } from 'react';

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const result = await cacheService.get(
        key,
        fetcher,
        { ...options, forceRefresh }
      );
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [key]);

  const refresh = () => fetchData(true);

  return { data, loading, error, refresh };
}