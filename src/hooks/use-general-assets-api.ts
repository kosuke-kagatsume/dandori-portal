'use client';

import { useState, useEffect, useCallback } from 'react';

// 型定義
export interface GeneralAssetFromAPI {
  id: string;
  tenantId: string;
  assetNumber: string;
  category: string; // monitor, printer, phone, tablet, network_device, other
  name: string;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  specifications: Record<string, unknown> | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  assignedDate: string | null;
  ownershipType: string;
  purchaseDate: string | null;
  purchaseCost: number | null;
  leaseCompany: string | null;
  leaseMonthlyCost: number | null;
  leaseStartDate: string | null;
  leaseEndDate: string | null;
  warrantyExpiration: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  repairRecords: RepairRecordFromAPI[];
}

export interface RepairRecordFromAPI {
  id: string;
  tenantId: string;
  pcAssetId: string | null;
  generalAssetId: string | null;
  repairType: string; // screen, battery, keyboard, storage, power_supply, network, other
  date: string;
  cost: number;
  vendorId: string | null;
  vendorName: string | null;
  symptom: string | null;
  description: string | null;
  status: string;
  completedDate: string | null;
  performedBy: string | null;
  performedByName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  pcAsset?: {
    id: string;
    assetNumber: string;
    manufacturer: string;
    model: string;
  } | null;
  generalAsset?: {
    id: string;
    assetNumber: string;
    category: string;
    name: string;
    manufacturer: string | null;
    model: string | null;
  } | null;
}

// カテゴリラベル
export const ASSET_CATEGORIES = [
  { value: 'monitor', label: 'モニター' },
  { value: 'printer', label: 'プリンター' },
  { value: 'phone', label: 'スマートフォン' },
  { value: 'tablet', label: 'タブレット' },
  { value: 'network_device', label: 'ネットワーク機器' },
  { value: 'other', label: 'その他' },
];

// 修理種別ラベル
export const REPAIR_TYPES = [
  { value: 'screen', label: '画面交換' },
  { value: 'battery', label: 'バッテリー交換' },
  { value: 'keyboard', label: 'キーボード交換' },
  { value: 'storage', label: 'ストレージ交換' },
  { value: 'power_supply', label: '電源関連' },
  { value: 'network', label: 'ネットワーク関連' },
  { value: 'other', label: 'その他' },
];

export function useGeneralAssetsAPI() {
  const [assets, setAssets] = useState<GeneralAssetFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/assets/general-assets');
      const data = await response.json();

      if (data.success) {
        setAssets(data.data);
      } else {
        setError(data.error || 'Failed to fetch general assets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAsset = useCallback(async (asset: Partial<GeneralAssetFromAPI>) => {
    try {
      const response = await fetch('/api/assets/general-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset),
      });
      const data = await response.json();

      if (data.success) {
        await fetchAssets();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchAssets]);

  const updateAsset = useCallback(async (id: string, asset: Partial<GeneralAssetFromAPI>) => {
    try {
      const response = await fetch(`/api/assets/general-assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset),
      });
      const data = await response.json();

      if (data.success) {
        await fetchAssets();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchAssets]);

  const deleteAsset = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/assets/general-assets/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        await fetchAssets();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchAssets]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return {
    assets,
    loading,
    error,
    fetchAssets,
    createAsset,
    updateAsset,
    deleteAsset,
  };
}

export function useRepairRecordsAPI() {
  const [records, setRecords] = useState<RepairRecordFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/assets/repair-records');
      const data = await response.json();

      if (data.success) {
        setRecords(data.data);
      } else {
        setError(data.error || 'Failed to fetch repair records');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createRecord = useCallback(async (record: Partial<RepairRecordFromAPI>) => {
    try {
      const response = await fetch('/api/assets/repair-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      const data = await response.json();

      if (data.success) {
        await fetchRecords();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchRecords]);

  const updateRecord = useCallback(async (id: string, record: Partial<RepairRecordFromAPI>) => {
    try {
      const response = await fetch(`/api/assets/repair-records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      const data = await response.json();

      if (data.success) {
        await fetchRecords();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchRecords]);

  const deleteRecord = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/assets/repair-records/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        await fetchRecords();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchRecords]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return {
    records,
    loading,
    error,
    fetchRecords,
    createRecord,
    updateRecord,
    deleteRecord,
  };
}
