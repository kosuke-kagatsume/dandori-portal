const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  // 静的生成を無効にしてSSRを使用
  // これによりnext-intlの動的レンダリングエラーを回避
};

module.exports = withNextIntl(nextConfig);