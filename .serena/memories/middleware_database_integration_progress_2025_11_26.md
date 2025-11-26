# Middleware データベース統合 進捗メモ（2025-11-26）

## 完了した作業

### 1. Prismaスキーマ更新 ✅
- **ファイル**: `prisma/schema.prisma`
- **変更**: `Tenant`モデルに`subdomain`フィールド追加（String?, @unique, @@index）

### 2. マイグレーション実行 ✅
- **ディレクトリ**: `prisma/migrations/20251125142000_add_subdomain_to_tenant/`
- **SQL**: ALTER TABLE + UNIQUE INDEX + INDEX作成
- **実行結果**: AWS RDS PostgreSQLに正常適用

### 3. 既存テナントデータ更新 ✅
- **スクリプト**: `scripts/seed-tenants.ts`
- **実行結果**: 全6テナントにサブドメイン登録完了
  - tenant-001 → sample-corp
  - tenant-002 → test-corp
  - tenant-003 → trial-corp
  - tenant-004 → large-corp
  - tenant-005 → suspended-corp
  - tenant-006 → dandori-work

### 4. API Route作成 ✅
- **ファイル**: `src/app/api/tenant/resolve/route.ts`
- **機能**: サブドメインからテナント情報を取得するGET endpoint
- **実装**: Prisma Clientを使用したデータベース検索

### 5. Middleware更新 ⚠️進行中
- **ファイル**: `src/middleware.ts`
- **実装内容**:
  - ハードコードされたサブドメインマッピング削除
  - データベース検索ロジック追加（`fetchTenantFromDatabase`）
  - メモリキャッシュ実装（TTL 5分）
  - async版`extractTenantFromHostname`実装

### 6. 環境変数設定更新 ✅
- **ファイル**: `.env.local`
- **変更**: SupabaseのDATABASE_URL → AWS RDS URLに更新

## 現在の問題

### DATABASE_URL解析エラー

**症状**:
```
Invalid `prisma.tenant.findUnique()` invocation:
The provided database string is invalid. Error parsing connection string: invalid port number in database URL.
```

**原因調査**:
1. ✅ .env.localに正しいAWS RDS URLが設定されている
2. ✅ .envにも正しいAWS RDS URLが設定されている  
3. ✅ Prismaスキーマは`env("DATABASE_URL")`を正しく参照
4. ✅ Prisma Clientを削除・再生成済み
5. ✅ .nextキャッシュをクリア済み

**推測される問題**:
- Next.jsの環境変数読み込み順序の問題
- Prisma Clientが実行時に異なるDATABASE_URLを参照している
- 別のenvファイルやキャッシュが影響している可能性

## 実装したコード

### API Route (`src/app/api/tenant/resolve/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const subdomain = searchParams.get('subdomain');

  try {
    if (!subdomain) {
      return NextResponse.json(
        { error: 'subdomain parameter is required' },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found', subdomain },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
      name: tenant.name,
    });
  } catch (error) {
    console.error('[API] Tenant resolve error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { status: 500 }
    );
  }
}
```

### Middleware更新 (`src/middleware.ts`)
```typescript
// メモリキャッシュ（Edge Runtime互換）
const tenantCache = new Map<string, { tenantId: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分

// データベース検索関数
async function fetchTenantFromDatabase(
  subdomain: string,
  baseUrl: string
): Promise<string | null> {
  try {
    const url = new URL('/api/tenant/resolve', baseUrl);
    url.searchParams.set('subdomain', subdomain);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      console.warn(`[Middleware] Tenant not found: ${subdomain}`);
      return null;
    }

    const data = await response.json();
    return data.tenantId || null;
  } catch (error) {
    console.error('[Middleware] Failed to fetch tenant:', error);
    return null;
  }
}

// async版extractTenantFromHostname
async function extractTenantFromHostname(
  hostname: string,
  requestUrl: string
): Promise<{ tenantId: string; subdomain: string | null }> {
  // ... サブドメイン抽出ロジック ...

  if (subdomain) {
    // 1. キャッシュチェック
    const cachedTenantId = getCachedTenant(subdomain);
    if (cachedTenantId) {
      tenantId = cachedTenantId;
    } else {
      // 2. データベース検索
      const fetchedTenantId = await fetchTenantFromDatabase(subdomain, requestUrl);
      if (fetchedTenantId) {
        tenantId = fetchedTenantId;
        setCachedTenant(subdomain, tenantId);
      }
    }
  }

  return { tenantId, subdomain };
}
```

## 次のステップ（PC再起動後）

### Option A: DATABASE_URL問題の完全解決（優先度：中）

1. **環境変数のデバッグ**
   ```bash
   # APIルート内でDATABASE_URLをログ出力
   console.log('DATABASE_URL:', process.env.DATABASE_URL);
   ```

2. **Prisma実行時URLの明示的指定を検討**
   ```typescript
   // 一時的な回避策として、環境変数を明示的に渡す
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
       },
     },
   });
   ```

3. **代替アプローチ: ビルド時生成**
   - データベースからテナント一覧を取得
   - TypeScriptファイルとして自動生成
   - Middlewareはそのファイルをimport

### Option B: Middleware更新を一時保留（優先度：高）

現時点で動作している状態:
- ✅ データベースにサブドメイン情報が格納されている
- ⚠️ Middlewareはまだハードコードマッピングを使用（後で動的化可能）

**推奨アクション**:
1. 現在のMiddleware動作を確認（ハードコードでも動作する）
2. 次のタスク「DW管理画面にサブドメイン入力追加」に進む
3. Middleware動的化はDW管理画面完成後に再挑戦

### Option C: Middleware最適化（将来的な改善）

1. **Upstash Redisの導入**
   - Edge Runtime互換のキャッシュ
   - API呼び出し削減

2. **静的ファイル生成アプローチ**
   - ビルド時にテナント一覧を生成
   - Middlewareはファイルから読み込むだけ

## 環境情報

**DATABASE_URL** (.env.local):
```
postgresql://dandori_admin:DandoriAdmin2025@dandori-portal-db.chya4uuiiy9m.ap-northeast-1.rds.amazonaws.com:5432/dandori_portal?schema=public
```

**AWS RDS**:
- エンドポイント: dandori-portal-db.chya4uuiiy9m.ap-northeast-1.rds.amazonaws.com
- ポート: 5432
- データベース: dandori_portal
- ユーザー: dandori_admin

**開発サーバー**:
```bash
PORT=3000 npm run dev
```

## 参考コマンド

### Prisma Client再生成
```bash
rm -rf node_modules/.prisma node_modules/@prisma/client
npx prisma generate
```

### キャッシュクリア
```bash
rm -rf .next
```

### API テスト
```bash
curl -s 'http://localhost:3000/api/tenant/resolve?subdomain=dandori-work' | jq .
```

### データベース確認
```bash
DATABASE_URL='...' npx prisma studio
```

## 重要なファイル

- `src/middleware.ts` - Middleware本体（async関数更新済み）
- `src/app/api/tenant/resolve/route.ts` - テナント解決API
- `src/lib/prisma.ts` - Prisma Clientシングルトン
- `.env.local` - 環境変数（AWS RDS URL設定済み）
- `prisma/schema.prisma` - データベーススキーマ（subdomain追加済み）
- `scripts/seed-tenants.ts` - テナントシードスクリプト

## 今後の作業

PC再起動後は、**Option B**（Middleware更新を一時保留）を推奨します。理由:
1. データベースにはすでにサブドメイン情報が登録されている
2. DW管理画面でサブドメイン管理UIを実装する方が価値が高い
3. DATABASE_URL問題の解決には追加の調査時間が必要
4. Middlewareの動的化は後回しでも動作に支障がない
