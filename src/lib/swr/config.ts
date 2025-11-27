'use client';

import { SWRConfiguration } from 'swr';

// 共通のfetcher関数
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }

  const json = await res.json();

  // APIレスポンスがsuccessフラグを持つ場合
  if (json.success !== undefined) {
    if (!json.success) {
      throw new Error(json.error || 'API request failed');
    }
    return json.data;
  }

  return json;
}

// SWRのグローバル設定
export const swrConfig: SWRConfiguration = {
  fetcher,
  // 60秒間は重複リクエストを防ぐ
  dedupingInterval: 60000,
  // フォーカス時に再検証しない（パフォーマンス向上）
  revalidateOnFocus: false,
  // 再接続時に再検証
  revalidateOnReconnect: true,
  // エラー時のリトライ設定
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  // キャッシュを永続化（SWRはメモリキャッシュ）
  provider: () => new Map(),
};

// キャッシュ時間の設定（秒）
export const CACHE_TIME = {
  // マスターデータ（頻繁に変更されない）
  MASTER_DATA: 3600, // 1時間
  // ユーザー情報
  USERS: 300, // 5分
  // 勤怠データ
  ATTENDANCE: 60, // 1分
  // ワークフロー
  WORKFLOWS: 30, // 30秒
  // 車両・資産
  ASSETS: 300, // 5分
  // SaaS
  SAAS: 300, // 5分
  // 法令更新
  LEGAL_UPDATES: 1800, // 30分
} as const;
