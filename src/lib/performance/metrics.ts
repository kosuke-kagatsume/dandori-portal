/**
 * パフォーマンス計測ユーティリティ
 *
 * Web Vitalsやカスタムメトリクスを計測
 */

'use client';

/**
 * パフォーマンスメトリクスの型
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

/**
 * Web Vitalsの閾値
 */
const THRESHOLDS = {
  // Largest Contentful Paint (LCP)
  LCP: {
    good: 2500,
    poor: 4000,
  },
  // First Input Delay (FID)
  FID: {
    good: 100,
    poor: 300,
  },
  // Cumulative Layout Shift (CLS)
  CLS: {
    good: 0.1,
    poor: 0.25,
  },
  // First Contentful Paint (FCP)
  FCP: {
    good: 1800,
    poor: 3000,
  },
  // Time to First Byte (TTFB)
  TTFB: {
    good: 800,
    poor: 1800,
  },
};

/**
 * メトリクスの評価を判定
 */
function getRating(
  value: number,
  thresholds: { good: number; poor: number }
): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Web Vitalsを計測
 *
 * next/scriptのweb-vitalsを使用することを推奨
 */
export function measureWebVitals(
  onMetric: (metric: PerformanceMetric) => void
) {
  if (typeof window === 'undefined') return;

  // web-vitalsライブラリを動的インポート
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
    onCLS((metric) => {
      onMetric({
        name: 'CLS',
        value: metric.value,
        rating: getRating(metric.value, THRESHOLDS.CLS),
        timestamp: Date.now(),
      });
    });

    onFID((metric) => {
      onMetric({
        name: 'FID',
        value: metric.value,
        rating: getRating(metric.value, THRESHOLDS.FID),
        timestamp: Date.now(),
      });
    });

    onFCP((metric) => {
      onMetric({
        name: 'FCP',
        value: metric.value,
        rating: getRating(metric.value, THRESHOLDS.FCP),
        timestamp: Date.now(),
      });
    });

    onLCP((metric) => {
      onMetric({
        name: 'LCP',
        value: metric.value,
        rating: getRating(metric.value, THRESHOLDS.LCP),
        timestamp: Date.now(),
      });
    });

    onTTFB((metric) => {
      onMetric({
        name: 'TTFB',
        value: metric.value,
        rating: getRating(metric.value, THRESHOLDS.TTFB),
        timestamp: Date.now(),
      });
    });
  });
}

/**
 * カスタムパフォーマンス計測
 */
export class PerformanceTracker {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  /**
   * 計測開始
   */
  mark(name: string) {
    if (typeof performance === 'undefined') return;

    const timestamp = performance.now();
    this.marks.set(name, timestamp);
    performance.mark(name);
  }

  /**
   * 計測終了と時間取得
   */
  measure(name: string, startMark: string, endMark?: string): number | null {
    if (typeof performance === 'undefined') return null;

    try {
      const measureName = `${startMark}-to-${endMark || 'now'}`;

      if (endMark) {
        performance.measure(measureName, startMark, endMark);
      } else {
        this.mark(`${name}-end`);
        performance.measure(measureName, startMark, `${name}-end`);
      }

      const measure = performance.getEntriesByName(measureName)[0] as PerformanceMeasure;
      const duration = measure?.duration || 0;

      this.measures.set(name, duration);
      return duration;
    } catch (error) {
      console.warn('Performance measurement failed:', error);
      return null;
    }
  }

  /**
   * 計測結果をクリア
   */
  clear() {
    if (typeof performance === 'undefined') return;

    this.marks.clear();
    this.measures.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }

  /**
   * 全計測結果を取得
   */
  getAll(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }
}

/**
 * コンポーネントレンダリング時間を計測
 */
export function measureRenderTime(componentName: string) {
  const tracker = new PerformanceTracker();

  return {
    start: () => tracker.mark(`${componentName}-render-start`),
    end: () => {
      tracker.mark(`${componentName}-render-end`);
      const duration = tracker.measure(
        componentName,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );

      if (duration !== null) {
        console.log(`[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms`);
      }

      return duration;
    },
  };
}

/**
 * API呼び出し時間を計測
 */
export async function measureApiCall<T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<{ data: T; duration: number }> {
  const tracker = new PerformanceTracker();

  tracker.mark(`${name}-start`);

  try {
    const data = await apiCall();
    tracker.mark(`${name}-end`);

    const duration = tracker.measure(name, `${name}-start`, `${name}-end`) || 0;

    console.log(`[API Performance] ${name} completed in ${duration.toFixed(2)}ms`);

    return { data, duration };
  } catch (error) {
    tracker.mark(`${name}-error`);
    tracker.measure(name, `${name}-start`, `${name}-error`);
    throw error;
  }
}

/**
 * バンドルサイズをモニタリング
 */
export function logBundleSize() {
  if (typeof window === 'undefined') return;

  // PerformanceResourceTimingを使用してリソースサイズを取得
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  const bundleResources = resources.filter(
    (resource) =>
      resource.name.includes('/_next/static/') ||
      resource.name.includes('.js') ||
      resource.name.includes('.css')
  );

  const totalSize = bundleResources.reduce((acc, resource) => {
    return acc + (resource.transferSize || 0);
  }, 0);

  const totalSizeKB = (totalSize / 1024).toFixed(2);

  console.log(`[Bundle Size] Total: ${totalSizeKB} KB`);
  console.log(`[Bundle Size] Resources: ${bundleResources.length} files`);

  return {
    totalSize,
    totalSizeKB,
    resourceCount: bundleResources.length,
    resources: bundleResources.map((r) => ({
      name: r.name.split('/').pop(),
      size: (r.transferSize / 1024).toFixed(2) + ' KB',
    })),
  };
}

/**
 * メモリ使用量をモニタリング
 */
export function logMemoryUsage() {
  if (typeof window === 'undefined') return;

  // @ts-ignore - performance.memoryはChrome/Edge専用
  const memory = performance.memory;

  if (memory) {
    console.log('[Memory Usage]', {
      usedJSHeapSize: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      totalJSHeapSize: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
    });

    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    };
  }

  return null;
}

/**
 * パフォーマンスレポートを生成
 */
export function generatePerformanceReport() {
  console.group('📊 Performance Report');
  logBundleSize();
  logMemoryUsage();
  console.groupEnd();
}
