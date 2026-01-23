"use client";

import { openDB, IDBPDatabase } from 'idb';

// オフラインデータベーススキーマ
// Note: Using simplified schema that avoids complex DBSchema index types
interface DraftValue {
  id: string;
  type: 'workflow' | 'attendance' | 'leave' | 'expense';
  data: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  synced: boolean;
}

interface PendingActionValue {
  id: string;
  action: string;
  endpoint: string;
  data: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  maxRetries: number;
  synced: boolean;
}

interface OfflineDB {
  drafts: {
    key: string;
    value: DraftValue;
  };
  pendingActions: {
    key: string;
    value: PendingActionValue;
  };
}

// データベース名とバージョン
const DB_NAME = 'dandori-offline';
const DB_VERSION = 1;

// データベースインスタンス
let dbInstance: IDBPDatabase<OfflineDB> | null = null;

// データベースの初期化
export async function initOfflineDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // ドラフトストア
      if (!db.objectStoreNames.contains('drafts')) {
        const draftStore = db.createObjectStore('drafts', { keyPath: 'id' });
        draftStore.createIndex('type', 'type');
        draftStore.createIndex('synced', 'synced');
        draftStore.createIndex('updatedAt', 'updatedAt');
      }

      // 保留中のアクションストア
      if (!db.objectStoreNames.contains('pendingActions')) {
        const actionStore = db.createObjectStore('pendingActions', { keyPath: 'id' });
        actionStore.createIndex('synced', 'synced');
        actionStore.createIndex('createdAt', 'createdAt');
      }
    },
  });

  return dbInstance;
}

// ドラフトの保存
export async function saveDraft(
  id: string,
  type: 'workflow' | 'attendance' | 'leave' | 'expense',
  data: Record<string, unknown>
): Promise<void> {
  const db = await initOfflineDB();
  const now = Date.now();

  await db.put('drafts', {
    id,
    type,
    data,
    createdAt: now,
    updatedAt: now,
    synced: false,
  });
}

// ドラフトの取得
export async function getDraft(id: string): Promise<OfflineDB['drafts']['value'] | undefined> {
  const db = await initOfflineDB();
  return await db.get('drafts', id);
}

// タイプ別のドラフト一覧取得
export async function getDraftsByType(
  type: 'workflow' | 'attendance' | 'leave' | 'expense'
): Promise<OfflineDB['drafts']['value'][]> {
  const db = await initOfflineDB();
  const index = db.transaction('drafts').store.index('type');
  return await index.getAll(type);
}

// 未同期のドラフト一覧取得
export async function getUnsyncedDrafts(): Promise<OfflineDB['drafts']['value'][]> {
  const db = await initOfflineDB();
  const allDrafts = await db.getAll('drafts');
  return allDrafts.filter(draft => !draft.synced);
}

// ドラフトの削除
export async function deleteDraft(id: string): Promise<void> {
  const db = await initOfflineDB();
  await db.delete('drafts', id);
}

// ドラフトを同期済みにマーク
export async function markDraftAsSynced(id: string): Promise<void> {
  const db = await initOfflineDB();
  const draft = await db.get('drafts', id);
  if (draft) {
    draft.synced = true;
    draft.updatedAt = Date.now();
    await db.put('drafts', draft);
  }
}

// 保留中のアクションを保存
export async function savePendingAction(
  id: string,
  action: string,
  endpoint: string,
  data: Record<string, unknown>,
  maxRetries: number = 3
): Promise<void> {
  const db = await initOfflineDB();

  await db.put('pendingActions', {
    id,
    action,
    endpoint,
    data,
    createdAt: Date.now(),
    retryCount: 0,
    maxRetries,
    synced: false,
  });
}

// 保留中のアクション取得
export async function getPendingAction(id: string): Promise<OfflineDB['pendingActions']['value'] | undefined> {
  const db = await initOfflineDB();
  return await db.get('pendingActions', id);
}

// 未同期のアクション一覧取得
export async function getUnsyncedActions(): Promise<OfflineDB['pendingActions']['value'][]> {
  const db = await initOfflineDB();
  const allActions = await db.getAll('pendingActions');
  return allActions.filter(action => !action.synced);
}

// アクションのリトライカウント増加
export async function incrementActionRetry(id: string): Promise<boolean> {
  const db = await initOfflineDB();
  const action = await db.get('pendingActions', id);

  if (!action) {
    return false;
  }

  action.retryCount++;

  // 最大リトライ回数を超えた場合
  if (action.retryCount >= action.maxRetries) {
    await db.delete('pendingActions', id);
    return false;
  }

  await db.put('pendingActions', action);
  return true;
}

// アクションを同期済みにマーク
export async function markActionAsSynced(id: string): Promise<void> {
  const db = await initOfflineDB();
  const action = await db.get('pendingActions', id);
  if (action) {
    action.synced = true;
    await db.put('pendingActions', action);
  }
}

// アクションの削除
export async function deletePendingAction(id: string): Promise<void> {
  const db = await initOfflineDB();
  await db.delete('pendingActions', id);
}

// 全ドラフトの取得
export async function getAllDrafts(): Promise<OfflineDB['drafts']['value'][]> {
  const db = await initOfflineDB();
  return await db.getAll('drafts');
}

// 全保留中アクションの取得
export async function getAllPendingActions(): Promise<OfflineDB['pendingActions']['value'][]> {
  const db = await initOfflineDB();
  return await db.getAll('pendingActions');
}

// ストレージのクリア
export async function clearOfflineStorage(): Promise<void> {
  const db = await initOfflineDB();
  const tx = db.transaction(['drafts', 'pendingActions'], 'readwrite');
  await Promise.all([
    tx.objectStore('drafts').clear(),
    tx.objectStore('pendingActions').clear(),
  ]);
}

// ストレージ統計の取得
export async function getStorageStats(): Promise<{
  totalDrafts: number;
  unsyncedDrafts: number;
  totalActions: number;
  unsyncedActions: number;
}> {
  const db = await initOfflineDB();

  const [allDrafts, unsyncedDrafts, allActions, unsyncedActions] = await Promise.all([
    db.getAll('drafts'),
    getUnsyncedDrafts(),
    db.getAll('pendingActions'),
    getUnsyncedActions(),
  ]);

  return {
    totalDrafts: allDrafts.length,
    unsyncedDrafts: unsyncedDrafts.length,
    totalActions: allActions.length,
    unsyncedActions: unsyncedActions.length,
  };
}
