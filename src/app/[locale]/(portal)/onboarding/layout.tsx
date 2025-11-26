/**
 * Onboarding Layout
 *
 * 新入社員専用のシンプルレイアウト
 * - サイドバーなし
 * - ヘッダーのみ（ロゴ + ユーザー情報）
 * - フッター
 */

import { ReactNode } from 'react';
import Link from 'next/link';

interface OnboardingLayoutProps {
  children: ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">
              Dandori Portal
            </span>
          </Link>

          {/* User Info - Will be populated from store */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              入社手続きポータル
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2025 Dandori Portal. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:text-gray-900">
                ヘルプ
              </Link>
              <Link href="#" className="hover:text-gray-900">
                お問い合わせ
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
