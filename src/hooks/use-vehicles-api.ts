'use client';

import { useState, useEffect, useCallback } from 'react';

// 型定義
export interface VehicleFromAPI {
  id: string;
  tenantId: string;
  vehicleNumber: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string | null;
  vin: string | null;
  ownershipType: string;
  status: string;
  assignedUserId: string | null;
  assignedUserName: string | null;
  assignedDate: string | null;
  inspectionDate: string | null;
  maintenanceDate: string | null;
  insuranceDate: string | null;
  tireChangeDate: string | null;
  currentTireType: string | null;
  leaseMonthlyCost: number | null;
  leaseStartDate: string | null;
  leaseEndDate: string | null;
  purchaseCost: number | null;
  purchaseDate: string | null;
  warrantyExpiration: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  monthlyMileages: unknown[];
  maintenanceRecords: unknown[];
}

export interface VendorFromAPI {
  id: string;
  tenantId: string;
  name: string;
  category: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  rating: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useVehiclesAPI() {
  const [vehicles, setVehicles] = useState<VehicleFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/assets/vehicles');
      const data = await response.json();

      if (data.success) {
        setVehicles(data.data);
      } else {
        setError(data.error || 'Failed to fetch vehicles');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createVehicle = useCallback(async (vehicle: Partial<VehicleFromAPI>) => {
    try {
      const response = await fetch('/api/assets/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicle),
      });
      const data = await response.json();

      if (data.success) {
        await fetchVehicles();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchVehicles]);

  const updateVehicle = useCallback(async (id: string, vehicle: Partial<VehicleFromAPI>) => {
    try {
      const response = await fetch(`/api/assets/vehicles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicle),
      });
      const data = await response.json();

      if (data.success) {
        await fetchVehicles();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchVehicles]);

  const deleteVehicle = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/assets/vehicles/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        await fetchVehicles();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchVehicles]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    loading,
    error,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
  };
}

export function useVendorsAPI() {
  const [vendors, setVendors] = useState<VendorFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/assets/vendors');
      const data = await response.json();

      if (data.success) {
        setVendors(data.data);
      } else {
        setError(data.error || 'Failed to fetch vendors');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createVendor = useCallback(async (vendor: Partial<VendorFromAPI>) => {
    try {
      const response = await fetch('/api/assets/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendor),
      });
      const data = await response.json();

      if (data.success) {
        await fetchVendors();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchVendors]);

  const updateVendor = useCallback(async (id: string, vendor: Partial<VendorFromAPI>) => {
    try {
      const response = await fetch(`/api/assets/vendors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendor),
      });
      const data = await response.json();

      if (data.success) {
        await fetchVendors();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchVendors]);

  const deleteVendor = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/assets/vendors/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        await fetchVendors();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchVendors]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return {
    vendors,
    loading,
    error,
    fetchVendors,
    createVendor,
    updateVendor,
    deleteVendor,
  };
}
