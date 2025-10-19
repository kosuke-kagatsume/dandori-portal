/**
 * useLazyLoad フックのテスト
 */

import { renderHook } from '@testing-library/react'
import { useLazyLoad } from './use-lazy-load'

describe('useLazyLoad', () => {
  it('クライアント側でマウント後は true を返す', () => {
    const { result } = renderHook(() => useLazyLoad())

    // useEffect実行後は true (クライアント側と判定)
    expect(result.current).toBe(true)
  })

  it('複数回の再レンダリングでも true を維持する', () => {
    const { result, rerender } = renderHook(() => useLazyLoad())

    expect(result.current).toBe(true)

    // さらに再レンダリング
    rerender()
    expect(result.current).toBe(true)

    rerender()
    expect(result.current).toBe(true)
  })

  it('アンマウント後に再マウントしても true を返す', () => {
    const { result, unmount } = renderHook(() => useLazyLoad())

    expect(result.current).toBe(true)

    // アンマウント
    unmount()

    // 再度マウント
    const { result: result2 } = renderHook(() => useLazyLoad())
    expect(result2.current).toBe(true)
  })
})
