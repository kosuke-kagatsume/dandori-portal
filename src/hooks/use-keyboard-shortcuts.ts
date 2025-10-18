'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = shortcuts.find(
        (s) =>
          s.key.toLowerCase() === event.key.toLowerCase() &&
          (s.ctrlKey === undefined || s.ctrlKey === event.ctrlKey) &&
          (s.shiftKey === undefined || s.shiftKey === event.shiftKey) &&
          (s.altKey === undefined || s.altKey === event.altKey) &&
          (s.metaKey === undefined || s.metaKey === (event.metaKey || event.ctrlKey))
      );

      if (shortcut) {
        event.preventDefault();
        shortcut.handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * グローバルキーボードショートカット
 */
export function useGlobalKeyboardShortcuts() {
  const router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      metaKey: true, // Cmd/Ctrl + K
      handler: () => {
        // 検索モーダルを開く（実装されている場合）
        const searchButton = document.querySelector('[data-search-trigger]') as HTMLElement;
        searchButton?.click();
      },
      description: '検索を開く',
    },
    {
      key: 'd',
      metaKey: true, // Cmd/Ctrl + D
      handler: () => {
        router.push('/ja/dashboard');
      },
      description: 'ダッシュボードに移動',
    },
    {
      key: 'h',
      metaKey: true, // Cmd/Ctrl + H
      handler: () => {
        router.push('/ja');
      },
      description: 'ホームに移動',
    },
    {
      key: '/',
      handler: () => {
        // フォーカスを検索フィールドに移動
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="検索"]') as HTMLElement;
        searchInput?.focus();
      },
      description: '検索にフォーカス',
    },
    {
      key: 'Escape',
      handler: () => {
        // 開いているモーダルやダイアログを閉じる
        const closeButton = document.querySelector('[data-state="open"] button[aria-label*="閉じる"], [data-state="open"] button[aria-label*="Close"]') as HTMLElement;
        closeButton?.click();
      },
      description: 'モーダルを閉じる',
    },
  ];

  useKeyboardShortcuts(shortcuts);
}
