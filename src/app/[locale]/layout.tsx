import { Suspense } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AppShell } from '@/components/layout/app-shell';

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
      <AppShell>
        <Suspense fallback={<div>Loading...</div>}>
          {children}
        </Suspense>
      </AppShell>
    </NextIntlClientProvider>
  );
}