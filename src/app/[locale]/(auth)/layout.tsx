'use client';

/**
 * 認証ページ用レイアウト
 * サイドバーやヘッダーなしのシンプルなレイアウト
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      {children}
    </div>
  );
}
