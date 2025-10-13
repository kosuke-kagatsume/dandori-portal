"use client";
import { useEffect, useState } from "react";

/**
 * SSR/CSR の不一致を防ぐためのフック
 * マウント後のみ true を返す
 */
export const useIsMounted = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
};
