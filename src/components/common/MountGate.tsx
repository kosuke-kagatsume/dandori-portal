'use client';

import { useEffect, useState, ReactNode } from 'react';

interface MountGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * SSR/CSRの不一致を防ぐためのゲートコンポーネント
 * クライアントサイドでマウント後にのみ子要素を表示
 */
export function MountGate({ children, fallback = null }: MountGateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}