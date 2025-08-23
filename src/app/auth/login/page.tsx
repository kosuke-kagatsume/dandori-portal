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

export default function LoginPage() {
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
      router.push('/dashboard');
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
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'アカウント作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // デモログイン
  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // デモモード: Supabaseを使わずに直接ログイン
      // 本番環境ではSupabaseの設定後に以下のコメントを解除
      /*
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'tanaka@demo.com',
        password: 'demo1234',
      });

      if (error) throw error;
      */

      // デモユーザー情報をローカルストレージに保存
      const demoUser = {
        id: 'demo-user-1',
        email: 'tanaka@demo.com',
        name: '田中太郎',
        department: '営業部',
        role: 'manager',
      };
      
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      
      toast.success('デモアカウントでログインしました');
      router.push('/ja/dashboard');
    } catch (error: any) {
      setError('デモログインに失敗しました');
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
                    <Label htmlFor="signup-name">お名前</Label>
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
                    <Label htmlFor="signup-password">パスワード</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
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