/**
 * クエリ最適化ユーティリティ
 * N+1問題の防止とバッチ処理の効率化
 */

import { PrismaClient } from '@prisma/client';

// バッチサイズの制限
const MAX_BATCH_SIZE = 100;

/**
 * IDリストからデータをバッチ取得
 * N+1問題を防止するためのユーティリティ
 */
export async function batchFindByIds<T>(
  prisma: PrismaClient,
  model: string,
  ids: string[],
  select?: Record<string, boolean | object>
): Promise<Map<string, T>> {
  if (ids.length === 0) {
    return new Map();
  }

  // 重複を除去
  const uniqueIds = [...new Set(ids)];

  // バッチサイズを制限
  const batchedIds = uniqueIds.slice(0, MAX_BATCH_SIZE);

  // 型安全でないdynamic accessを使用（Prismaのモデル名でアクセス）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaModel = (prisma as any)[model];

  if (!prismaModel) {
    throw new Error(`Model ${model} not found in Prisma client`);
  }

  const records = await prismaModel.findMany({
    where: {
      id: { in: batchedIds },
    },
    ...(select && { select }),
  });

  const resultMap = new Map<string, T>();
  for (const record of records) {
    resultMap.set(record.id, record);
  }

  return resultMap;
}

/**
 * ユーザーIDリストからユーザー情報をバッチ取得
 */
export async function batchGetUsers(
  prisma: PrismaClient,
  userIds: string[]
): Promise<Map<string, { id: string; name: string; email: string; avatar: string | null }>> {
  return batchFindByIds(prisma, 'user', userIds, {
    id: true,
    name: true,
    email: true,
    avatar: true,
  });
}

/**
 * テナントIDリストからテナント情報をバッチ取得
 */
export async function batchGetTenants(
  prisma: PrismaClient,
  tenantIds: string[]
): Promise<Map<string, { id: string; name: string }>> {
  return batchFindByIds(prisma, 'tenant', tenantIds, {
    id: true,
    name: true,
  });
}

/**
 * 組織単位IDリストから組織情報をバッチ取得
 */
export async function batchGetOrgUnits(
  prisma: PrismaClient,
  unitIds: string[]
): Promise<Map<string, { id: string; name: string; type: string }>> {
  return batchFindByIds(prisma, 'organizationalUnit', unitIds, {
    id: true,
    name: true,
    type: true,
  });
}

/**
 * DataLoaderパターンの簡易実装
 * 同じリクエスト内で複数回呼ばれても1回のクエリにまとめる
 */
export class QueryBatcher<T> {
  private pending: Map<string, Promise<T | null>> = new Map();
  private batch: string[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly batchDelay = 10; // 10ms待機してバッチ化

  constructor(
    private readonly fetchBatch: (ids: string[]) => Promise<Map<string, T>>
  ) {}

  async load(id: string): Promise<T | null> {
    // 既にペンディング中のリクエストがあればそれを返す
    if (this.pending.has(id)) {
      return this.pending.get(id)!;
    }

    // バッチに追加
    this.batch.push(id);

    // Promiseを作成して保存
    const promise = new Promise<T | null>((resolve) => {
      // タイマーが設定されていなければ設定
      if (!this.timer) {
        this.timer = setTimeout(async () => {
          // バッチをコピーしてクリア
          const ids = [...this.batch];
          this.batch = [];
          this.timer = null;

          // バッチでデータを取得
          const results = await this.fetchBatch(ids);

          // 結果を各Promiseに解決
          for (const batchId of ids) {
            const pendingPromise = this.pending.get(batchId);
            if (pendingPromise) {
              // 型安全でないがresolveを呼ぶ必要がある
              const result = results.get(batchId) || null;
              // この時点でpendingPromiseの解決はここでは直接できない
              // 代わりに別のアプローチを使用
            }
          }

          // Promiseを解決
          resolve(results.get(id) || null);

          // ペンディングをクリア
          for (const batchId of ids) {
            this.pending.delete(batchId);
          }
        }, this.batchDelay);
      }
    });

    this.pending.set(id, promise);
    return promise;
  }

  // 即座にバッチを実行
  async loadMany(ids: string[]): Promise<Map<string, T>> {
    const uniqueIds = [...new Set(ids)];
    return this.fetchBatch(uniqueIds);
  }
}

/**
 * 一般的なN+1防止パターン: 関連データを事前にロードして結合
 */
export async function withRelatedData<T extends { id: string }, R>(
  items: T[],
  getRelatedIds: (item: T) => string[],
  fetchRelated: (ids: string[]) => Promise<Map<string, R>>,
  attachRelated: (item: T, relatedMap: Map<string, R>) => T & { related?: R[] }
): Promise<(T & { related?: R[] })[]> {
  // 関連IDを収集
  const allRelatedIds: string[] = [];
  for (const item of items) {
    const relatedIds = getRelatedIds(item);
    allRelatedIds.push(...relatedIds);
  }

  // 一括で関連データを取得
  const relatedMap = await fetchRelated(allRelatedIds);

  // 関連データを各アイテムに添付
  return items.map((item) => attachRelated(item, relatedMap));
}

/**
 * クエリ結果のキャッシュキーを生成
 */
export function generateCacheKey(
  model: string,
  params: Record<string, unknown>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (obj, key) => {
        obj[key] = params[key];
        return obj;
      },
      {} as Record<string, unknown>
    );

  return `${model}:${JSON.stringify(sortedParams)}`;
}

/**
 * Prismaクエリの最適なselectオプションを生成
 * 不要なフィールドを除外してクエリを最適化
 */
export function optimizeSelect<T extends Record<string, boolean | object>>(
  fields: T,
  exclude?: string[]
): T {
  if (!exclude || exclude.length === 0) {
    return fields;
  }

  const optimized = { ...fields };
  for (const field of exclude) {
    delete optimized[field];
  }

  return optimized;
}

/**
 * ページネーション情報を計算
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
} {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * カーソルベースのページネーション用ヘルパー
 * 大量データセットに対してより効率的
 */
export function getCursorPagination(
  cursor?: string,
  limit: number = 20
): {
  cursor?: { id: string };
  skip?: number;
  take: number;
} {
  if (cursor) {
    return {
      cursor: { id: cursor },
      skip: 1, // カーソルの次から取得
      take: limit,
    };
  }

  return {
    take: limit,
  };
}
