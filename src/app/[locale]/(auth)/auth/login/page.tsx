'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/lib/store/user-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  return <ActualLoginForm />;
}

function ActualLoginForm() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'ja';
  const login = useUserStore((state) => state.login);
  const storeError = useUserStore((state) => state.error);
  const storeLoading = useUserStore((state) => state.isLoading);

  const [localError, setLocalError] = useState<string | null>(null);

  // ログインフォーム
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // エラー表示（ストアのエラーとローカルエラーを統合）
  const displayError = localError || storeError;

  // ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      // APIを直接呼び出してpasswordResetRequiredをチェック
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'ログインに失敗しました');
      }

      // passwordResetRequiredがtrueの場合はパスワード変更ページへリダイレクト
      if (result.data.user.passwordResetRequired) {
        toast.info('初回ログインのため、パスワードの変更が必要です');
        router.push(`/${locale}/auth/change-password`);
        return;
      }

      // 通常のログイン処理を続行
      await login(email, password);

      toast.success('ログインしました');
      router.push(`/${locale}/dashboard`);
    } catch (error: unknown) {
      const errorMessage = (error as Error)?.message || 'ログインに失敗しました';
      setLocalError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // デモログイン（デモアカウントの情報を自動入力）
  const handleDemoLogin = () => {
    setEmail('demo@dandori.local');
    setPassword('demo-demo-demo');
    toast.info('デモアカウントの情報を入力しました。ログインボタンを押してください。');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* ロゴとタイトル */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
              <Building2 className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dandori Portal
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            統合型人事管理システム
          </p>
        </div>

        {/* エラー表示 */}
        {displayError && (
          <Alert className="mb-4 border-red-200 bg-red-50 text-red-800">
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        )}

        {/* ログインカード */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>ログイン</CardTitle>
            <CardDescription>
              メールアドレスとパスワードを入力してください
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={storeLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={storeLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={storeLoading}
                data-testid="login-submit-button"
              >
                {storeLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                ログイン
              </Button>
            </form>
          </CardContent>

          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDemoLogin}
              disabled={storeLoading}
              type="button"
              data-testid="demo-login-button"
            >
              <Building2 className="mr-2 h-4 w-4" />
              デモアカウント情報を入力
            </Button>
          </CardFooter>
        </Card>

        {/* フッター */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
          © 2024 Dandori Portal. All rights reserved.
        </p>
      </div>
    </div>
  );
}