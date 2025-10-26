/**
 * スムーズスクロールユーティリティ
 */

export interface ScrollToOptions {
  /**
   * スクロール先の要素IDまたは要素
   */
  target: string | HTMLElement;

  /**
   * スクロールの動作
   * @default 'smooth'
   */
  behavior?: ScrollBehavior;

  /**
   * ヘッダーなどの高さを考慮したオフセット（px）
   * @default 0
   */
  offset?: number;

  /**
   * スクロール完了時のコールバック
   */
  onComplete?: () => void;
}

/**
 * 指定要素までスムーズにスクロール
 */
export function scrollToElement({
  target,
  behavior = 'smooth',
  offset = 0,
  onComplete,
}: ScrollToOptions) {
  const element =
    typeof target === 'string' ? document.getElementById(target) : target;

  if (!element) {
    console.warn(`Element not found: ${target}`);
    return;
  }

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior,
  });

  // スクロール完了検出（おおよそ）
  if (onComplete) {
    setTimeout(() => {
      onComplete();
    }, 500);
  }
}

/**
 * ページトップへスムーズにスクロール
 */
export function scrollToTop(behavior: ScrollBehavior = 'smooth') {
  window.scrollTo({
    top: 0,
    behavior,
  });
}

/**
 * 指定Y座標までスムーズにスクロール
 */
export function scrollToY(y: number, behavior: ScrollBehavior = 'smooth') {
  window.scrollTo({
    top: y,
    behavior,
  });
}

/**
 * スクロール位置を監視し、指定位置を超えたらコールバック実行
 */
export function onScrollPast(
  threshold: number,
  callback: (scrollY: number) => void
) {
  const handleScroll = () => {
    if (window.scrollY > threshold) {
      callback(window.scrollY);
    }
  };

  window.addEventListener('scroll', handleScroll);

  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}

/**
 * スクロール方向を監視
 */
export function useScrollDirection(callback: (direction: 'up' | 'down') => void) {
  let lastScrollY = window.scrollY;

  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    const direction = currentScrollY > lastScrollY ? 'down' : 'up';

    callback(direction);
    lastScrollY = currentScrollY;
  };

  window.addEventListener('scroll', handleScroll);

  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}
