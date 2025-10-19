// next-intl設定
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Bundle Analyzer設定
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 環境変数を明示的にランタイムに公開（Vercelでのアクセス確保）
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },

  // React Strict Mode でパフォーマンス問題を検出
  reactStrictMode: true,
  
  // SWC による高速ビルドとミニファイ
  swcMinify: true,
  
  // gzip/brotli 圧縮を有効化
  compress: true,
  
  // 不要なヘッダーを削除
  poweredByHeader: false,
  
  // 画像最適化設定（Vercelで有効化）
  images: {
    domains: [
      'localhost',
      'dandori-portal.vercel.app',
      'kwnybcmrwknjlhxhhbso.supabase.co',
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  
  experimental: {
    typedRoutes: true,
    // パッケージの最適化
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-toast',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-separator',
      // @tanstack/react-table は既に最適化済みのため除外
      'zustand',
      'recharts',
      'react-day-picker',
    ],
    // メモリ使用量の最適化
    webpackBuildWorker: true,
  },
  
  // Vercel対応のための設定（本番では削除予定）
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Webpack設定のカスタマイズ
  webpack: (config, { isServer }) => {
    // プロダクションビルドでの最適化
    if (!isServer) {
      // クライアント側のコード分割最適化
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // 共通のvendorライブラリを分割
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            // React関連を別チャンクに
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              priority: 20,
              reuseExistingChunk: true,
            },
            // UI系ライブラリを分割
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              name: 'ui',
              priority: 15,
              reuseExistingChunk: true,
            },
            // チャートライブラリを分割
            charts: {
              test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
              name: 'charts',
              priority: 15,
              reuseExistingChunk: true,
            },
            // 共通コンポーネント
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Tree Shakingはデフォルトで有効なので追加設定不要
    return config;
  },
  
  // セキュリティとキャッシュヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // 静的ファイルの長期キャッシュ
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

// next-intl有効化
module.exports = withNextIntl(withBundleAnalyzer(nextConfig));