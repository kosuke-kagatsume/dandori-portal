/**
 * 認証ページ用レイアウト
 * サイドバーやヘッダーなしのシンプルなレイアウト
 * AppShellをバイパスして直接childrenをレンダリング
 */

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from '@/components/ui/sonner';

export default async function AuthLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div className="min-h-screen bg-background">
        {children}
        <Toaster position="top-right" />
      </div>
    </NextIntlClientProvider>
  );
}
