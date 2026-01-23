'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useUIStore } from '@/lib/store/ui-store';

// Zustand persist ストアの型定義
interface PersistStore {
  persist?: {
    rehydrate: () => Promise<void> | void;
  };
}

// ハイドレーション対象のストア一覧
// Phase 2以降で段階的に追加していく
const STORES_TO_HYDRATE: Array<{
  name: string;
  store: PersistStore;
}> = [
  // Phase 2: ui-store
  { name: 'ui-store', store: useUIStore as unknown as PersistStore },
];

interface HydrationContextType {
  isHydrated: boolean;
}

const HydrationContext = createContext<HydrationContextType>({
  isHydrated: false,
});

export function useHydration() {
  return useContext(HydrationContext);
}

interface HydrationProviderProps {
  children: ReactNode;
}

/**
 * ストアのハイドレーションを管理するProvider
 *
 * SSRとCSRの状態不一致によるReact Hydration Error (#425, #422) を防ぐため、
 * クライアントサイドでのマウント後にストアをrehydrateする
 *
 * 使用方法:
 * 1. 各ストアにskipHydration: trueを追加
 * 2. STORES_TO_HYDRATEにストアを登録
 * 3. レイアウトでこのProviderをラップ
 */
export function HydrationProvider({ children }: HydrationProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // クライアントサイドでマウント後にストアをrehydrate
    STORES_TO_HYDRATE.forEach(({ name, store }) => {
      try {
        // persist APIが存在する場合のみrehydrate
        if (store.persist?.rehydrate) {
          store.persist.rehydrate();
        }
      } catch (error) {
        console.warn(`[HydrationProvider] Failed to rehydrate ${name}:`, error);
      }
    });

    setIsHydrated(true);
  }, []);

  return (
    <HydrationContext.Provider value={{ isHydrated }}>
      {children}
    </HydrationContext.Provider>
  );
}
