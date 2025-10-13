'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, LogIn, UserPlus, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMounted } from '@/hooks/useIsMounted';

export default function LoginPage() {
  const mounted = useIsMounted();

  if (!mounted) return null;

  return <ActualLoginForm />;
}

function ActualLoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ログインフォーム
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // サインアップフォーム
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupDepartment, setSignupDepartment] = useState('');

  // ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('ログインしました');
      router.push('/ja/dashboard');
    } catch (error: any) {
      setError(error.message || 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // サインアップ処理
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Supabase Authでユーザー作成
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            name: signupName,
            department: signupDepartment,
          },
        },
      });

      if (authError) throw authError;

      // 2. usersテーブルにもレコード作成（通常はトリガーやRPCで行う）
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: signupEmail,
            name: signupName,
            department: signupDepartment,
            organization_id: '11111111-1111-1111-1111-111111111111', // デモ組織
            role: 'member',
          });

        if (profileError) console.error('Profile creation error:', profileError);
      }

      toast.success('アカウントを作成しました');
      router.push('/ja/dashboard');
    } catch (error: any) {
      setError(error.message || 'アカウント作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // デモログイン
  const handleDemoLogin = async () => {
    console.log('Demo login clicked');
    setIsLoading(true);
    setError(null);

    try {
      // デモログインAPIを呼び出す（トークンはサーバー側で検証）
      const token = '2b723ccc348073981432fcc0741efcd05c50915144d7d144e16e3cf384a85134';
      
      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: 'demo@dandori.local',
          password: 'demo-demo-demo',
        }),
      });
      
      // レスポンスをテキストとして取得して、JSONかどうか確認
      const text = await response.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (e) {
        // JSONパースエラーの場合、レスポンスが認証エラーの可能性
        if (response.status === 401) {
          throw new Error('認証エラー: デモログインが無効です');
        }
        throw new Error(`サーバーエラー: ${text}`);
      }
      
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'デモログインに失敗しました');
      }
      
      console.log('Demo login successful:', data);
      
      // デモモードを有効にする
      localStorage.setItem('demo_mode', 'true');
      
      // 成功したらページをリロード（認証状態を更新）
      toast.success('デモアカウントでログインしました');
      window.location.href = '/ja/dashboard';
      
    } catch (error: any) {
      console.error('Demo login error:', error);
      setError(error.message || 'デモログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
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
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ログイン/サインアップカード */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>アカウント</CardTitle>
            <CardDescription>
              ログインまたは新規登録してください
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">ログイン</TabsTrigger>
                <TabsTrigger value="signup">新規登録</TabsTrigger>
              </TabsList>
              
              {/* ログインタブ */}
              <TabsContent value="login">
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
                      disabled={isLoading}
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
                      disabled={isLoading}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="mr-2 h-4 w-4" />
                    )}
                    ログイン
                  </Button>
                </form>
              </TabsContent>
              
              {/* サインアップタブ */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">氏名</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="山田太郎"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">メールアドレス</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-department">部署</Label>
                    <Input
                      id="signup-department"
                      type="text"
                      placeholder="営業部"
                      value={signupDepartment}
                      onChange={(e) => setSignupDepartment(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">パスワード</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    アカウント作成
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDemoLogin}
              disabled={isLoading}
              type="button"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Building2 className="mr-2 h-4 w-4" />
              )}
              デモアカウントでログイン
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