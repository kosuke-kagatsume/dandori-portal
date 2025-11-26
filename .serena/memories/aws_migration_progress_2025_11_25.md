# AWS完全移行 + サブドメイン動的管理 - 進捗状況

**最終更新**: 2025-11-25 23:30
**ブランチ**: develop
**次回作業**: PC再起動後に続行（Sonnet 4.5へ）

---

## ✅ 完了済み（Phase 1）

### 1. Prismaスキーマ更新
- ✅ `Tenant`モデルに`subdomain`フィールド追加（String?, @unique）
- ✅ インデックス追加: `@@index([subdomain])`
- ファイル: `prisma/schema.prisma`

### 2. マイグレーション実行
- ✅ マイグレーション: `20251125142000_add_subdomain_to_tenant`
- ✅ RDS PostgreSQLに適用完了
- ファイル: `prisma/migrations/20251125142000_add_subdomain_to_tenant/migration.sql`

### 3. テナントデータ投入
- ✅ シードスクリプト作成: `scripts/seed-tenants.ts`
- ✅ 全6テナントにサブドメイン登録完了:
  ```
  tenant-001 → sample-corp
  tenant-002 → test-corp
  tenant-003 → trial-corp
  tenant-004 → large-corp
  tenant-005 → suspended-corp
  tenant-006 → dandori-work
  ```

---

## ⏳ 次回実施タスク（Phase 2-3）

### 4. Middleware更新（最優先）
**ファイル**: `src/middleware.ts`

**現状**: ハードコードされたサブドメインマッピング
```typescript
const SUBDOMAIN_TO_TENANT: Record<string, string> = {
  'dandori-work': 'tenant-006',
  'sample-corp': 'tenant-001',
  // ...
};
```

**実装すべき内容**:
```typescript
// データベースからテナント検索
import { PrismaClient } from '@prisma/client';

async function extractTenantFromHostname(hostname: string) {
  const subdomain = extractSubdomainPart(hostname); // 例: "dandori-work"
  
  if (!subdomain) {
    return { tenantId: DEFAULT_TENANT_ID, subdomain: null };
  }
  
  // データベース検索（Edge Runtime対応が必要）
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    select: { id: true, subdomain: true },
  });
  
  return {
    tenantId: tenant?.id || DEFAULT_TENANT_ID,
    subdomain: tenant?.subdomain || null,
  };
}
```

**注意点**:
- Middleware は Edge Runtime で動作
- Prisma Client は Edge Runtime 非対応
- 解決策: 
  - Option A: データベース接続プーリング（@prisma/adapter-pg）
  - Option B: API Route経由でテナント検索
  - Option C: Redis/Upstashでキャッシュ

### 5. DW管理画面更新
**ファイル**: `src/app/[locale]/dw-admin/dashboard/page.tsx`

**実装すべき内容**:
1. テナント作成ダイアログに`subdomain`入力フィールド追加
2. バリデーション:
   - 半角英数字とハイフンのみ
   - 3-30文字
   - 既存サブドメインとの重複チェック
3. 自動生成ボタン（会社名からサブドメイン生成）

### 6. AWS S3バケット作成
```bash
# バケット名: dandori-portal-files
aws s3 mb s3://dandori-portal-files --region ap-northeast-1

# CORS設定
aws s3api put-bucket-cors \
  --bucket dandori-portal-files \
  --cors-configuration file:///tmp/s3-cors-config.json

# バケットポリシー（公開読み取り）
aws s3api put-bucket-policy \
  --bucket dandori-portal-files \
  --policy file:///tmp/s3-bucket-policy.json
```

### 7. Supabase Storage → S3移行
**ファイル**: `src/lib/supabase/storage.ts` → `src/lib/aws/s3-storage.ts`

**実装すべき内容**:
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadFile(file: File, path: string) {
  const command = new PutObjectCommand({
    Bucket: 'dandori-portal-files',
    Key: path,
    Body: await file.arrayBuffer(),
    ContentType: file.type,
  });
  
  await s3Client.send(command);
  return { path };
}

export async function getFileUrl(path: string) {
  const command = new GetObjectCommand({
    Bucket: 'dandori-portal-files',
    Key: path,
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
```

### 8. 動作確認とデプロイ
1. ローカル環境でテスト
2. developブランチにpush
3. Amplify自動デプロイ確認
4. mainブランチにマージ
5. 本番環境で動作確認

---

## 📝 環境情報

### データベース
- **URL**: `postgresql://dandori_admin:DandoriAdmin2025@dandori-portal-db.chya4uuiiy9m.ap-northeast-1.rds.amazonaws.com:5432/dandori_portal?schema=public`
- **リージョン**: ap-northeast-1
- **インスタンス**: db.t3.medium

### AWS Amplify
- **App ID**: dmteeesbok5xv
- **mainブランチ**: https://main.dmteeesbok5xv.amplifyapp.com
- **developブランチ**: https://develop.dmteeesbok5xv.amplifyapp.com

### カスタムドメイン
- **ステータス**: AVAILABLE
- **ワイルドカード**: `*.dandori-portal.com`

---

## 🔧 再起動後の手順

1. **開発サーバー起動**:
   ```bash
   cd /Users/dw100/dandori-portal
   git checkout develop
   PORT=3000 npm run dev
   ```

2. **進捗確認**:
   ```bash
   # データベース確認
   DATABASE_URL='postgresql://...' npx prisma studio
   
   # テナント一覧確認
   cd /Users/dw100/dandori-portal
   DATABASE_URL='postgresql://...' npx ts-node scripts/seed-tenants.ts
   ```

3. **次のタスク開始**:
   - Task 4: Middleware更新から開始
   - このメモリーファイルを参照

---

## 📚 参考資料

- Prisma Edge Runtime: https://www.prisma.io/docs/guides/deployment/edge/deploy-to-vercel
- AWS SDK for JavaScript v3: https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/
- Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
