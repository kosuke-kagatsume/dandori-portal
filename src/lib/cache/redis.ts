/**
 * Upstash Redis キャッシュユーティリティ
 * サーバーサイドのAPIレスポンスをキャッシュしてパフォーマンスを向上
 */

import { Redis } from '@upstash/redis';

// Redis クライアント（シングルトン）
let redis: Redis | null = null;

// メモリキャッシュ（Redisがない場合のフォールバック）
const memoryCache = new Map<string, { data: unknown; expiry: number }>();

/**
 * Redis クライアントを取得
 * 環境変数が設定されていない場合はnullを返す
 */
function getRedisClient(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.log('[Cache] Upstash Redis not configured, using memory cache');
    return null;
  }

  try {
    redis = new Redis({ url, token });
    console.log('[Cache] Upstash Redis connected');
    return redis;
  } catch (error) {
    console.error('[Cache] Failed to connect to Upstash Redis:', error);
    return null;
  }
}

/**
 * キャッシュキー生成
 */
export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${key}:${params[key]}`)
    .join(':');
  return sortedParams ? `${prefix}:${sortedParams}` : prefix;
}

/**
 * キャッシュからデータを取得
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();

  if (client) {
    try {
      const data = await client.get<T>(key);
      if (data) {
        console.log(`[Cache] HIT: ${key}`);
        return data;
      }
      console.log(`[Cache] MISS: ${key}`);
      return null;
    } catch (error) {
      console.error(`[Cache] Error getting ${key}:`, error);
      return null;
    }
  }

  // メモリキャッシュにフォールバック
  const cached = memoryCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    console.log(`[Cache] Memory HIT: ${key}`);
    return cached.data as T;
  }
  console.log(`[Cache] Memory MISS: ${key}`);
  return null;
}

/**
 * データをキャッシュに保存
 * @param ttl TTL（秒）
 */
export async function setCache<T>(key: string, data: T, ttl: number): Promise<void> {
  const client = getRedisClient();

  if (client) {
    try {
      await client.set(key, data, { ex: ttl });
      console.log(`[Cache] SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error(`[Cache] Error setting ${key}:`, error);
    }
  } else {
    // メモリキャッシュにフォールバック
    memoryCache.set(key, { data, expiry: Date.now() + ttl * 1000 });
    console.log(`[Cache] Memory SET: ${key} (TTL: ${ttl}s)`);
  }
}

/**
 * キャッシュを削除
 */
export async function deleteCache(key: string): Promise<void> {
  const client = getRedisClient();

  if (client) {
    try {
      await client.del(key);
      console.log(`[Cache] DEL: ${key}`);
    } catch (error) {
      console.error(`[Cache] Error deleting ${key}:`, error);
    }
  } else {
    memoryCache.delete(key);
    console.log(`[Cache] Memory DEL: ${key}`);
  }
}

/**
 * パターンに一致するキャッシュを削除
 */
export async function deleteCacheByPattern(pattern: string): Promise<void> {
  const client = getRedisClient();

  if (client) {
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await Promise.all(keys.map(key => client.del(key)));
        console.log(`[Cache] DEL pattern ${pattern}: ${keys.length} keys`);
      }
    } catch (error) {
      console.error(`[Cache] Error deleting pattern ${pattern}:`, error);
    }
  } else {
    // メモリキャッシュから削除
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let count = 0;
    for (const key of Array.from(memoryCache.keys())) {
      if (regex.test(key)) {
        memoryCache.delete(key);
        count++;
      }
    }
    console.log(`[Cache] Memory DEL pattern ${pattern}: ${count} keys`);
  }
}

/**
 * キャッシュ付きでデータを取得
 * キャッシュがなければfetcherを実行してキャッシュに保存
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  // キャッシュから取得
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // データを取得
  const data = await fetcher();

  // キャッシュに保存
  await setCache(key, data, ttl);

  return data;
}

// TTL定数（秒）
export const CACHE_TTL = {
  USERS: 300,           // 5分
  ATTENDANCE: 60,       // 1分
  WORKFLOWS: 120,       // 2分
  SAAS: 600,           // 10分
  ASSETS: 300,         // 5分
  LEGAL_UPDATES: 1800, // 30分
  MASTER_DATA: 3600,   // 1時間
} as const;

// キャッシュキープレフィックス
export const CACHE_PREFIX = {
  USERS: 'users',
  ATTENDANCE: 'attendance',
  WORKFLOWS: 'workflows',
  SAAS_SERVICES: 'saas:services',
  SAAS_PLANS: 'saas:plans',
  SAAS_ASSIGNMENTS: 'saas:assignments',
  VEHICLES: 'assets:vehicles',
  PC: 'assets:pc',
  VENDORS: 'assets:vendors',
  LEGAL_UPDATES: 'legal-updates',
  DEPARTMENTS: 'master:departments',
  POSITIONS: 'master:positions',
  EMPLOYMENT_TYPES: 'master:employment-types',
} as const;
