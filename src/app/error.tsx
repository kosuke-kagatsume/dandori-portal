'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">エラーが発生しました</h2>
        <p className="text-muted-foreground mb-4">
          申し訳ございません。予期しないエラーが発生しました。
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset}>もう一度試す</Button>
          <Button variant="outline" onClick={() => window.location.href = '/auth/login'}>
            ログインページへ
          </Button>
        </div>
      </div>
    </div>
  );
}