'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function Logo() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
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
      <Image
        src="/dandori-logo.jpg"  // ← 先頭スラッシュ必須
        alt="Dandori Portal"
        width={32}
        height={32}
        priority
        className="rounded-md"
        onError={() => setHasError(true)}
      />
      <span className="text-lg font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 bg-clip-text text-transparent hidden sm:inline">
        ダンドリワーク
      </span>
    </div>
  );
}