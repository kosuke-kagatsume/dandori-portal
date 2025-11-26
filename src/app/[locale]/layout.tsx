import { Suspense } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

/**
 * ロケールレイアウト
 * Route Groupsによって(auth)と(portal)でレイアウトを分離
 * - (auth): 認証ページ（サイドバーなし）
 * - (portal): ポータルページ（サイドバーあり）
 */
export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // 翻訳メッセージを取得
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        {children}
      </Suspense>
    </NextIntlClientProvider>
  );
}
