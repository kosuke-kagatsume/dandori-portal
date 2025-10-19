/**
 * スクリーンリーダー対応ユーティリティ
 *
 * スクリーンリーダーユーザーへの情報提供を最適化
 */

'use client';

/**
 * スクリーンリーダー専用のライブアナウンス
 *
 * 動的に変更されたコンテンツをスクリーンリーダーに通知
 */
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer;
  private liveRegion: HTMLDivElement | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.createLiveRegion();
    }
  }

  static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
    }
    return ScreenReaderAnnouncer.instance;
  }

  private createLiveRegion() {
    // 既存のライブリージョンを検索
    this.liveRegion = document.getElementById('sr-live-region') as HTMLDivElement;

    if (!this.liveRegion) {
      // 新規作成
      this.liveRegion = document.createElement('div');
      this.liveRegion.id = 'sr-live-region';
      this.liveRegion.setAttribute('aria-live', 'polite');
      this.liveRegion.setAttribute('aria-atomic', 'true');
      this.liveRegion.setAttribute('role', 'status');
      this.liveRegion.className = 'sr-only'; // スクリーンリーダー専用（視覚的に非表示）
      document.body.appendChild(this.liveRegion);
    }
  }

  /**
   * スクリーンリーダーにメッセージをアナウンス
   *
   * @param message - アナウンスするメッセージ
   * @param priority - 'polite'（丁寧）または'assertive'（緊急）
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.liveRegion) {
      this.createLiveRegion();
    }

    if (this.liveRegion) {
      // aria-liveの優先度を設定
      this.liveRegion.setAttribute('aria-live', priority);

      // 一度クリアしてから設定（確実に読み上げるため）
      this.liveRegion.textContent = '';

      // 非同期で設定（DOMの更新を確実にトリガー）
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = message;
        }
      }, 100);

      // 5秒後にクリア
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = '';
        }
      }, 5000);
    }
  }

  /**
   * 緊急のアナウンス（即座に読み上げ）
   */
  announceUrgent(message: string) {
    this.announce(message, 'assertive');
  }

  /**
   * 丁寧なアナウンス（現在の読み上げが終わってから）
   */
  announcePolite(message: string) {
    this.announce(message, 'polite');
  }
}

/**
 * フォーカス管理ユーティリティ
 */
export class FocusManager {
  /**
   * 指定された要素にフォーカスを移動
   */
  static moveFocusTo(elementId: string) {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      return true;
    }
    return false;
  }

  /**
   * モーダルを開いた時のフォーカストラップ
   */
  static trapFocus(containerElement: HTMLElement) {
    const focusableElements = containerElement.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    containerElement.addEventListener('keydown', handleTabKey);

    // 初期フォーカス
    firstElement?.focus();

    // クリーンアップ関数を返す
    return () => {
      containerElement.removeEventListener('keydown', handleTabKey);
    };
  }

  /**
   * 前回フォーカスしていた要素を保存・復元
   */
  private static previousElement: HTMLElement | null = null;

  static saveFocus() {
    this.previousElement = document.activeElement as HTMLElement;
  }

  static restoreFocus() {
    if (this.previousElement) {
      this.previousElement.focus();
      this.previousElement = null;
    }
  }
}

/**
 * キーボードナビゲーションヘルパー
 */
export class KeyboardNavigation {
  /**
   * 矢印キーでのリストナビゲーション
   */
  static handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onSelect?: (index: number) => void
  ): number {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        newIndex = Math.min(currentIndex + 1, items.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (onSelect) {
          onSelect(currentIndex);
        }
        return currentIndex;
      default:
        return currentIndex;
    }

    items[newIndex]?.focus();
    return newIndex;
  }

  /**
   * タブキーのナビゲーション順序を管理
   */
  static setTabOrder(elements: HTMLElement[], startIndex = 0) {
    elements.forEach((element, index) => {
      element.setAttribute('tabindex', (startIndex + index).toString());
    });
  }
}

/**
 * スクリーンリーダー専用テキストを追加
 */
export function addScreenReaderText(text: string): string {
  return `<span class="sr-only">${text}</span>`;
}

/**
 * 便利な使用例用のフック
 */
export function useScreenReaderAnnouncer() {
  const announcer = ScreenReaderAnnouncer.getInstance();

  return {
    announce: (message: string, priority?: 'polite' | 'assertive') =>
      announcer.announce(message, priority),
    announcePolite: (message: string) => announcer.announcePolite(message),
    announceUrgent: (message: string) => announcer.announceUrgent(message),
  };
}

/**
 * スクリーンリーダー対応のページタイトル更新
 */
export function updatePageTitle(title: string, announceToSR = true) {
  document.title = title;

  if (announceToSR) {
    const announcer = ScreenReaderAnnouncer.getInstance();
    announcer.announcePolite(`ページが変更されました: ${title}`);
  }
}

/**
 * ローディング状態のアナウンス
 */
export function announceLoading(isLoading: boolean, loadingText = '読み込み中...', completeText = '読み込み完了') {
  const announcer = ScreenReaderAnnouncer.getInstance();

  if (isLoading) {
    announcer.announcePolite(loadingText);
  } else {
    announcer.announcePolite(completeText);
  }
}

/**
 * フォーム送信結果のアナウンス
 */
export function announceFormResult(
  success: boolean,
  successMessage = 'フォームが正常に送信されました',
  errorMessage = 'フォームの送信に失敗しました'
) {
  const announcer = ScreenReaderAnnouncer.getInstance();

  if (success) {
    announcer.announcePolite(successMessage);
  } else {
    announcer.announceUrgent(errorMessage);
  }
}
