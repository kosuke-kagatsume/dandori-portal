'use client';

import { useEffect, useState } from 'react';
import { performanceMonitor } from '@/lib/performance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, TrendingUp, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 開発環境でのみ表示
    if (process.env.NODE_ENV !== 'development') return;

    const updateMetrics = () => {
      const report = performanceMonitor.generateReport();
      setMetrics(report);
    };

    // 初期表示
    updateMetrics();

    // 定期更新（5秒ごと）
    const interval = setInterval(updateMetrics, 5000);

    // Web Vitals測定開始
    performanceMonitor.measureWebVitals();

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50"
        size="icon"
        variant="outline"
      >
        <Activity className="h-4 w-4" />
      </Button>
    );
  }

  const getPerformanceColor = (value: number, type: string = 'default') => {
    if (type === 'fcp' || type === 'lcp') {
      if (value < 1000) return 'text-green-600';
      if (value < 3000) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (type === 'fid') {
      if (value < 100) return 'text-green-600';
      if (value < 300) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (type === 'cls') {
      if (value < 0.1) return 'text-green-600';
      if (value < 0.25) return 'text-yellow-600';
      return 'text-red-600';
    }
    // デフォルト（レンダリング時間など）
    if (value < 50) return 'text-green-600';
    if (value < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (value: number, type: string = 'default') => {
    const color = getPerformanceColor(value, type);
    if (color === 'text-green-600') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (color === 'text-yellow-600') return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-[70vh] overflow-auto shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            パフォーマンスモニター
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => performanceMonitor.clear()}
              className="h-6 w-6"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6"
            >
              ×
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Web Vitals */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">Web Vitals</h4>
          <div className="grid grid-cols-2 gap-2">
            {metrics.web_vitals_fcp && (
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="text-xs">
                  <div className="font-medium">FCP</div>
                  <div className={getPerformanceColor(metrics.web_vitals_fcp.avg, 'fcp')}>
                    {metrics.web_vitals_fcp.avg.toFixed(0)}ms
                  </div>
                </div>
                {getPerformanceIcon(metrics.web_vitals_fcp.avg, 'fcp')}
              </div>
            )}
            {metrics.web_vitals_lcp && (
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="text-xs">
                  <div className="font-medium">LCP</div>
                  <div className={getPerformanceColor(metrics.web_vitals_lcp.avg, 'lcp')}>
                    {metrics.web_vitals_lcp.avg.toFixed(0)}ms
                  </div>
                </div>
                {getPerformanceIcon(metrics.web_vitals_lcp.avg, 'lcp')}
              </div>
            )}
            {metrics.web_vitals_fid && (
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="text-xs">
                  <div className="font-medium">FID</div>
                  <div className={getPerformanceColor(metrics.web_vitals_fid.avg, 'fid')}>
                    {metrics.web_vitals_fid.avg.toFixed(0)}ms
                  </div>
                </div>
                {getPerformanceIcon(metrics.web_vitals_fid.avg, 'fid')}
              </div>
            )}
            {metrics.web_vitals_cls && (
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="text-xs">
                  <div className="font-medium">CLS</div>
                  <div className={getPerformanceColor(metrics.web_vitals_cls.avg, 'cls')}>
                    {metrics.web_vitals_cls.avg.toFixed(3)}
                  </div>
                </div>
                {getPerformanceIcon(metrics.web_vitals_cls.avg, 'cls')}
              </div>
            )}
          </div>
        </div>

        {/* Component Metrics */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">コンポーネント</h4>
          {Object.entries(metrics)
            .filter(([key]) => key.startsWith('component_'))
            .map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">
                    {key.replace('component_render_', '')}
                  </span>
                  <Badge
                    variant={value.avg < 50 ? 'default' : value.avg < 100 ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {value.count} calls
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    Avg: <span className={getPerformanceColor(value.avg)}>
                      {value.avg.toFixed(1)}ms
                    </span>
                  </div>
                  <div>
                    P95: <span className={getPerformanceColor(value.p95)}>
                      {value.p95.toFixed(1)}ms
                    </span>
                  </div>
                  <div>
                    Max: <span className={getPerformanceColor(value.max)}>
                      {value.max.toFixed(1)}ms
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Async Operations */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">非同期処理</h4>
          {Object.entries(metrics)
            .filter(([key]) => key.startsWith('async_'))
            .map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">
                    {key.replace('async_', '').replace('_error', ' (エラー)')}
                  </span>
                  <Badge
                    variant={key.includes('error') ? 'destructive' : 'default'}
                    className="text-xs"
                  >
                    {value.count} calls
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    Avg: <span className={getPerformanceColor(value.avg)}>
                      {value.avg.toFixed(1)}ms
                    </span>
                  </div>
                  <div>
                    P95: <span className={getPerformanceColor(value.p95)}>
                      {value.p95.toFixed(1)}ms
                    </span>
                  </div>
                  <div>
                    Max: <span className={getPerformanceColor(value.max)}>
                      {value.max.toFixed(1)}ms
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Summary */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">総測定数:</span>{' '}
              <span className="font-medium">
                {Object.values(metrics).reduce((acc: number, m: any) => acc + (m.count || 0), 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">キャッシュヒット率:</span>{' '}
              <span className="font-medium text-green-600">
                {/* キャッシュヒット率の計算ロジック */}
                --
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}