// 画像最適化ユーティリティ

interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

// Next.js Image用のカスタムローダー
export function imageLoader({ src, width, quality = 75 }: ImageLoaderProps): string {
  // Vercel/Cloudinaryなどの画像最適化サービスを使用する場合
  if (process.env.NEXT_PUBLIC_IMAGE_CDN === 'cloudinary') {
    const cloudinaryUrl = process.env.NEXT_PUBLIC_CLOUDINARY_URL;
    return `${cloudinaryUrl}/w_${width},q_${quality}/v1/${src}`;
  }
  
  // AWSのCloudFrontを使用する場合
  if (process.env.NEXT_PUBLIC_IMAGE_CDN === 'cloudfront') {
    const cloudfrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
    return `${cloudfrontUrl}/${src}?w=${width}&q=${quality}`;
  }
  
  // デフォルトはNext.jsの画像最適化
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

// 画像のプリロード設定
export const imagePreloadConfig = {
  // 優先度の高い画像（ヒーローイメージなど）
  high: {
    priority: true,
    loading: 'eager' as const,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  },
  // 中優先度の画像（カード内の画像など）
  medium: {
    priority: false,
    loading: 'lazy' as const,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  },
  // 低優先度の画像（フッターのロゴなど）
  low: {
    priority: false,
    loading: 'lazy' as const,
    sizes: '(max-width: 768px) 50vw, 200px',
  },
};

// 画像の遅延読み込みを管理
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private loadedImages = new Set<string>();

  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: '50px',
          threshold: 0.01,
        }
      );
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        
        if (src && !this.loadedImages.has(src)) {
          // 画像を読み込み
          this.loadImage(img, src);
          
          // 観察を停止
          this.observer?.unobserve(img);
          this.loadedImages.add(src);
        }
      }
    });
  }

  private loadImage(img: HTMLImageElement, src: string) {
    // プレースホルダーブラー画像を表示
    img.style.filter = 'blur(5px)';
    img.style.transition = 'filter 0.3s';
    
    // 実際の画像を読み込み
    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = src;
      img.style.filter = 'none';
      
      // srcsetがある場合は設定
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
      }
    };
    tempImg.src = src;
  }

  observe(img: HTMLImageElement) {
    if (this.observer && img.dataset.src) {
      this.observer.observe(img);
    }
  }

  disconnect() {
    this.observer?.disconnect();
  }
}

// グローバルインスタンス
let lazyImageLoader: LazyImageLoader | null = null;

export function getLazyImageLoader(): LazyImageLoader {
  if (!lazyImageLoader) {
    lazyImageLoader = new LazyImageLoader();
  }
  return lazyImageLoader;
}

// 画像フォーマットの最適化
export function getOptimizedImageFormat(userAgent?: string): string {
  if (!userAgent) {
    if (typeof window !== 'undefined') {
      userAgent = window.navigator.userAgent;
    } else {
      return 'webp'; // デフォルト
    }
  }

  // AVIF対応ブラウザ
  if (userAgent.includes('Chrome/') && parseInt(userAgent.split('Chrome/')[1]) >= 85) {
    return 'avif';
  }
  
  // WebP対応ブラウザ
  if (
    userAgent.includes('Chrome') ||
    userAgent.includes('Firefox') ||
    userAgent.includes('Edge') ||
    userAgent.includes('Opera')
  ) {
    return 'webp';
  }
  
  // Safari/その他
  return 'jpeg';
}

// レスポンシブ画像のサイズ計算
export function calculateResponsiveImageSizes(
  viewportWidth: number,
  containerWidthPercent: number = 100
): number[] {
  const containerWidth = (viewportWidth * containerWidthPercent) / 100;
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 2;
  
  // 必要な画像サイズを計算（デバイスピクセル比を考慮）
  const sizes = [
    Math.ceil(containerWidth * 0.5 * devicePixelRatio),  // 小
    Math.ceil(containerWidth * 1 * devicePixelRatio),    // 中
    Math.ceil(containerWidth * 1.5 * devicePixelRatio),  // 大
    Math.ceil(containerWidth * 2 * devicePixelRatio),    // 超大
  ];
  
  // 一般的なブレークポイントに合わせて調整
  const commonSizes = [320, 640, 768, 1024, 1280, 1536, 1920, 2560];
  
  return sizes.map(size => {
    // 最も近い一般的なサイズを返す
    return commonSizes.reduce((prev, curr) => 
      Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
    );
  });
}

// プログレッシブ画像読み込み
export class ProgressiveImageLoader {
  private cache = new Map<string, string>();

  async loadImage(
    src: string,
    placeholderSrc?: string,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    // キャッシュチェック
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('GET', src, true);
      xhr.responseType = 'blob';
      
      // プログレスイベント
      xhr.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      };
      
      // 完了時
      xhr.onload = () => {
        if (xhr.status === 200) {
          const blob = xhr.response;
          const objectUrl = URL.createObjectURL(blob);
          this.cache.set(src, objectUrl);
          resolve(objectUrl);
        } else {
          reject(new Error(`Failed to load image: ${src}`));
        }
      };
      
      // エラー時
      xhr.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      xhr.send();
    });
  }

  clearCache() {
    this.cache.forEach(url => URL.revokeObjectURL(url));
    this.cache.clear();
  }
}

// React用の画像最適化フック
import { useEffect, useState, useRef } from 'react';

export function useOptimizedImage(
  src: string,
  options?: {
    placeholder?: string;
    quality?: number;
    onLoad?: () => void;
  }
) {
  const [imageSrc, setImageSrc] = useState(options?.placeholder || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const loader = getLazyImageLoader();
    
    if (imgRef.current) {
      imgRef.current.dataset.src = src;
      loader.observe(imgRef.current);
    }

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setLoading(false);
      options?.onLoad?.();
    };
    img.onerror = () => {
      setError(new Error('Failed to load image'));
      setLoading(false);
    };
    img.src = src;

    return () => {
      if (imgRef.current) {
        loader.disconnect();
      }
    };
  }, [src]);

  return { imageSrc, loading, error, imgRef };
}