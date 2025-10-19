/**
 * useIsMounted フックのテスト
 */

import { renderHook } from '@testing-library/react'
import { useIsMounted } from './useIsMounted'

describe('useIsMounted', () => {
  it('マウント後は true を返す', () => {
    const { result } = renderHook(() => useIsMounted())

    // useEffect実行後は true
    expect(result.current).toBe(true)
  })

  it('アンマウント後も問題なく動作する', () => {
    const { result, unmount } = renderHook(() => useIsMounted())

    expect(result.current).toBe(true)

    // アンマウント
    unmount()

    // 再度マウント
    const { result: result2 } = renderHook(() => useIsMounted())
    expect(result2.current).toBe(true)
  })

  it('複数のインスタンスで独立して動作する', () => {
    const { result: result1 } = renderHook(() => useIsMounted())
    const { result: result2 } = renderHook(() => useIsMounted())

    expect(result1.current).toBe(true)
    expect(result2.current).toBe(true)
  })
})
