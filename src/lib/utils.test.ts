/**
 * ユーティリティ関数のテスト
 */

import { cn } from './utils'

describe('cn', () => {
  it('単一のクラス名を返す', () => {
    expect(cn('class1')).toBe('class1')
  })

  it('複数のクラス名を結合する', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('条件付きクラス名を処理する', () => {
    expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
  })

  it('undefinedやnullを無視する', () => {
    expect(cn('class1', undefined, 'class2', null, 'class3')).toBe(
      'class1 class2 class3'
    )
  })

  it('オブジェクト形式のクラス名を処理する', () => {
    expect(
      cn({
        class1: true,
        class2: false,
        class3: true,
      })
    ).toBe('class1 class3')
  })

  it('配列形式のクラス名を処理する', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2')
  })

  it('Tailwindの競合クラスをマージする', () => {
    // twMergeの機能テスト: 後のクラスが優先される
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('複雑な組み合わせを処理する', () => {
    expect(
      cn(
        'base-class',
        {
          'conditional-class': true,
          'hidden': false,
        },
        ['array-class1', 'array-class2'],
        undefined,
        'final-class'
      )
    ).toBe('base-class conditional-class array-class1 array-class2 final-class')
  })

  it('空の入力で空文字列を返す', () => {
    expect(cn()).toBe('')
  })

  it('すべてfalseの条件で空文字列を返す', () => {
    expect(
      cn({
        class1: false,
        class2: false,
      })
    ).toBe('')
  })
})
