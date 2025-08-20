import { Suspense } from 'react';
import { AppShell } from '@/components/layout/app-shell';

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <Suspense fallback={<div>Loading...</div>}>
        {children}
      </Suspense>
    </AppShell>
  );
}