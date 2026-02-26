# Dandori Portal ↔ DRM Suite 統合API仕様書

> **作成日**: 2026-02-26
> **バージョン**: 1.0
> **対象**: DRM Suite 開発チーム

---

## 概要

Dandori Portal（HR系）とDRM Suite（CRM系）間でデータ連携を行うための統合APIを定義します。

### 連携データ

| 優先度 | データ       | 方向          | ユースケース              |
| :----: | ------------ | ------------- | ------------------------- |
|   P0   | 従業員マスタ | Portal ↔ DRM | 営業/施工担当者として使用 |
|   P0   | 組織マスタ   | Portal ↔ DRM | 部署・役職の統一管理      |
|   P1   | 勤怠サマリ   | Portal → DRM  | 工事台帳での工数把握      |
|   P2   | SSO認証      | Portal ↔ DRM | シングルサインオン        |

---

## 認証方式

### API Key + HMAC-SHA256署名

全てのAPIリクエストに以下のヘッダーが必要です：

```
X-API-Key: {api_key}
X-Timestamp: {unix_timestamp_ms}
X-Signature: {hmac_sha256_signature}
X-Request-Id: {uuid}
X-Tenant-Id: {tenant_id}  # オプション
```

### 署名生成アルゴリズム

```typescript
import crypto from "crypto";

function generateSignature(
  payload: string, // JSON.stringify(body)
  timestamp: string, // Date.now().toString()
  secret: string, // API Secret
): string {
  const message = `${timestamp}.${payload}`;
  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}
```

### 検証ルール

1. `X-Timestamp` が現在時刻から5分以内
2. 署名が一致
3. API Keyが有効
4. (本番) IPアドレスが許可リスト内

---

## 環境変数

### Portal側（設定済み）

```bash
DRM_API_URL=https://www.dandori-relationship-management.com/api/integration
DRM_API_KEY=portal_to_drm_xxx
DRM_API_SECRET=shared_secret_xxx
DRM_WEBHOOK_SECRET=webhook_secret_xxx
DRM_SSO_SECRET=sso_secret_xxx
DRM_ALLOWED_IPS=xxx.xxx.xxx.xxx
```

### DRM側（要設定）

```bash
PORTAL_API_URL=https://dandori-portal.com/api/integration
PORTAL_API_KEY=drm_to_portal_xxx
PORTAL_API_SECRET=shared_secret_xxx  # Portal側と同じ値
PORTAL_WEBHOOK_SECRET=webhook_secret_xxx  # Portal側と同じ値
PORTAL_SSO_SECRET=sso_secret_xxx  # Portal側と同じ値
PORTAL_ALLOWED_IPS=xxx.xxx.xxx.xxx
```

---

## API エンドポイント一覧

### Portal側（実装済み）

| エンドポイント                       | メソッド | 用途                |
| ------------------------------------ | -------- | ------------------- |
| `/api/integration/health`            | GET      | ヘルスチェック      |
| `/api/integration/webhook`           | POST     | Webhook受信         |
| `/api/integration/employees/push`    | POST     | 従業員をDRMに送信   |
| `/api/integration/employees/pull`    | GET      | DRMが従業員を取得   |
| `/api/integration/employees/receive` | POST     | DRMから従業員を受信 |
| `/api/integration/departments`       | GET/POST | 部署同期            |
| `/api/integration/positions`         | GET/POST | 役職同期            |
| `/api/integration/auth/token`        | POST     | SSOトークン生成     |
| `/api/integration/auth/validate`     | POST     | SSOトークン検証     |
| `/api/integration/auth/callback`     | GET      | SSOコールバック     |
| `/api/integration/auth/redirect`     | GET      | DRMへリダイレクト   |

### DRM側（要実装）

| エンドポイント                      | メソッド | 用途                   |
| ----------------------------------- | -------- | ---------------------- |
| `/api/integration/health`           | GET      | ヘルスチェック         |
| `/api/integration/webhook`          | POST     | Webhook受信            |
| `/api/integration/employees/sync`   | POST     | Portalから従業員を受信 |
| `/api/integration/departments/sync` | POST     | Portalから部署を受信   |
| `/api/integration/positions/sync`   | POST     | Portalから役職を受信   |
| `/api/integration/auth/callback`    | GET      | SSOコールバック        |
| `/api/integration/auth/validate`    | POST     | SSOトークン検証        |

---

## 共通レスポンス形式

```typescript
interface IntegrationApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  requestId: string;
  timestamp: string; // ISO 8601
}
```

### エラーコード

| コード                   | 説明                         |
| ------------------------ | ---------------------------- |
| `INVALID_API_KEY`        | APIキーが無効                |
| `INVALID_SIGNATURE`      | 署名が不正                   |
| `EXPIRED_TIMESTAMP`      | タイムスタンプが期限切れ     |
| `IP_NOT_ALLOWED`         | IPアドレスが許可されていない |
| `INVALID_PAYLOAD`        | リクエストボディが不正       |
| `MISSING_REQUIRED_FIELD` | 必須フィールドが不足         |
| `INVALID_TENANT`         | テナントが無効               |
| `INTERNAL_ERROR`         | サーバーエラー               |

---

## 従業員同期

### データ構造

```typescript
interface EmployeeSyncData {
  employeeNumber: string; // 一意識別子
  name: string;
  nameKana?: string;
  email: string;
  departmentCode?: string;
  departmentName?: string;
  positionCode?: string;
  positionName?: string;
  hireDate?: string; // YYYY-MM-DD
  retirementDate?: string; // YYYY-MM-DD
  status: "active" | "inactive" | "retired";
  employmentType?: string;
  roles?: string[];
}

interface EmployeeSyncRequest {
  tenantId: string;
  employees: EmployeeSyncData[];
  syncType: "full" | "incremental";
  lastSyncAt?: string; // ISO 8601
}

interface EmployeeSyncResponse {
  success: boolean;
  syncedCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errors?: Array<{
    employeeNumber: string;
    error: string;
  }>;
  syncedAt: string;
}
```

### Portal → DRM

**DRM側で実装が必要：**

```
POST /api/integration/employees/sync
```

リクエスト例：

```json
{
  "tenantId": "demo-tenant",
  "employees": [
    {
      "employeeNumber": "EMP001",
      "name": "山田太郎",
      "nameKana": "ヤマダタロウ",
      "email": "yamada@example.com",
      "departmentName": "営業部",
      "positionName": "課長",
      "hireDate": "2020-04-01",
      "status": "active",
      "roles": ["sales", "manager"]
    }
  ],
  "syncType": "incremental",
  "lastSyncAt": "2026-02-25T00:00:00Z"
}
```

### DRM → Portal

**Portal側で実装済み：**

```
GET  /api/integration/employees/pull?tenantId=xxx&lastSyncAt=xxx
POST /api/integration/employees/receive
```

---

## 組織同期

### 部署データ構造

```typescript
interface DepartmentSyncData {
  code: string;
  name: string;
  parentCode?: string;
  sortOrder?: number;
  isActive: boolean;
}
```

### 役職データ構造

```typescript
interface PositionSyncData {
  code: string;
  name: string;
  level?: number;
  sortOrder?: number;
  isActive: boolean;
}
```

---

## Webhook

### イベント種別

```typescript
type IntegrationEvent =
  // Portal → DRM
  | "employee.created"
  | "employee.updated"
  | "employee.retired"
  | "employee.department_changed"
  | "department.created"
  | "department.updated"
  | "department.deleted"
  | "position.created"
  | "position.updated"
  | "attendance.submitted"
  | "attendance.approved"
  | "leave.requested"
  | "leave.approved"
  // DRM → Portal
  | "customer.created"
  | "customer.updated"
  | "contract.created"
  | "contract.signed"
  | "contract.completed"
  | "opportunity.won"
  | "opportunity.lost";
```

### ペイロード

```typescript
interface WebhookPayload<T = unknown> {
  id: string; // UUID（冪等性キー）
  event: IntegrationEvent;
  timestamp: string; // ISO 8601
  tenantId: string;
  data: T;
  signature: string; // HMAC署名
  source: "dandori-portal" | "drm-suite";
  retryCount?: number;
}
```

### Webhookヘッダー

```
Content-Type: application/json
X-Webhook-Signature: {hmac_signature}
X-Timestamp: {unix_timestamp_ms}
```

### 冪等性

- `id` フィールドで重複チェック
- 同じ `id` のイベントは2回目以降スキップ
- 処理済みIDは24時間保持

---

## SSO認証

### フロー（Portal → DRM）

```
1. ユーザーがPortalにログイン済み
2. ユーザーがDRMリンクをクリック
3. Portal: /api/integration/auth/redirect にリダイレクト
4. Portal: SSOトークンを生成
5. Portal: DRMの /auth/sso?sso_token=xxx にリダイレクト
6. DRM: トークンをPortalの /api/integration/auth/validate で検証
7. DRM: 検証成功 → DRMセッション発行 → ダッシュボードへ
```

### フロー（DRM → Portal）

```
1. ユーザーがDRMにログイン済み
2. ユーザーがPortalリンクをクリック
3. DRM: SSOトークンを生成
4. DRM: Portalの /api/integration/auth/callback?sso_token=xxx にリダイレクト
5. Portal: トークンを検証 → Portalセッション発行 → ダッシュボードへ
```

### トークン仕様

```typescript
interface SsoTokenPayload {
  tokenId: string;
  userId: string;
  email: string;
  tenantId: string;
  name: string;
  roles: string[];
  issuedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp（5分後）
  issuer: "dandori-portal" | "drm-suite";
  audience: "dandori-portal" | "drm-suite";
}
```

### トークン検証API

**Portal側（実装済み）：**

```
POST /api/integration/auth/validate
```

リクエスト：

```json
{
  "token": "base64url_encoded_token"
}
```

レスポンス：

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "山田太郎",
      "tenantId": "demo-tenant",
      "roles": ["employee", "sales"]
    },
    "validatedAt": "2026-02-26T10:00:00Z"
  }
}
```

---

## DRM側で実装が必要なもの

### 1. 認証ライブラリ（コピー可）

Portal側の以下のファイルをそのまま使用可能：

- `src/lib/integrations/drm/types.ts` → `src/lib/integrations/portal/types.ts`
- `src/lib/integrations/drm/auth.ts` → `src/lib/integrations/portal/auth.ts`

環境変数名を `DRM_*` から `PORTAL_*` に変更するだけ。

### 2. APIエンドポイント

| 優先度 | エンドポイント                      | 実装内容          |
| :----: | ----------------------------------- | ----------------- |
|   P0   | `/api/integration/health`           | ヘルスチェック    |
|   P0   | `/api/integration/webhook`          | Webhook受信・処理 |
|   P0   | `/api/integration/employees/sync`   | 従業員データ受信  |
|   P1   | `/api/integration/departments/sync` | 部署データ受信    |
|   P1   | `/api/integration/positions/sync`   | 役職データ受信    |
|   P2   | `/api/integration/auth/callback`    | SSOコールバック   |
|   P2   | `/api/integration/auth/validate`    | SSOトークン検証   |

### 3. DBテーブル（オプション）

```sql
-- 統合イベントログ（冪等性管理）
CREATE TABLE integration_events (
  id UUID PRIMARY KEY,
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_integration_events_event_id ON integration_events(event_id);
CREATE INDEX idx_integration_events_tenant_id ON integration_events(tenant_id);
```

---

## テスト計画

### Phase 1: 疎通確認

1. 両システムで `/api/integration/health` を実装
2. 相互にヘルスチェックAPI呼び出し
3. 認証・署名の検証

### Phase 2: 従業員同期テスト

1. Portal → DRM: 従業員Push
2. DRM側でデータ反映確認
3. 変更時Webhook送信確認

### Phase 3: SSOテスト

1. Portal → DRM のSSO遷移
2. DRM → Portal のSSO遷移
3. トークン有効期限切れのエラー処理

---

## お問い合わせ

実装で不明点があればお知らせください。
