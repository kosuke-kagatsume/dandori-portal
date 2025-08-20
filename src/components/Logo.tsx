'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function Logo() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    // エラー時のフォールバック
    return (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-blue-500 text-white grid place-items-center font-bold shadow-sm">
          D
        </div>
        <span className="text-lg font-semibold text-foreground">
          Dandori Portal
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <Image
        src="/dandori-logo.jpg"
        alt="Dandori Portal"
        width={32}
        height={32}
        priority
        className="rounded-md"
        onError={() => setHasError(true)}
      />
      <span className="text-lg font-semibold text-foreground">
        Dandori Portal
      </span>
    </div>
  );
}