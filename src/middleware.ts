import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // サポートする言語
  locales: ['ja', 'en'],

  // デフォルト言語
  defaultLocale: 'ja'
});

export const config = {
  // next-intlが処理するパスのマッチャー
  matcher: ['/', '/(ja|en)/:path*']
};
