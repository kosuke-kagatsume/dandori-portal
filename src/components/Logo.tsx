'use client';

import { useState, useEffect } from "react";

export default function Logo() {
  const [imageError, setImageError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Vercelの環境変数を使用してURLを構築
  const getImageSrc = () => {
    if (typeof window !== 'undefined') {
      // Vercel環境
      if (process.env.NEXT_PUBLIC_VERCEL_URL) {
        return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/dandori-logo.jpg`;
      }
      // 本番環境
      if (window.location.hostname.includes('vercel.app')) {
        return `${window.location.origin}/dandori-logo.jpg`;
      }
    }
    // ローカルまたはデフォルト
    return '/dandori-logo.jpg';
  };

  if (!mounted) {
    // SSR中はフォールバックを表示
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-blue-500 text-white grid place-items-center font-bold shadow-sm">
          D
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 bg-clip-text text-transparent hidden sm:inline">
          ダンドリワーク
        </span>
      </div>
    );
  }

  if (imageError) {
    // エラー時のフォールバック
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-blue-500 text-white grid place-items-center font-bold shadow-sm">
          D
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 bg-clip-text text-transparent hidden sm:inline">
          ダンドリワーク
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* 通常のimg要素を使用 */}
      <img 
        src={getImageSrc()}
        alt="Dandori Portal" 
        width={32}
        height={32}
        onError={() => setImageError(true)}
        className="rounded-md"
        style={{ display: imageError ? 'none' : 'block' }}
      />
      <span className="text-lg font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 bg-clip-text text-transparent hidden sm:inline">
        ダンドリワーク
      </span>
    </div>
  );
}