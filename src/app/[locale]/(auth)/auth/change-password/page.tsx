'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/lib/store/user-store';
import { saveTokenData } from '@/lib/auth/token-manager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Building2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePasswordPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'ja';
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);
  const setTokens = useUserStore((state) => state.setTokens);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!newPassword) {
      setError('新しいパスワードを入力してください');
      return;
    }

    if (newPassword.length < 8) {
      setError('パスワードは8文字以上必要です');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'パスワードの変更に失敗しました');
      }

      // ユーザーストアとトークンを初期化（セッション確立）
      if (data.data) {
        const { user, accessToken, refreshToken, expiresIn } = data.data;
        if (accessToken && refreshToken) {
          saveTokenData(accessToken, refreshToken, expiresIn);
          setTokens(accessToken, refreshToken);
        }
        if (user) {
          setCurrentUser({
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles || [user.role || 'employee'],
            department: user.department,
            position: user.position,
            tenantId: user.tenantId,
          } as import('@/types').User);
        }
      }

      toast.success('パスワードを変更しました');
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'パスワードの変更に失敗しました';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
        </div>

        {/* 案内メッセージ */}
        <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-800">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            初回ログインのため、セキュリティ上の理由から新しいパスワードの設定が必要です。
          </AlertDescription>
        </Alert>

        {/* エラー表示 */}
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* パスワード変更カード */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              パスワード変更
            </CardTitle>
            <CardDescription>
              新しいパスワードを設定してください
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">新しいパスワード</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="8文字以上"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="pl-10"
                    minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="パスワードを再入力"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="pl-10"
                  />
                </div>
                {newPassword && confirmPassword && newPassword === confirmPassword && (
                  <div className="flex items-center text-green-600 text-sm">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    パスワードが一致しています
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                <p>パスワードの要件:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>8文字以上</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    変更中...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    パスワードを変更
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* フッター */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
          © 2024 Dandori Portal. All rights reserved.
        </p>
      </div>
    </div>
  );
}
