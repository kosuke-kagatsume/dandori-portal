// パフォーマンス監視とレポーティング

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

interface PerformanceMetricReport {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput?: boolean;
  value: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  // NEXT_PUBLIC_*はビルド時に置き換わるため、ブラウザでも動作する
  private enabled: boolean = process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE === 'true';

  // コンポーネントのレンダリング時間を測定
  measureComponent(componentName: string, callback: () => void): void {
    if (!this.enabled) {
      callback();
      return;
    }

    const start = performance.now();
    callback();
    const duration = performance.now() - start;

    this.recordMetric(`component_render_${componentName}`, duration);
  }

  // 非同期処理の実行時間を測定
  async measureAsync<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    if (!this.enabled) {
      return operation();
    }

    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      this.recordMetric(`async_${operationName}`, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`async_${operationName}_error`, duration);
      throw error;
    }
  }

  // メトリクスを記録
  public recordMetric(name: string, value: number): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // 最新100件のみ保持
    if (metrics.length > 100) {
      metrics.shift();
    }

    // 開発環境では警告を出力
    if (value > 100) {
      console.warn(`⚠️ Performance warning: ${name} took ${value.toFixed(2)}ms`);
    }
  }

  // パフォーマンスレポートを生成
  generateReport(): Record<string, PerformanceMetricReport> {
    const report: Record<string, PerformanceMetricReport> = {};

    this.metrics.forEach((metrics, name) => {
      if (metrics.length === 0) return;

      const values = metrics.map(m => m.value);
      const sorted = [...values].sort((a, b) => a - b);

      report[name] = {
        count: metrics.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    });

    return report;
  }

  // メトリクスをクリア
  clear(): void {
    this.metrics.clear();
  }

  // Web Vitalsの測定
  measureWebVitals(): void {
    if (typeof window === 'undefined') return;

    // First Contentful Paint (FCP)
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('web_vitals_fcp', entry.startTime);
        }
      }
    });
    paintObserver.observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('web_vitals_lcp', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const eventEntry = entry as PerformanceEventTiming;
        const delay = eventEntry.processingStart - eventEntry.startTime;
        this.recordMetric('web_vitals_fid', delay);
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as LayoutShiftEntry;
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
          this.recordMetric('web_vitals_cls', clsValue);
        }
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React用のパフォーマンス測定フック
export function usePerformanceTracking(componentName: string) {
  // NEXT_PUBLIC_*はビルド時に置き換わるため、ブラウザでも動作する
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE === 'true') {
    const renderStart = performance.now();

    // コンポーネントのアンマウント時に測定
    return () => {
      const renderDuration = performance.now() - renderStart;
      performanceMonitor.recordMetric(`component_lifecycle_${componentName}`, renderDuration);
    };
  }

  return () => {};
}