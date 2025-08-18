import { AppShell } from '@/components/layout/app-shell';

// 動的レンダリングを強制してビルド時のnext-intlエラーを回避
export const dynamic = 'force-dynamic';

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}