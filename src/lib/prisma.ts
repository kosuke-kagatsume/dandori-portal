import { PrismaClient, Prisma } from '@prisma/client';

// クエリ実行時間の閾値（ミリ秒）
const SLOW_QUERY_THRESHOLD = 100;

// 接続プール設定
const CONNECTION_POOL_CONFIG = {
  // 最大接続数（サーバーレス環境向けに控えめに設定）
  connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
  // 接続タイムアウト（ミリ秒）
  connectTimeout: parseInt(process.env.DATABASE_CONNECT_TIMEOUT || '10000'),
  // プールタイムアウト（ミリ秒）- 接続取得待機時間
  poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10000'),
};

// クエリ統計を保持
interface QueryStats {
  model: string;
  operation: string;
  duration: number;
  timestamp: Date;
}

// 開発環境でのクエリ統計
const queryStats: QueryStats[] = [];
const MAX_STATS = 1000; // 最大保持数

// スロークエリをログに出力
function logSlowQuery(model: string, operation: string, duration: number) {
  console.warn(
    `🐢 [SLOW QUERY] ${model}.${operation} took ${duration.toFixed(2)}ms`
  );
}

// クエリ統計を追加
function addQueryStats(stats: QueryStats) {
  if (process.env.NODE_ENV === 'development') {
    queryStats.push(stats);
    if (queryStats.length > MAX_STATS) {
      queryStats.shift();
    }
  }
}

/**
 * DATABASE_URLに接続プールパラメータを追加
 * Prisma + PostgreSQLでの最適な接続プール設定を適用
 */
function getDatasourceUrl(): string {
  const baseUrl = process.env.DATABASE_URL || '';

  if (!baseUrl) {
    console.warn('[Prisma] DATABASE_URL is not set');
    return '';
  }

  // URLにすでにパラメータがあるか確認
  const hasParams = baseUrl.includes('?');
  const separator = hasParams ? '&' : '?';

  // 接続プールパラメータを追加
  const poolParams = [
    `connection_limit=${CONNECTION_POOL_CONFIG.connectionLimit}`,
    `connect_timeout=${Math.floor(CONNECTION_POOL_CONFIG.connectTimeout / 1000)}`,
    `pool_timeout=${Math.floor(CONNECTION_POOL_CONFIG.poolTimeout / 1000)}`,
  ].join('&');

  const finalUrl = `${baseUrl}${separator}${poolParams}`;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Prisma] Connection pool: limit=${CONNECTION_POOL_CONFIG.connectionLimit}, connect_timeout=${CONNECTION_POOL_CONFIG.connectTimeout}ms, pool_timeout=${CONNECTION_POOL_CONFIG.poolTimeout}ms`);
  }

  return finalUrl;
}

// Prismaクライアントの作成
function createPrismaClient() {
  const datasourceUrl = getDatasourceUrl();

  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
          ]
        : [{ level: 'error', emit: 'stdout' }],
    // データソースURLを動的に設定（接続プールパラメータ付き）
    datasourceUrl: datasourceUrl || undefined,
  });

  // 開発環境でクエリイベントをリッスン
  if (process.env.NODE_ENV === 'development') {
    client.$on('query' as never, (e: Prisma.QueryEvent) => {
      const duration = e.duration;
      if (duration > SLOW_QUERY_THRESHOLD) {
        console.warn(
          `🐢 [SLOW QUERY] ${duration}ms - ${e.query.substring(0, 200)}...`
        );
      }
    });
  }

  return client;
}

// Prisma Clientの拡張（クエリ時間計測）
function extendPrismaClient(client: PrismaClient) {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = performance.now();
          const result = await query(args);
          const duration = performance.now() - start;

          // 統計を追加
          addQueryStats({
            model: model || 'unknown',
            operation,
            duration,
            timestamp: new Date(),
          });

          // スロークエリの検出
          if (duration > SLOW_QUERY_THRESHOLD) {
            logSlowQuery(model || 'unknown', operation, duration);
          }

          return result;
        },
      },
    },
  });
}

// グローバルにPrismaクライアントを保持
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof extendPrismaClient> | undefined;
};

// Prismaクライアントのインスタンス
export const prisma =
  globalForPrisma.prisma ?? extendPrismaClient(createPrismaClient());

// 開発環境ではグローバルに保持（ホットリロード対策）
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// クエリ統計を取得（開発用API向け）
export function getQueryStats() {
  return {
    total: queryStats.length,
    slowQueries: queryStats.filter((s) => s.duration > SLOW_QUERY_THRESHOLD),
    averageDuration:
      queryStats.length > 0
        ? queryStats.reduce((sum, s) => sum + s.duration, 0) / queryStats.length
        : 0,
    byModel: queryStats.reduce(
      (acc, s) => {
        if (!acc[s.model]) {
          acc[s.model] = { count: 0, totalDuration: 0 };
        }
        acc[s.model].count++;
        acc[s.model].totalDuration += s.duration;
        return acc;
      },
      {} as Record<string, { count: number; totalDuration: number }>
    ),
  };
}

// クエリ統計をリセット（開発用）
export function resetQueryStats() {
  queryStats.length = 0;
}

/**
 * DB接続状態を確認
 * ヘルスチェックAPI等で使用
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  const start = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = performance.now() - start;
    return { connected: true, latency };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * グレースフルシャットダウン
 * アプリケーション終了時にDB接続を適切にクローズ
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('[Prisma] Database disconnected successfully');
  } catch (error) {
    console.error('[Prisma] Error disconnecting database:', error);
  }
}

// プロセス終了時にDB接続をクローズ
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await disconnectDatabase();
  });
}

/**
 * 接続プール設定情報を取得
 */
export function getConnectionPoolConfig() {
  return { ...CONNECTION_POOL_CONFIG };
}

export default prisma;
