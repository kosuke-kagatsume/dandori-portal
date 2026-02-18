'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';

function TenantNotFoundContent() {
  const searchParams = useSearchParams();
  const subdomain = searchParams.get('subdomain');
  const fromDWAdmin = searchParams.get('from') === 'dw-admin';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-2xl">テナントが見つかりません</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            {subdomain ? (
              <p>
                サブドメイン「<strong className="text-foreground">{subdomain}</strong>」に
                対応するテナントが登録されていません。
              </p>
            ) : (
              <p>指定されたテナントが見つかりませんでした。</p>
            )}
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              考えられる原因
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>URLが正しくない可能性があります</li>
              <li>テナントがまだ登録されていない可能性があります</li>
              <li>テナントが無効化されている可能性があります</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            {fromDWAdmin ? (
              <Link href="/dw-admin/tenants" className="w-full">
                <Button className="w-full" variant="default">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  DW管理画面に戻る
                </Button>
              </Link>
            ) : (
              <Link href="https://dandori-portal.com" className="w-full">
                <Button className="w-full" variant="default">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  トップページに戻る
                </Button>
              </Link>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            問題が解決しない場合は、管理者にお問い合わせください。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TenantNotFoundPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div>読み込み中...</div>
      </div>
    }>
      <TenantNotFoundContent />
    </Suspense>
  );
}
