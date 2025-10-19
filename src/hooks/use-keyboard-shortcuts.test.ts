/**
 * useKeyboardShortcuts フックのテスト
 */

import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts, KeyboardShortcut } from './use-keyboard-shortcuts'

describe('useKeyboardShortcuts', () => {
  let addEventListenerSpy: jest.SpyInstance
  let removeEventListenerSpy: jest.SpyInstance

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(window, 'addEventListener')
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })

  it('ショートカットを登録する', () => {
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 's',
        ctrl: true,
        description: '保存',
        action: jest.fn(),
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('アンマウント時にイベントリスナーを削除する', () => {
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 's',
        ctrl: true,
        description: '保存',
        action: jest.fn(),
      },
    ]

    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('Ctrl+キーのショートカットが動作する', () => {
    const action = jest.fn()
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 's',
        ctrl: true,
        description: '保存',
        action,
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    // Ctrl+S を押す
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
    })
    window.dispatchEvent(event)

    expect(action).toHaveBeenCalledTimes(1)
  })

  it('Meta+キー（Macの Command）も Ctrl として扱う', () => {
    const action = jest.fn()
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 's',
        ctrl: true,
        description: '保存',
        action,
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    // Meta(Command)+S を押す
    const event = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true,
    })
    window.dispatchEvent(event)

    expect(action).toHaveBeenCalledTimes(1)
  })

  it('Alt+キーのショートカットが動作する', () => {
    const action = jest.fn()
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 'a',
        alt: true,
        description: 'アクション',
        action,
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    // Alt+A を押す
    const event = new KeyboardEvent('keydown', {
      key: 'a',
      altKey: true,
    })
    window.dispatchEvent(event)

    expect(action).toHaveBeenCalledTimes(1)
  })

  it('Shift+キーのショートカットが動作する', () => {
    const action = jest.fn()
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 'T',
        shift: true,
        description: 'アクション',
        action,
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    // Shift+T を押す
    const event = new KeyboardEvent('keydown', {
      key: 'T',
      shiftKey: true,
    })
    window.dispatchEvent(event)

    expect(action).toHaveBeenCalledTimes(1)
  })

  it('複合キー（Ctrl+Shift+キー）が動作する', () => {
    const action = jest.fn()
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 'S',
        ctrl: true,
        shift: true,
        description: '名前を付けて保存',
        action,
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    // Ctrl+Shift+S を押す
    const event = new KeyboardEvent('keydown', {
      key: 'S',
      ctrlKey: true,
      shiftKey: true,
    })
    window.dispatchEvent(event)

    expect(action).toHaveBeenCalledTimes(1)
  })

  it('マッチしないキーでは action が呼ばれない', () => {
    const action = jest.fn()
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 's',
        ctrl: true,
        description: '保存',
        action,
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    // Ctrl+A を押す（登録されていない）
    const event = new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
    })
    window.dispatchEvent(event)

    expect(action).not.toHaveBeenCalled()
  })

  it('修飾キーが不一致の場合は action が呼ばれない', () => {
    const action = jest.fn()
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 's',
        ctrl: true,
        description: '保存',
        action,
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    // S を押す（Ctrl なし）
    const event = new KeyboardEvent('keydown', {
      key: 's',
    })
    window.dispatchEvent(event)

    expect(action).not.toHaveBeenCalled()
  })

  it('大文字小文字を区別しない', () => {
    const action = jest.fn()
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 's',
        ctrl: true,
        description: '保存',
        action,
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    // Ctrl+S（大文字）を押す
    const event = new KeyboardEvent('keydown', {
      key: 'S',
      ctrlKey: true,
    })
    window.dispatchEvent(event)

    expect(action).toHaveBeenCalledTimes(1)
  })

  it('複数のショートカットを同時に登録できる', () => {
    const action1 = jest.fn()
    const action2 = jest.fn()
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 's',
        ctrl: true,
        description: '保存',
        action: action1,
      },
      {
        key: 'o',
        ctrl: true,
        description: '開く',
        action: action2,
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    // Ctrl+S を押す
    const event1 = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
    })
    window.dispatchEvent(event1)

    expect(action1).toHaveBeenCalledTimes(1)
    expect(action2).not.toHaveBeenCalled()

    // Ctrl+O を押す
    const event2 = new KeyboardEvent('keydown', {
      key: 'o',
      ctrlKey: true,
    })
    window.dispatchEvent(event2)

    expect(action1).toHaveBeenCalledTimes(1)
    expect(action2).toHaveBeenCalledTimes(1)
  })
})
