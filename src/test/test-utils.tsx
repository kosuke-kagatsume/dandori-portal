/**
 * テストユーティリティ
 *
 * React Testing Libraryのカスタムレンダラーとヘルパー関数
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

// デフォルトのメッセージ（テスト用）
const messages = {
  common: {
    save: '保存',
    cancel: 'キャンセル',
    delete: '削除',
    edit: '編集',
    add: '追加',
    search: '検索',
    filter: 'フィルター',
    loading: '読み込み中...',
    error: 'エラーが発生しました',
  },
}

// すべてのプロバイダーをラップするラッパー
interface AllTheProvidersProps {
  children: React.ReactNode
  locale?: string
}

function AllTheProviders({ children, locale = 'ja' }: AllTheProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

// カスタムレンダラー
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: string
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { locale, ...renderOptions } = options || {}

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders locale={locale}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  })
}

// すべてを再エクスポート
export * from '@testing-library/react'
export { customRender as render }
export { AllTheProviders }
