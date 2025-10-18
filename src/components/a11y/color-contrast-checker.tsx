'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { validateDandoriColors, type ContrastResult } from '@/lib/a11y/color-contrast';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

/**
 * カラーコントラストチェッカー
 *
 * 開発環境で使用し、アプリケーションの色の組み合わせが
 * WCAG 2.1 アクセシビリティ基準を満たしているかを視覚的に表示します。
 */
export function ColorContrastChecker() {
  const [results, setResults] = useState<Record<string, ContrastResult>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // コンポーネントマウント後に色を検証
    const colorResults = validateDandoriColors();
    setResults(colorResults);
  }, []);

  if (!mounted) {
    return null;
  }

  const getStatusIcon = (result: ContrastResult) => {
    if (result.wcagAAA.normal) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    } else if (result.wcagAA.normal) {
      return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
    } else if (result.wcagAA.large) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusBadge = (result: ContrastResult) => {
    if (result.wcagAAA.normal) {
      return <Badge variant="default" className="bg-green-600">AAA</Badge>;
    } else if (result.wcagAA.normal) {
      return <Badge variant="default" className="bg-blue-600">AA</Badge>;
    } else if (result.wcagAA.large) {
      return <Badge variant="secondary">AA (Large)</Badge>;
    } else {
      return <Badge variant="destructive">不合格</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>カラーコントラスト検証</CardTitle>
        <CardDescription>
          WCAG 2.1 アクセシビリティ基準に基づくコントラスト比の検証結果
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(results).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            色の組み合わせを読み込んでいます...
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(results).map(([name, result]) => (
              <div
                key={name}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(result)}
                  <div>
                    <p className="font-medium text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      コントラスト比: {result.ratio}:1
                    </p>
                  </div>
                </div>
                {getStatusBadge(result)}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold text-sm mb-2">WCAG基準</h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• AAA 通常テキスト: 7:1 以上</li>
            <li>• AA 通常テキスト: 4.5:1 以上</li>
            <li>• AA 大きいテキスト: 3:1 以上</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * コンパクト版カラーコントラストインジケーター
 * 設定画面などに組み込みやすい簡易版
 */
export function ColorContrastIndicator() {
  const [allPass, setAllPass] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const results = validateDandoriColors();
    const pass = Object.values(results).every((r) => r.wcagAA.normal);
    setAllPass(pass);
  }, []);

  if (!mounted || allPass === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {allPass ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm text-muted-foreground">
            WCAG AA準拠
          </span>
        </>
      ) : (
        <>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-muted-foreground">
            一部要改善
          </span>
        </>
      )}
    </div>
  );
}
