# API統合ガイド

このドキュメントは、Dandori PortalをバックエンドAPIと統合する方法を説明します。

## 目次

1. [概要](#概要)
2. [APIクライアントの使い方](#apiクライアントの使い方)
3. [認証の実装](#認証の実装)
4. [オンボーディングAPIの使用例](#オンボーディングapiの使用例)
5. [エラーハンドリング](#エラーハンドリング)
6. [環境変数の設定](#環境変数の設定)
7. [デモモードとプロダクションモードの切り替え](#デモモードとプロダクションモードの切り替え)

## 概要

現在、Dandori Portalはデモモードで動作しており、すべてのデータはフロントエンドのZustandストアとlocalStorageで管理されています。

Phase 4では、実際のバックエンドAPIとの連携を準備するため、以下のコンポーネントを実装しました：

- **APIクライアント** (`src/lib/api/client.ts`): HTTP リクエストを行うための中央クライアント
- **認証API** (`src/lib/api/auth.ts`): 認証・認可に関するAPI エンドポイント
- **オンボーディングAPI** (`src/lib/api/onboarding.ts`): オンボーディングフォームに関するAPI エンドポイント

## APIクライアントの使い方

### 基本的な使用方法

```typescript
import { apiClient } from '@/lib/api/client';

// GET リクエスト
const data = await apiClient.get<ResponseType>('/endpoint');

// POST リクエスト
const result = await apiClient.post<ResponseType, RequestType>(
  '/endpoint',
  requestData
);

// PUT リクエスト
const updated = await apiClient.put<ResponseType, RequestType>(
  '/endpoint',
  requestData
);

// DELETE リクエスト
await apiClient.delete('/endpoint');
```

### 認証トークンの設定

```typescript
import { apiClient } from '@/lib/api/client';

// ログイン後、トークンを設定
apiClient.setToken(accessToken);

// ログアウト時、トークンをクリア
apiClient.setToken(null);
```

## 認証の実装

### ログイン

```typescript
import { login } from '@/lib/api/auth';

try {
  const { user, accessToken, refreshToken, expiresIn } = await login({
    email: 'user@example.com',
    password: 'password123',
  });

  // トークンを保存（例：localStorage、cookie、state management）
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);

  // ユーザー情報をストアに保存
  // ...
} catch (error) {
  if (error instanceof APIError) {
    console.error(`Error ${error.status}: ${error.message}`);
  }
}
```

### トークンのリフレッシュ

```typescript
import { refreshToken } from '@/lib/api/auth';

try {
  const currentRefreshToken = localStorage.getItem('refreshToken');

  const { accessToken, refreshToken: newRefreshToken } = await refreshToken({
    refreshToken: currentRefreshToken!,
  });

  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', newRefreshToken);
} catch (error) {
  // リフレッシュ失敗 → ログアウト処理
  console.error('Token refresh failed:', error);
  // Redirect to login page
}
```

### 現在のユーザー情報の取得

```typescript
import { getCurrentUser } from '@/lib/api/auth';

try {
  const user = await getCurrentUser();
  console.log('Current user:', user);
} catch (error) {
  console.error('Failed to get current user:', error);
}
```

## オンボーディングAPIの使用例

### 申請一覧の取得

```typescript
import { listApplications } from '@/lib/api/onboarding';

try {
  const { data, total, page, totalPages } = await listApplications({
    status: 'submitted',
    page: 1,
    limit: 10,
  });

  console.log(`Total: ${total}, Page: ${page}/${totalPages}`);
  data.forEach((app) => {
    console.log(`Application ${app.id}: ${app.applicantName}`);
  });
} catch (error) {
  console.error('Failed to fetch applications:', error);
}
```

### 新規申請の作成

```typescript
import { createApplication } from '@/lib/api/onboarding';

try {
  const newApplication = await createApplication({
    applicantEmail: 'newemployee@example.com',
    applicantName: '新入 太郎',
    hireDate: '2025-04-01',
    department: '営業部',
    position: '営業担当',
  });

  console.log('Created application:', newApplication.id);
} catch (error) {
  console.error('Failed to create application:', error);
}
```

### 基本情報フォームの送信

```typescript
import { submitBasicInfoForm } from '@/lib/api/onboarding';

try {
  const formData = {
    email: 'newemployee@example.com',
    lastNameKanji: '新入',
    firstNameKanji: '太郎',
    // ... その他のフィールド
  };

  const result = await submitBasicInfoForm(applicationId, formData);
  console.log('Form submitted:', result);
} catch (error) {
  console.error('Failed to submit form:', error);
}
```

### フォームの承認

```typescript
import { approveBasicInfoForm } from '@/lib/api/onboarding';

try {
  const approvedForm = await approveBasicInfoForm(applicationId, {
    comment: '承認しました。',
  });

  console.log('Form approved at:', approvedForm.approvedAt);
} catch (error) {
  console.error('Failed to approve form:', error);
}
```

### フォームの差し戻し

```typescript
import { returnBasicInfoForm } from '@/lib/api/onboarding';

try {
  const returnedForm = await returnBasicInfoForm(applicationId, {
    comment: '住所の記載に誤りがあるようです。',
    reason: '住所表記の誤り',
  });

  console.log('Form returned at:', returnedForm.returnedAt);
} catch (error) {
  console.error('Failed to return form:', error);
}
```

## エラーハンドリング

### APIエラーの種類

```typescript
import { APIError } from '@/lib/api/client';

try {
  const data = await apiClient.get('/some-endpoint');
} catch (error) {
  if (error instanceof APIError) {
    switch (error.status) {
      case 400:
        console.error('Bad Request:', error.message);
        break;
      case 401:
        console.error('Unauthorized:', error.message);
        // ログインページにリダイレクト
        break;
      case 403:
        console.error('Forbidden:', error.message);
        break;
      case 404:
        console.error('Not Found:', error.message);
        break;
      case 500:
        console.error('Internal Server Error:', error.message);
        break;
      default:
        console.error(`Error ${error.status}:`, error.message);
    }

    // エラー詳細の表示
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
  } else {
    console.error('Unknown error:', error);
  }
}
```

### グローバルエラーハンドラーの実装

```typescript
// src/lib/api/error-handler.ts
import { APIError } from './client';
import { toast } from '@/components/ui/use-toast';

export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    // ユーザーにエラーメッセージを表示
    toast({
      variant: 'destructive',
      title: 'エラーが発生しました',
      description: error.message,
    });

    // 401エラー → ログインページにリダイレクト
    if (error.status === 401) {
      window.location.href = '/login';
    }
  } else {
    toast({
      variant: 'destructive',
      title: 'エラーが発生しました',
      description: '予期しないエラーが発生しました。',
    });
  }
}
```

## 環境変数の設定

### `.env.local` の作成

```bash
# .env.local を作成
cp .env.local.example .env.local
```

### 必須環境変数

```bash
# バックエンドAPI URL
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"

# デモモードの有効/無効
NEXT_PUBLIC_DEMO_MODE="false"  # プロダクションではfalseに設定

# デバッグログの有効/無効
NEXT_PUBLIC_DEBUG="false"

# APIリクエストのログ
NEXT_PUBLIC_LOG_API_REQUESTS="true"  # 開発中はtrueに設定
```

### プロダクション環境

```bash
# プロダクションのAPI URL
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api/v1"

# デモモードを無効化
NEXT_PUBLIC_DEMO_MODE="false"

# デバッグログを無効化
NEXT_PUBLIC_DEBUG="false"

# APIログを無効化
NEXT_PUBLIC_LOG_API_REQUESTS="false"
```

## デモモードとプロダクションモードの切り替え

### デモモードからプロダクションモードへの移行手順

1. **環境変数の設定**

```bash
# .env.local
NEXT_PUBLIC_DEMO_MODE="false"
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api/v1"
```

2. **Zustandストアの修正**

デモモードではlocalStorageのみを使用していますが、プロダクションモードではAPIを併用します。

```typescript
// src/lib/store/onboarding-store.ts の例
export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      // ... state definitions

      submitBasicInfoForm: async () => {
        const { basicInfoForm, currentApplicationId } = get();

        if (!currentApplicationId || !basicInfoForm) {
          throw new Error('No application or form data');
        }

        // プロダクションモード: APIを使用
        if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
          try {
            const result = await submitBasicInfoForm(
              currentApplicationId,
              basicInfoForm
            );

            set({
              basicInfoForm: result,
            });
          } catch (error) {
            handleAPIError(error);
            throw error;
          }
        } else {
          // デモモード: ローカルストアのみ更新
          set({
            basicInfoForm: {
              ...basicInfoForm,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
            },
          });
        }
      },
    }),
    {
      name: 'onboarding-storage',
    }
  )
);
```

3. **認証フローの統合**

デモモードではハードコードされたユーザー情報を使用していますが、プロダクションでは実際のログインAPIを使用します。

```typescript
// src/app/[locale]/login/page.tsx の例
const handleLogin = async (data: { email: string; password: string }) => {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    // デモモード: ハードコードされたユーザー
    switchDemoRole('employee');
    router.push('/dashboard');
  } else {
    // プロダクションモード: 実際のAPI
    try {
      const { user, accessToken } = await login(data);
      localStorage.setItem('accessToken', accessToken);
      router.push('/dashboard');
    } catch (error) {
      handleAPIError(error);
    }
  }
};
```

## まとめ

Phase 4-1では、バックエンドAPIとの統合準備として以下を実装しました：

- ✅ 型安全なAPIクライアント
- ✅ 認証API（ログイン、トークンリフレッシュ、パスワード管理）
- ✅ オンボーディングAPI（CRUD操作、承認フロー）
- ✅ エラーハンドリング
- ✅ 環境変数による設定管理
- ✅ デモモード/プロダクションモードの切り替え準備

次のステップでは、これらのAPIをZustandストアに統合し、実際のバックエンドとの通信を実装していきます。
