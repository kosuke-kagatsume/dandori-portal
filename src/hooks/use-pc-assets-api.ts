'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PCAssetFromAPI {
  id: string;
  tenantId: string;
  assetNumber: string;
  manufacturer: string;
  model: string;
  serialNumber: string | null;
  cpu: string | null;
  memory: string | null;
  storage: string | null;
  os: string | null;
  ownershipType: string;
  status: string;
  assignedUserId: string | null;
  assignedUserName: string | null;
  assignedDate: string | null;
  purchaseCost: number | null;
  purchaseDate: string | null;
  warrantyExpiration: string | null;
  // リース関連フィールド
  leaseMonthlyCost: number | null;
  leaseStartDate: string | null;
  leaseEndDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function usePCAssetsAPI() {
  const [pcs, setPCs] = useState<PCAssetFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPCs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/assets/pc-assets');
      const data = await response.json();

      if (data.success) {
        setPCs(data.data);
      } else {
        setError(data.error || 'Failed to fetch PC assets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPC = useCallback(async (pc: Partial<PCAssetFromAPI>) => {
    try {
      const response = await fetch('/api/assets/pc-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pc),
      });
      const data = await response.json();

      if (data.success) {
        await fetchPCs();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchPCs]);

  const updatePC = useCallback(async (id: string, pc: Partial<PCAssetFromAPI>) => {
    try {
      const response = await fetch(`/api/assets/pc-assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pc),
      });
      const data = await response.json();

      if (data.success) {
        await fetchPCs();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchPCs]);

  const deletePC = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/assets/pc-assets/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        await fetchPCs();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchPCs]);

  useEffect(() => {
    fetchPCs();
  }, [fetchPCs]);

  return {
    pcs,
    loading,
    error,
    fetchPCs,
    createPC,
    updatePC,
    deletePC,
  };
}
