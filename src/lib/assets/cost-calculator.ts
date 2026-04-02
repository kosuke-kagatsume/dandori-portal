/**
 * 資産管理 — 車両別費用集計ロジック
 */

import { type VehicleFromAPI } from '@/hooks/use-vehicles-api';

export type VehicleCostItem = {
  vehicleId: string;
  leaseCost: number;
  maintenanceCost: number;
};

type MaintenanceRecord = {
  vehicleId: string;
  date: string;
  cost: number;
};

export function calculateVehicleCosts(
  vehicles: VehicleFromAPI[],
  maintenanceRecords: MaintenanceRecord[],
  startMonth: string,
  endMonth: string,
): VehicleCostItem[] {
  const start = new Date(startMonth + '-01');
  const end = new Date(endMonth + '-01');
  end.setMonth(end.getMonth() + 1);

  return vehicles
    .map((vehicle) => {
      let leaseCost = 0;
      let maintenanceCost = 0;

      // リース費用の計算
      if (vehicle.ownershipType === 'leased' && vehicle.leaseMonthlyCost && vehicle.leaseStartDate && vehicle.leaseEndDate) {
        const contractStart = new Date(vehicle.leaseStartDate);
        const contractEnd = new Date(vehicle.leaseEndDate);

        let monthCount = 0;
        for (let d = new Date(start); d < end; d.setMonth(d.getMonth() + 1)) {
          if (d >= contractStart && d <= contractEnd) {
            monthCount++;
          }
        }
        leaseCost = vehicle.leaseMonthlyCost * monthCount;
      }

      // メンテナンス費用の計算
      maintenanceCost = maintenanceRecords
        .filter((record) => {
          if (record.vehicleId !== vehicle.id) return false;
          const recordDate = new Date(record.date);
          return recordDate >= start && recordDate < end;
        })
        .reduce((sum, record) => sum + record.cost, 0);

      return { vehicleId: vehicle.id, leaseCost, maintenanceCost };
    })
    .filter((item) => item.leaseCost > 0 || item.maintenanceCost > 0);
}
