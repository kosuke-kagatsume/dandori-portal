import { AppShell } from '@/components/layout/app-shell';

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}