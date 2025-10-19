/**
 * スキップリンクコンポーネント
 *
 * キーボードユーザーがメインコンテンツに直接ジャンプできるようにする
 * アクセシビリティのベストプラクティス
 */

'use client';

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        absolute left-0 top-0 z-[9999]
        -translate-y-full
        bg-blue-600 px-4 py-2 text-white
        focus:translate-y-0
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-transform
      "
    >
      メインコンテンツへスキップ
    </a>
  );
}
