'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ページ遷移時のローディングバー
 *
 * トップに表示される青いプログレスバー
 */
export function PageLoadingBar() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // パス変更時にローディング開始
    setIsLoading(true);
    setProgress(0);

    // プログレスバーのアニメーション
    const timer1 = setTimeout(() => setProgress(30), 100);
    const timer2 = setTimeout(() => setProgress(60), 300);
    const timer3 = setTimeout(() => setProgress(90), 600);

    // 完了
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setIsLoading(false), 200);
    }, 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(completeTimer);
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700"
          initial={{ width: '0%', opacity: 1 }}
          animate={{ width: `${progress}%`, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            width: { duration: 0.3, ease: 'easeOut' },
            opacity: { duration: 0.2 }
          }}
          style={{
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
          }}
        />
      )}
    </AnimatePresence>
  );
}
