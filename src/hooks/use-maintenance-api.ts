'use client';

import { useState, useEffect, useCallback } from 'react';

// 型定義
export interface MaintenanceRecordFromAPI {
  id: string;
  tenantId: string;
  vehicleId: string;
  type: string; // oil_change, tire_change, inspection, shaken, repair, other
  date: string;
  mileage: number | null;
  cost: number;
  vendorId: string | null;
  description: string | null;
  nextDueDate: string | null;
  nextDueMileage: number | null;
  tireType: string | null;
  performedBy: string | null;
  performedByName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: {
    id: string;
    vehicleNumber: string;
    licensePlate: string;
    make?: string;
    model?: string;
  };
  vendor?: {
    id: string;
    name: string;
    phone?: string;
    contactPerson?: string;
  };
}

export interface MonthlyMileageFromAPI {
  id: string;
  tenantId: string;
  vehicleId: string;
  month: string; // YYYY-MM
  distance: number;
  recordedBy: string | null;
  recordedByName: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: {
    id: string;
    vehicleNumber: string;
    licensePlate: string;
    make?: string;
    model?: string;
  };
}

export interface SoftwareLicenseFromAPI {
  id: string;
  tenantId: string;
  pcAssetId: string;
  softwareName: string;
  licenseKey: string | null;
  expirationDate: string | null;
  monthlyCost: number | null;
  createdAt: string;
  updatedAt: string;
  pcAsset?: {
    id: string;
    assetNumber: string;
    manufacturer: string;
    model: string;
    assignedUserName?: string;
  };
}

// メンテナンス記録フック
export function useMaintenanceAPI(vehicleId?: string) {
  const [records, setRecords] = useState<MaintenanceRecordFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (vehicleId) params.set('vehicleId', vehicleId);

      const response = await fetch(`/api/assets/maintenance-records?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRecords(data.data);
      } else {
        setError(data.error || 'Failed to fetch maintenance records');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  const createRecord = useCallback(async (record: Partial<MaintenanceRecordFromAPI>) => {
    try {
      const response = await fetch('/api/assets/maintenance-records', {
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

  const updateRecord = useCallback(async (id: string, record: Partial<MaintenanceRecordFromAPI>) => {
    try {
      const response = await fetch(`/api/assets/maintenance-records/${id}`, {
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
      const response = await fetch(`/api/assets/maintenance-records/${id}`, {
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

// 月間走行距離フック
export function useMonthlyMileageAPI(vehicleId?: string) {
  const [mileages, setMileages] = useState<MonthlyMileageFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMileages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (vehicleId) params.set('vehicleId', vehicleId);

      const response = await fetch(`/api/assets/monthly-mileages?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setMileages(data.data);
      } else {
        setError(data.error || 'Failed to fetch monthly mileages');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  const createMileage = useCallback(async (mileage: Partial<MonthlyMileageFromAPI>) => {
    try {
      const response = await fetch('/api/assets/monthly-mileages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mileage),
      });
      const data = await response.json();

      if (data.success) {
        await fetchMileages();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchMileages]);

  const updateMileage = useCallback(async (id: string, mileage: Partial<MonthlyMileageFromAPI>) => {
    try {
      const response = await fetch(`/api/assets/monthly-mileages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mileage),
      });
      const data = await response.json();

      if (data.success) {
        await fetchMileages();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchMileages]);

  const deleteMileage = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/assets/monthly-mileages/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        await fetchMileages();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchMileages]);

  useEffect(() => {
    fetchMileages();
  }, [fetchMileages]);

  return {
    mileages,
    loading,
    error,
    fetchMileages,
    createMileage,
    updateMileage,
    deleteMileage,
  };
}

// ソフトウェアライセンスフック
export function useSoftwareLicenseAPI(pcAssetId?: string) {
  const [licenses, setLicenses] = useState<SoftwareLicenseFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLicenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (pcAssetId) params.set('pcAssetId', pcAssetId);

      const response = await fetch(`/api/assets/software-licenses?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setLicenses(data.data);
      } else {
        setError(data.error || 'Failed to fetch software licenses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [pcAssetId]);

  const createLicense = useCallback(async (license: Partial<SoftwareLicenseFromAPI>) => {
    try {
      const response = await fetch('/api/assets/software-licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(license),
      });
      const data = await response.json();

      if (data.success) {
        await fetchLicenses();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchLicenses]);

  const updateLicense = useCallback(async (id: string, license: Partial<SoftwareLicenseFromAPI>) => {
    try {
      const response = await fetch(`/api/assets/software-licenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(license),
      });
      const data = await response.json();

      if (data.success) {
        await fetchLicenses();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchLicenses]);

  const deleteLicense = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/assets/software-licenses/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        await fetchLicenses();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchLicenses]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  return {
    licenses,
    loading,
    error,
    fetchLicenses,
    createLicense,
    updateLicense,
    deleteLicense,
  };
}
