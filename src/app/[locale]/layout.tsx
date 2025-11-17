import { Suspense } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import dynamic from 'next/dynamic';

// AppShell を SSR 無効化（Hydration Error 完全回避）
const AppShell = dynamic(
  () => import('@/components/layout/app-shell').then(mod => ({ default: mod.AppShell })),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-background" />,
  }
);

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