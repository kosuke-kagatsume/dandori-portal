/**
 * グローバルキーボードショートカット
 *
 * アプリケーション全体で使えるキーボードショートカットを提供
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find((shortcut) => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;

        return keyMatches && ctrlMatches && altMatches && shiftMatches;
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * デフォルトのグローバルショートカット
 */
export function useGlobalShortcuts() {
  const router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'h',
      ctrl: true,
      description: 'ダッシュボードへ',
      action: () => router.push('/ja/dashboard'),
    },
    {
      key: 'u',
      ctrl: true,
      description: 'ユーザー管理へ',
      action: () => router.push('/ja/users'),
    },
    {
      key: 'a',
      ctrl: true,
      description: '勤怠管理へ',
      action: () => router.push('/ja/attendance'),
    },
    {
      key: 'w',
      ctrl: true,
      description: 'ワークフローへ',
      action: () => router.push('/ja/workflow'),
    },
    {
      key: '/',
      ctrl: true,
      description: 'ショートカット一覧表示',
      action: () => {
        // ショートカット一覧を表示するモーダル
        alert(`
キーボードショートカット:
Ctrl+H: ダッシュボードへ
Ctrl+U: ユーザー管理へ
Ctrl+A: 勤怠管理へ
Ctrl+W: ワークフローへ
Ctrl+/: このヘルプを表示
        `);
      },
    },
  ];

  useKeyboardShortcuts(shortcuts);
}
