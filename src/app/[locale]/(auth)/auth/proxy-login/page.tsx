'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck, AlertCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProxyLoginPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'ja';
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('トークンが見つかりません');
      return;
    }

    const verifyAndLogin = async () => {
      try {
        const response = await fetch('/api/auth/proxy-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || '代理ログインに失敗しました');
        }

        // APIがCookieを設定済み - ユーザー情報を表示用に保存
        setTenantName(result.data.tenant?.name || null);
        setUserName(result.data.user.name || result.data.user.email);
        setStatus('success');

        // 少し待ってからダッシュボードへリダイレクト
        setTimeout(() => {
          router.push(`/${locale}/dashboard`);
        }, 1500);
      } catch (err) {
        console.error('Proxy login error:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : '代理ログインに失敗しました');
      }
    };

    verifyAndLogin();
  }, [token, router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* ロゴとタイトル */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
              <ShieldCheck className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            代理ログイン
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            DW管理者として代理ログインしています
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">
              {status === 'loading' && '認証中...'}
              {status === 'success' && 'ログイン成功'}
              {status === 'error' && 'エラー'}
            </CardTitle>
            <CardDescription className="text-center">
              {status === 'loading' && 'トークンを検証しています'}
              {status === 'success' && 'ダッシュボードへリダイレクトします'}
              {status === 'error' && '代理ログインに失敗しました'}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center space-y-4">
            {status === 'loading' && (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  しばらくお待ちください...
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center py-8">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                  <ShieldCheck className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                {tenantName && (
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {tenantName}
                    </span>
                  </div>
                )}
                {userName && (
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {userName}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  ダッシュボードへ移動しています...
                </p>
                <Loader2 className="h-5 w-5 animate-spin text-gray-400 mt-4" />
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center py-8">
                <Alert className="border-red-200 bg-red-50 text-red-800 mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  トークンが無効または期限切れの可能性があります。
                  <br />
                  DW管理画面から再度代理ログインを実行してください。
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.close()}
                >
                  このタブを閉じる
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 注意書き */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            この代理ログインセッションはDW管理者によって開始されました。
            <br />
            ログアウトすると通常のログイン状態に戻ります。
          </p>
        </div>
      </div>
    </div>
  );
}
