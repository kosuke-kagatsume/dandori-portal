'use client';

import Image from 'next/image';
import { useState } from 'react';

interface LogoCompactProps {
  compact?: boolean;
}

export default function LogoCompact({ compact = false }: LogoCompactProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    // エラー時のフォールバック
    return (
      <div className={compact ? "" : "flex items-center space-x-3"}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-blue-500 text-white grid place-items-center font-bold shadow-sm">
          D
        </div>
        {!compact && (
          <span className="text-lg font-semibold text-foreground">
            Dandori Portal
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={compact ? "" : "flex items-center space-x-3"}>
      <Image
        src="/dandori-logo.jpg"
        alt="Dandori Portal"
        width={32}
        height={32}
        priority
        className="rounded-md"
        onError={() => setHasError(true)}
      />
      {!compact && (
        <span className="text-lg font-semibold text-foreground">
          Dandori Portal
        </span>
      )}
    </div>
  );
}