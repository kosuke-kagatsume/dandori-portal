# Dandori Portal ↔ DRM Suite 統合API計画

> **作成日**: 2026-02-26
> **ステータス**: 実装中

---

## 概要

Dandori Portal（HR系）とDRM Suite（CRM系）をシームレスに連携するための統合API基盤を構築する。

### システム情報

| システム       | リポジトリ     | 本番URL                             | DB                   |
| -------------- | -------------- | ----------------------------------- | -------------------- |
| Dandori Portal | dandori-portal | dandori-portal.com                  | RDS (dandori_portal) |
| DRM Suite      | drm            | dandori-relationship-management.com | RDS (drm_suite)      |

---

## 連携データ優先度

| 優先度 | データ       | 方向         | ユースケース                   |
| :----: | ------------ | ------------ | ------------------------------ |
|   P0   | 従業員マスタ | Portal → DRM | DRMで営業/施工担当者として使用 |
|   P0   | 組織マスタ   | 双方向       | 部署・役職の統一管理           |
|   P1   | 勤怠サマリ   | Portal → DRM | 工事台帳での工数把握           |
|   P1   | 顧客/案件    | DRM → Portal | HR側での案件関連情報参照       |
|   P2   | 給与/手当    | Portal → DRM | 営業インセンティブ計算         |
|   P2   | 認証統合     | 双方向       | SSO                            |

---

## 実装フェーズ

### Phase 1: 認証・認可基盤 ✅ 完了

**目標**: 両システムが安全に通信できる土台を構築

**成果物（Dandori Portal側）**:

- [x] `src/lib/integrations/drm/types.ts` - 共通型定義
- [x] `src/lib/integrations/drm/auth.ts` - API認証・署名検証
- [x] `src/lib/integrations/drm/webhook.ts` - Webhook送受信
- [x] `src/lib/integrations/drm/client.ts` - DRM APIクライアント
- [x] `src/lib/integrations/drm/audit.ts` - 監査ログ
- [x] `src/lib/integrations/drm/index.ts` - エクスポート
- [x] `src/app/api/integration/health/route.ts` - ヘルスチェック
- [x] `src/app/api/integration/webhook/route.ts` - Webhook受信
- [ ] 環境変数設定（デプロイ時）: `DRM_API_KEY`, `DRM_API_SECRET`, `DRM_WEBHOOK_SECRET`

**成果物（DRM側）**:

- [ ] 同様の構成

**セキュリティ要件**:

- API Key + HMAC-SHA256署名
- タイムスタンプ検証（5分以内）
- IP制限（本番環境）
- Rate Limiting（1000 req/min）
- 監査ログ

### Phase 2: 従業員同期

**API設計**:

```
POST /api/integration/employees/push   # Portal → DRM
GET  /api/integration/employees/pull   # DRM → Portal
POST /api/integration/employees/webhook # リアルタイム通知
```

**同期フィールド**:

- employeeNumber（一意識別子）
- name, nameKana, email
- department, position
- hireDate, status

### Phase 3: 組織同期

**対象テーブル**:

- departments（部署）
- positions（役職）

### Phase 4: SSO認証統合

**候補**:

1. 共有Cognito
2. SAML/OIDC
3. カスタムトークン交換

---

## API認証仕様

### リクエストヘッダー

```
X-API-Key: {api_key}
X-Timestamp: {unix_timestamp}
X-Signature: {hmac_sha256_signature}
X-Request-Id: {uuid}
```

### 署名生成

```typescript
const payload = JSON.stringify(body);
const message = `${timestamp}.${payload}`;
const signature = crypto
  .createHmac("sha256", apiSecret)
  .update(message)
  .digest("hex");
```

### 検証ルール

1. タイムスタンプが現在時刻から5分以内
2. 署名が一致
3. API Keyが有効
4. (本番) IPアドレスが許可リスト内

---

## Webhook仕様

### イベント種別

```typescript
type IntegrationEvent =
  // Portal → DRM
  | "employee.created"
  | "employee.updated"
  | "employee.retired"
  | "department.created"
  | "department.updated"
  | "attendance.submitted"
  // DRM → Portal
  | "customer.created"
  | "contract.signed";
```

### ペイロード

```typescript
interface WebhookPayload {
  id: string; // イベントID（冪等性キー）
  event: IntegrationEvent;
  timestamp: string; // ISO 8601
  tenantId: string;
  data: Record<string, unknown>;
  signature: string; // HMAC署名
}
```

### 冪等性

- `integration_events` テーブルで処理済みイベントID管理
- 重複イベントはスキップ

---

## 環境変数

### Dandori Portal

```bash
# DRM連携
DRM_API_URL=https://www.dandori-relationship-management.com/api/integration
DRM_API_KEY=drm_portal_xxx
DRM_API_SECRET=xxx
DRM_WEBHOOK_SECRET=xxx
DRM_ALLOWED_IPS=x.x.x.x,y.y.y.y
```

### DRM Suite

```bash
# Portal連携
PORTAL_API_URL=https://dandori-portal.com/api/integration
PORTAL_API_KEY=portal_drm_xxx
PORTAL_API_SECRET=xxx
PORTAL_WEBHOOK_SECRET=xxx
PORTAL_ALLOWED_IPS=x.x.x.x,y.y.y.y
```

---

## 進捗ログ

| 日付       | 内容                                                 |
| ---------- | ---------------------------------------------------- |
| 2026-02-26 | 計画策定、Phase 1開始                                |
| 2026-02-26 | Phase 1完了（認証・Webhook・クライアント・監査ログ） |
| 2026-02-26 | Phase 2完了（従業員同期 push/pull/receive API）      |
| 2026-02-26 | Phase 3完了（組織同期 departments/positions API）    |
