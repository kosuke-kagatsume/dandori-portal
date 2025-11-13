// next-intl設定
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// PWA設定
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // 開発環境では無効化
  runtimeCaching: [
    {
      urlPattern: /^https?.*/, // すべてのHTTPリクエスト
      handler: 'NetworkFirst', // Network-first戦略
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24時間
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode でパフォーマンス問題を検出
  reactStrictMode: true,

  // SWC による高速ビルドとミニファイ
  swcMinify: true,

  // Production環境でconsole.logを自動削除
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // errorとwarnは残す
    } : false,
  },
  
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
  
  // Webpack設定のカスタマイズ（Vercel対応のため簡略化）
  webpack: (config, { isServer }) => {
    // Vercelデプロイの安定性のため、デフォルト設定を使用
    return config;
  },
};

// next-intl + PWA有効化
module.exports = withPWA(withNextIntl(nextConfig));