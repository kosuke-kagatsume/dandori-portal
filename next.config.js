const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  // Vercelデプロイメント時の静的生成問題を回避
  output: 'standalone',
  trailingSlash: false,
};

module.exports = withNextIntl(nextConfig);