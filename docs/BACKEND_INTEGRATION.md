# Backend API Integration Guide

Dandori Portal のバックエンドAPI統合ガイド

## 📋 概要

このドキュメントは、Dandori Portal フロントエンドと実際のバックエンドAPIを統合する際のガイドです。

## 🔌 現在の統合状態

### 実装済みの機能

- ✅ **APIクライアント** (`src/lib/api/client.ts`)
  - 自動トークンリフレッシュ
  - リトライロジック（最大3回、指数バックオフ）
  - エラーハンドリング
  - タイムアウト処理（30秒）

- ✅ **セッション管理** (`src/lib/session/session-manager.ts`)
  - セッション有効期限（24時間）
  - アイドルタイムアウト（30分）
  - ブラウザタブ間同期

- ✅ **データ同期** (`src/lib/sync/sync-manager.ts`)
  - 楽観的更新
  - オフライン対応
  - キャッシュ管理（TTL 5分）

- ✅ **API型定義** (`src/lib/api/types.ts`)
  - 共通レスポンス型
  - 認証API型
  - エンドポイント定数

### デモモード vs プロダクションモード

現在、アプリケーションは**デモモード**で動作しています：
- データはLocalStorageに保存
- バックエンドAPIへの通信なし
- 完全にフロントエンドのみで動作

プロダクションモードに切り替えるには：
```env
# .env.local
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api/v1
```

## 🚀 バックエンド統合手順

### 1. 環境変数の設定

`.env.local`ファイルを作成（またはコピー）：

```bash
cp .env.local.example .env.local
```

必要な環境変数を設定：

```env
# API設定
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1  # 開発環境
NEXT_PUBLIC_DEMO_MODE=false  # プロダクションモード

# デバッグ設定
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_LOG_API_REQUESTS=true  # APIリクエストのログ出力

# Supabase（オプション）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. バックエンドAPI要件

#### 必須エンドポイント

##### 認証
```typescript
POST /api/v1/auth/login
Request: { email: string, password: string }
Response: { accessToken: string, refreshToken: string, user: User }

POST /api/v1/auth/refresh
Request: { refreshToken: string }
Response: { accessToken: string }

POST /api/v1/auth/logout
Request: { refreshToken: string }
Response: { success: boolean }
```

##### ユーザー管理
```typescript
GET /api/v1/users
Response: { data: User[], pagination: Pagination }

GET /api/v1/users/:id
Response: { data: User }

POST /api/v1/users
Request: CreateUserRequest
Response: { data: User }

PUT /api/v1/users/:id
Request: UpdateUserRequest
Response: { data: User }
```

##### ワークフロー
```typescript
GET /api/v1/workflows
Response: { data: WorkflowRequest[], pagination: Pagination }

POST /api/v1/workflows
Request: CreateWorkflowRequest
Response: { data: WorkflowRequest }

POST /api/v1/workflows/:id/approve
Request: { comments?: string }
Response: { data: WorkflowRequest }

POST /api/v1/workflows/:id/reject
Request: { reason: string }
Response: { data: WorkflowRequest }
```

##### 勤怠管理
```typescript
GET /api/v1/attendance
Response: { data: AttendanceRecord[], pagination: Pagination }

POST /api/v1/attendance/check-in
Request: { location?: string }
Response: { data: AttendanceRecord }

POST /api/v1/attendance/check-out
Request: { location?: string }
Response: { data: AttendanceRecord }
```

#### レスポンス形式

全てのエンドポイントは以下の形式を返す必要があります：

```typescript
// 成功時
{
  success: true,
  data: any,
  message?: string,
  pagination?: {
    page: number,
    pageSize: number,
    totalCount: number,
    totalPages: number
  }
}

// エラー時
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

#### 認証ヘッダー

全てのリクエストには以下のヘッダーを含める：

```typescript
{
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

### 3. APIクライアントの使用方法

#### 基本的な使用例

```typescript
import { getAPIClient } from '@/lib/api/client';

const client = getAPIClient();

// GET リクエスト
const { data } = await client.get('/users');

// POST リクエスト
const { data: newUser } = await client.post('/users', {
  name: '田中太郎',
  email: 'tanaka@example.com'
});

// PUT リクエスト
const { data: updatedUser } = await client.put(`/users/${userId}`, {
  name: '田中次郎'
});

// DELETE リクエスト
await client.delete(`/users/${userId}`);
```

#### エラーハンドリング

```typescript
import { APIError } from '@/lib/api/client';

try {
  const { data } = await client.get('/users');
} catch (error) {
  if (error instanceof APIError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.status);
    console.error('Details:', error.details);
  }
}
```

#### セッション管理

```typescript
import { SessionManager } from '@/lib/session/session-manager';

const sessionManager = SessionManager.getInstance();

// セッション開始
sessionManager.startSession(userId);

// セッション状態確認
const isValid = sessionManager.isSessionValid();

// セッション終了
sessionManager.endSession();
```

### 4. データ同期

#### 楽観的更新

```typescript
import { SyncManager } from '@/lib/sync/sync-manager';

const syncManager = SyncManager.getInstance();

// 楽観的更新
await syncManager.optimisticUpdate(
  'users',
  userId,
  updatedData,
  async () => {
    // バックエンドへの実際の更新
    await client.put(`/users/${userId}`, updatedData);
  }
);
```

## 📝 型定義

全てのAPI型定義は `src/lib/api/types.ts` に記載されています。

主要な型：
- `ApiResponse<T>` - 成功レスポンス
- `ApiError` - エラーレスポンス
- `Pagination` - ページネーション情報
- `LoginRequest` / `LoginResponse` - 認証リクエスト/レスポンス

## 🧪 テスト

### APIクライアントのテスト

```bash
npm run test -- src/lib/api/client.test.ts
```

### E2Eテスト（バックエンド必須）

```bash
# バックエンドサーバーを起動
# http://localhost:8000

# E2Eテスト実行
npm run test:e2e
```

## 🔒 セキュリティ考慮事項

1. **トークン管理**
   - アクセストークンはメモリに保存
   - リフレッシュトークンはlocalStorageに保存（HttpOnly Cookieを推奨）

2. **CORS設定**
   - バックエンドは適切なCORSヘッダーを返す必要があります

3. **HTTPS**
   - プロダクション環境では必ずHTTPSを使用

## 📊 監視とロギング

APIリクエストのログ出力：

```env
NEXT_PUBLIC_LOG_API_REQUESTS=true
```

パフォーマンス計測：

```typescript
import { measureApiCall } from '@/lib/performance/metrics';

const { duration } = await measureApiCall('getUsers', async () => {
  return await client.get('/users');
});

console.log(`API call took ${duration}ms`);
```

## 🚨 トラブルシューティング

### 401 Unauthorized エラー

**原因**: トークンが無効または期限切れ

**解決方法**:
1. リフレッシュトークンで新しいアクセストークンを取得
2. 自動リトライが失敗した場合はログイン画面へリダイレクト

### Network Error

**原因**: バックエンドサーバーが起動していない、またはURLが間違っている

**解決方法**:
1. `.env.local`の`NEXT_PUBLIC_API_URL`を確認
2. バックエンドサーバーが起動しているか確認
3. CORS設定を確認

### タイムアウトエラー

**原因**: APIレスポンスが30秒以内に返ってこない

**解決方法**:
1. バックエンドのパフォーマンスを改善
2. タイムアウト時間を延長（`src/lib/api/client.ts`）

## 📚 参考資料

- [API型定義](../src/lib/api/types.ts)
- [APIクライアント](../src/lib/api/client.ts)
- [セッション管理](../src/lib/session/session-manager.ts)
- [データ同期](../src/lib/sync/sync-manager.ts)

## 🎯 次のステップ

1. バックエンドAPIの実装
2. 環境変数の設定
3. デモモードの無効化
4. APIエンドポイントの接続確認
5. E2Eテストの実行
6. 本番環境へのデプロイ
