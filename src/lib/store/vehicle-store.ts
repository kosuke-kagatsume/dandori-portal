/**
 * 車両管理ストア
 */

import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { assetAudit } from '@/lib/audit/audit-logger';
import type {
  Vehicle,
  Vendor,
  MaintenanceRecord,
  DeadlineWarning,
  CostSummary,
  MonthlyMileage,
  // MaintenanceType, // 将来的に使用予定
  // TireType, // 将来的に使用予定
} from '@/types/asset';

const DATA_VERSION = 1;

interface VehicleState {
  // データ
  vehicles: Vehicle[];
  vendors: Vendor[];

  // 車両CRUD
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  getVehicle: (id: string) => Vehicle | undefined;

  // 月次走行距離管理
  addMonthlyMileage: (
    vehicleId: string,
    mileage: Omit<MonthlyMileage, 'id' | 'recordedAt'>
  ) => void;
  updateMonthlyMileage: (
    vehicleId: string,
    mileageId: string,
    updates: Partial<MonthlyMileage>
  ) => void;
  deleteMonthlyMileage: (vehicleId: string, mileageId: string) => void;

  // メンテナンス記録管理
  addMaintenanceRecord: (
    vehicleId: string,
    record: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  updateMaintenanceRecord: (
    vehicleId: string,
    recordId: string,
    updates: Partial<MaintenanceRecord>
  ) => void;
  deleteMaintenanceRecord: (vehicleId: string, recordId: string) => void;

  // 業者管理
  addVendor: (vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'workCount'>) => void;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;
  getVendor: (id: string) => Vendor | undefined;

  // 期限警告取得
  getDeadlineWarnings: () => DeadlineWarning[];

  // 費用集計
  getCostSummary: (startMonth: string, endMonth: string) => CostSummary[];

  // データリセット
  resetData: () => void;
}

// 初期サンプルデータ
const getInitialVendors = (): Vendor[] => {
  const now = new Date().toISOString();
  return [
    {
      id: 'vendor-1',
      name: 'オートサービス山田',
      phone: '03-1234-5678',
      address: '東京都港区1-2-3',
      contactPerson: '山田太郎',
      email: 'yamada@auto-service.jp',
      rating: 5,
      notes: '車検・点検でいつもお世話になっています',
      workCount: 15,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vendor-2',
      name: 'タイヤ館新宿店',
      phone: '03-9876-5432',
      address: '東京都新宿区4-5-6',
      contactPerson: '鈴木花子',
      email: 'suzuki@tire-kan.jp',
      rating: 4,
      notes: 'タイヤ交換専門',
      workCount: 8,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vendor-3',
      name: 'カーリペア佐藤',
      phone: '03-5555-6666',
      address: '東京都渋谷区7-8-9',
      contactPerson: '佐藤次郎',
      email: 'sato@car-repair.jp',
      rating: 4,
      notes: '修理対応が早い',
      workCount: 5,
      createdAt: now,
      updatedAt: now,
    },
  ];
};

const getInitialVehicles = (): Vehicle[] => {
  const now = new Date().toISOString();
  const today = new Date();

  // 日付計算ヘルパー
  const addMonths = (date: Date, months: number) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result.toISOString().split('T')[0];
  };

  return [
    {
      id: 'vehicle-1',
      vehicleNumber: 'V-001',
      licensePlate: '品川 500 あ 12-34',
      make: 'トヨタ',
      model: 'プリウス',
      year: 2021,
      color: 'シルバー',
      assignedTo: {
        userId: 'employee-1',
        userName: '山田太郎',
        assignedDate: '2023-04-01',
      },
      ownershipType: 'leased',
      leaseInfo: {
        company: 'トヨタファイナンス',
        monthlyCost: 45000,
        contractStart: '2023-04-01',
        contractEnd: '2028-03-31',
        contactPerson: '田中営業',
        phone: '0120-123-456',
      },
      inspectionDate: addMonths(today, 8), // 8ヶ月後
      maintenanceDate: addMonths(today, 2), // 2ヶ月後
      insuranceDate: addMonths(today, 5), // 5ヶ月後
      currentTireType: 'summer',
      status: 'active',
      mileageTracking: true,
      currentMileage: 45000,
      monthlyMileages: [
        {
          id: 'mileage-1-1',
          month: '2025-09',
          distance: 1200,
          recordedBy: 'employee-1',
          recordedByName: '山田太郎',
          recordedAt: '2025-09-30T10:00:00Z',
        },
        {
          id: 'mileage-1-2',
          month: '2025-08',
          distance: 1150,
          recordedBy: 'employee-1',
          recordedByName: '山田太郎',
          recordedAt: '2025-08-31T10:00:00Z',
        },
      ],
      maintenanceRecords: [
        {
          id: 'maint-1-1',
          vehicleId: 'vehicle-1',
          type: 'oil_change',
          date: '2025-08-15',
          cost: 8000,
          vendorId: 'vendor-1',
          vendorName: 'オートサービス山田',
          description: 'エンジンオイル交換',
          performedBy: 'employee-1',
          performedByName: '山田太郎',
          notes: '特に問題なし',
          createdAt: '2025-08-15T14:00:00Z',
          updatedAt: '2025-08-15T14:00:00Z',
        },
      ],
      notes: '営業部で使用中',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vehicle-2',
      vehicleNumber: 'V-002',
      licensePlate: '品川 300 さ 56-78',
      make: '日産',
      model: 'ノート',
      year: 2022,
      color: 'ホワイト',
      assignedTo: {
        userId: 'employee-2',
        userName: '佐藤花子',
        assignedDate: '2023-06-01',
      },
      ownershipType: 'owned',
      purchaseDate: '2022-03-15',
      purchaseCost: 2500000,
      inspectionDate: addMonths(today, 14), // 14ヶ月後
      maintenanceDate: addMonths(today, 3), // 3ヶ月後
      insuranceDate: addMonths(today, 2), // 2ヶ月後（警告対象）
      currentTireType: 'winter',
      status: 'active',
      mileageTracking: true,
      currentMileage: 28000,
      monthlyMileages: [
        {
          id: 'mileage-2-1',
          month: '2025-09',
          distance: 800,
          recordedBy: 'employee-2',
          recordedByName: '佐藤花子',
          recordedAt: '2025-09-30T09:00:00Z',
        },
      ],
      maintenanceRecords: [
        {
          id: 'maint-2-1',
          vehicleId: 'vehicle-2',
          type: 'tire_change',
          date: '2024-11-10',
          cost: 65000,
          vendorId: 'vendor-2',
          vendorName: 'タイヤ館新宿店',
          description: '冬タイヤに交換',
          tireType: 'winter',
          performedBy: 'employee-2',
          performedByName: '佐藤花子',
          notes: '前回は夏タイヤ',
          createdAt: '2024-11-10T15:00:00Z',
          updatedAt: '2024-11-10T15:00:00Z',
        },
        {
          id: 'maint-2-2',
          vehicleId: 'vehicle-2',
          type: 'inspection',
          date: '2025-06-20',
          cost: 15000,
          vendorId: 'vendor-1',
          vendorName: 'オートサービス山田',
          description: '6ヶ月点検',
          performedBy: 'employee-2',
          performedByName: '佐藤花子',
          createdAt: '2025-06-20T11:00:00Z',
          updatedAt: '2025-06-20T11:00:00Z',
        },
      ],
      notes: '総務部で使用中',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vehicle-3',
      vehicleNumber: 'V-003',
      licensePlate: '品川 100 と 90-12',
      make: 'ホンダ',
      model: 'フィット',
      year: 2020,
      color: 'ブルー',
      assignedTo: null,
      ownershipType: 'owned',
      purchaseDate: '2020-08-01',
      purchaseCost: 1800000,
      inspectionDate: addMonths(today, 6), // 6ヶ月後
      maintenanceDate: addMonths(today, 0.5), // 2週間後（警告対象）
      insuranceDate: addMonths(today, 9),
      currentTireType: 'summer',
      status: 'active',
      mileageTracking: false,
      monthlyMileages: [],
      maintenanceRecords: [
        {
          id: 'maint-3-1',
          vehicleId: 'vehicle-3',
          type: 'shaken',
          date: '2023-08-05',
          cost: 120000,
          vendorId: 'vendor-1',
          vendorName: 'オートサービス山田',
          description: '車検',
          performedBy: 'admin',
          performedByName: '管理者',
          createdAt: '2023-08-05T10:00:00Z',
          updatedAt: '2023-08-05T10:00:00Z',
        },
      ],
      notes: '予備車両・未割当',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vehicle-4',
      vehicleNumber: 'V-004',
      licensePlate: '品川 500 な 34-56',
      make: 'トヨタ',
      model: 'ハイエース',
      year: 2023,
      color: 'ホワイト',
      assignedTo: {
        userId: 'employee-3',
        userName: '田中一郎',
        assignedDate: '2023-09-01',
      },
      ownershipType: 'leased',
      leaseInfo: {
        company: 'オリックス自動車',
        monthlyCost: 58000,
        contractStart: '2023-09-01',
        contractEnd: '2028-08-31',
        contactPerson: '高橋担当',
        phone: '0120-999-888',
      },
      inspectionDate: addMonths(today, 20),
      maintenanceDate: addMonths(today, 4),
      insuranceDate: addMonths(today, 11),
      currentTireType: 'summer',
      status: 'active',
      mileageTracking: true,
      currentMileage: 18000,
      monthlyMileages: [
        {
          id: 'mileage-4-1',
          month: '2025-09',
          distance: 1500,
          recordedBy: 'employee-3',
          recordedByName: '田中一郎',
          recordedAt: '2025-09-30T08:00:00Z',
        },
      ],
      maintenanceRecords: [],
      notes: '配送用車両',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vehicle-5',
      vehicleNumber: 'V-005',
      licensePlate: '品川 500 ら 78-90',
      make: '日産',
      model: 'セレナ',
      year: 2019,
      color: 'ブラック',
      assignedTo: {
        userId: 'employee-4',
        userName: '鈴木次郎',
        assignedDate: '2022-05-01',
      },
      ownershipType: 'owned',
      purchaseDate: '2019-11-20',
      purchaseCost: 3200000,
      inspectionDate: addMonths(today, 0.3), // 約10日後（critical警告）
      maintenanceDate: addMonths(today, 1),
      insuranceDate: addMonths(today, 7),
      currentTireType: 'summer',
      status: 'active',
      mileageTracking: true,
      currentMileage: 68000,
      monthlyMileages: [
        {
          id: 'mileage-5-1',
          month: '2025-09',
          distance: 950,
          recordedBy: 'employee-4',
          recordedByName: '鈴木次郎',
          recordedAt: '2025-09-30T07:30:00Z',
        },
      ],
      maintenanceRecords: [
        {
          id: 'maint-5-1',
          vehicleId: 'vehicle-5',
          type: 'repair',
          date: '2025-07-12',
          cost: 45000,
          vendorId: 'vendor-3',
          vendorName: 'カーリペア佐藤',
          description: 'ブレーキパッド交換',
          performedBy: 'employee-4',
          performedByName: '鈴木次郎',
          notes: '走行中異音発生のため',
          createdAt: '2025-07-12T16:00:00Z',
          updatedAt: '2025-07-12T16:00:00Z',
        },
      ],
      notes: '社用車（多人数移動用）',
      createdAt: now,
      updatedAt: now,
    },
  ];
};

const initialState = {
  vehicles: [] as Vehicle[],
  vendors: [] as Vendor[],
};

// Counter to ensure unique IDs
let idCounter = 0;

const createVehicleStore = () => {
  const storeCreator: StateCreator<VehicleState> = (set, get) => ({
    ...initialState,

    // 車両CRUD
    addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const newVehicle: Vehicle = {
        ...vehicle,
        id: `vehicle-${Date.now()}-${idCounter++}`,
        createdAt: now,
        updatedAt: now,
      };
      set((state) => ({
        vehicles: [...state.vehicles, newVehicle],
      }));

      // 監査ログ記録
      const vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.vehicleNumber})`;
      assetAudit.create('車両', vehicleName);
    },

    updateVehicle: (id: string, updates: Partial<Vehicle>) => {
      // 割り当て変更の監査ログ用に現在の状態を取得
      const currentVehicle = get().vehicles.find((v: Vehicle) => v.id === id);

      set((state) => ({
        vehicles: state.vehicles.map((v) =>
          v.id === id
            ? { ...v, ...updates, updatedAt: new Date().toISOString() }
            : v
        ),
      }));

      // 割り当て変更があった場合は監査ログ記録
      if (currentVehicle && updates.assignedTo !== undefined) {
        const vehicleName = `${currentVehicle.make} ${currentVehicle.model} (${currentVehicle.vehicleNumber})`;
        if (updates.assignedTo && updates.assignedTo.userName) {
          assetAudit.assign('車両', vehicleName, updates.assignedTo.userName);
        }
      }
    },

    deleteVehicle: (id: string) => {
      // 削除前に情報を取得して監査ログ用に保存
      const vehicleToDelete = get().vehicles.find((v: Vehicle) => v.id === id);

      set((state) => ({
        vehicles: state.vehicles.filter((v) => v.id !== id),
      }));

      // 監査ログ記録
      if (vehicleToDelete) {
        const vehicleName = `${vehicleToDelete.make} ${vehicleToDelete.model} (${vehicleToDelete.vehicleNumber})`;
        assetAudit.dispose('車両', vehicleName, '資産管理から削除');
      }
    },

    getVehicle: (id: string) => {
      return get().vehicles.find((v: Vehicle) => v.id === id);
    },

    // 月次走行距離管理
    addMonthlyMileage: (
      vehicleId: string,
      mileage: Omit<MonthlyMileage, 'id' | 'recordedAt'>
    ) => {
      const now = new Date().toISOString();
      const newMileage: MonthlyMileage = {
        ...mileage,
        id: `mileage-${Date.now()}-${idCounter++}`,
        recordedAt: now,
      };

      set((state) => ({
        vehicles: state.vehicles.map((v) =>
          v.id === vehicleId
            ? {
                ...v,
                monthlyMileages: [...v.monthlyMileages, newMileage],
                updatedAt: now,
              }
            : v
        ),
      }));
    },

    updateMonthlyMileage: (
      vehicleId: string,
      mileageId: string,
      updates: Partial<MonthlyMileage>
    ) => {
      set((state) => ({
        vehicles: state.vehicles.map((v) =>
          v.id === vehicleId
            ? {
                ...v,
                monthlyMileages: v.monthlyMileages.map((m) =>
                  m.id === mileageId ? { ...m, ...updates } : m
                ),
                updatedAt: new Date().toISOString(),
              }
            : v
        ),
      }));
    },

    deleteMonthlyMileage: (vehicleId: string, mileageId: string) => {
      set((state) => ({
        vehicles: state.vehicles.map((v) =>
          v.id === vehicleId
            ? {
                ...v,
                monthlyMileages: v.monthlyMileages.filter((m) => m.id !== mileageId),
                updatedAt: new Date().toISOString(),
              }
            : v
        ),
      }));
    },

    // メンテナンス記録管理
    addMaintenanceRecord: (
      vehicleId: string,
      record: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>
    ) => {
      const now = new Date().toISOString();
      const newRecord: MaintenanceRecord = {
        ...record,
        id: `maint-${Date.now()}-${idCounter++}`,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => ({
        vehicles: state.vehicles.map((v) =>
          v.id === vehicleId
            ? {
                ...v,
                maintenanceRecords: [...v.maintenanceRecords, newRecord],
                updatedAt: now,
              }
            : v
        ),
      }));

      // 業者の作業実績件数を更新
      set((state) => ({
        vendors: state.vendors.map((vendor) =>
          vendor.id === record.vendorId
            ? {
                ...vendor,
                workCount: (vendor.workCount || 0) + 1,
                updatedAt: now,
              }
            : vendor
        ),
      }));
    },

    updateMaintenanceRecord: (
      vehicleId: string,
      recordId: string,
      updates: Partial<MaintenanceRecord>
    ) => {
      const now = new Date().toISOString();
      set((state) => ({
        vehicles: state.vehicles.map((v) =>
          v.id === vehicleId
            ? {
                ...v,
                maintenanceRecords: v.maintenanceRecords.map((r) =>
                  r.id === recordId ? { ...r, ...updates, updatedAt: now } : r
                ),
                updatedAt: now,
              }
            : v
        ),
      }));
    },

    deleteMaintenanceRecord: (vehicleId: string, recordId: string) => {
      set((state) => ({
        vehicles: state.vehicles.map((v) =>
          v.id === vehicleId
            ? {
                ...v,
                maintenanceRecords: v.maintenanceRecords.filter(
                  (r) => r.id !== recordId
                ),
                updatedAt: new Date().toISOString(),
              }
            : v
        ),
      }));
    },

    // 業者管理
    addVendor: (
      vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'workCount'>
    ) => {
      const now = new Date().toISOString();
      const newVendor: Vendor = {
        ...vendor,
        id: `vendor-${Date.now()}-${idCounter++}`,
        workCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      set((state) => ({
        vendors: [...state.vendors, newVendor],
      }));
    },

    updateVendor: (id: string, updates: Partial<Vendor>) => {
      set((state) => ({
        vendors: state.vendors.map((v) =>
          v.id === id
            ? { ...v, ...updates, updatedAt: new Date().toISOString() }
            : v
        ),
      }));
    },

    deleteVendor: (id: string) => {
      set((state) => ({
        vendors: state.vendors.filter((v) => v.id !== id),
      }));
    },

    getVendor: (id: string) => {
      return get().vendors.find((v: Vendor) => v.id === id);
    },

    // 期限警告取得
    getDeadlineWarnings: (): DeadlineWarning[] => {
      const vehicles: Vehicle[] = get().vehicles;
      const today = new Date();
      const warnings: DeadlineWarning[] = [];

      vehicles.forEach((vehicle) => {
        // 車検期限
        const inspectionDate = new Date(vehicle.inspectionDate);
        const inspectionDays = Math.ceil(
          (inspectionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (inspectionDays <= 60) {
          warnings.push({
            id: `warning-${vehicle.id}-inspection`,
            assetType: 'vehicle',
            assetId: vehicle.id,
            assetName: `${vehicle.make} ${vehicle.model} (${vehicle.vehicleNumber})`,
            deadlineType: 'inspection',
            deadlineDate: vehicle.inspectionDate,
            daysRemaining: inspectionDays,
            level: inspectionDays <= 30 ? 'critical' : 'warning',
          });
        }

        // 点検期限
        const maintenanceDate = new Date(vehicle.maintenanceDate);
        const maintenanceDays = Math.ceil(
          (maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (maintenanceDays <= 60) {
          warnings.push({
            id: `warning-${vehicle.id}-maintenance`,
            assetType: 'vehicle',
            assetId: vehicle.id,
            assetName: `${vehicle.make} ${vehicle.model} (${vehicle.vehicleNumber})`,
            deadlineType: 'maintenance',
            deadlineDate: vehicle.maintenanceDate,
            daysRemaining: maintenanceDays,
            level: maintenanceDays <= 30 ? 'critical' : 'warning',
          });
        }

        // 保険期限
        const insuranceDate = new Date(vehicle.insuranceDate);
        const insuranceDays = Math.ceil(
          (insuranceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (insuranceDays <= 60) {
          warnings.push({
            id: `warning-${vehicle.id}-insurance`,
            assetType: 'vehicle',
            assetId: vehicle.id,
            assetName: `${vehicle.make} ${vehicle.model} (${vehicle.vehicleNumber})`,
            deadlineType: 'insurance',
            deadlineDate: vehicle.insuranceDate,
            daysRemaining: insuranceDays,
            level: insuranceDays <= 30 ? 'critical' : 'warning',
          });
        }

        // リース契約期限
        if (vehicle.ownershipType === 'leased' && vehicle.leaseInfo) {
          const contractEndDate = new Date(vehicle.leaseInfo.contractEnd);
          const contractDays = Math.ceil(
            (contractEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (contractDays <= 60) {
            warnings.push({
              id: `warning-${vehicle.id}-contract`,
              assetType: 'vehicle',
              assetId: vehicle.id,
              assetName: `${vehicle.make} ${vehicle.model} (${vehicle.vehicleNumber})`,
              deadlineType: 'contract',
              deadlineDate: vehicle.leaseInfo.contractEnd,
              daysRemaining: contractDays,
              level: contractDays <= 30 ? 'critical' : 'warning',
            });
          }
        }
      });

      // 残日数でソート（少ない順）
      return warnings.sort((a, b) => a.daysRemaining - b.daysRemaining);
    },

    // 費用集計
    getCostSummary: (startMonth: string, endMonth: string): CostSummary[] => {
      const vehicles: Vehicle[] = get().vehicles;
      const summaryMap = new Map<string, CostSummary>();

      // 月のリストを生成
      const start = new Date(startMonth + '-01');
      const end = new Date(endMonth + '-01');
      const months: string[] = [];

      for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
        const monthKey = d.toISOString().substring(0, 7); // YYYY-MM
        months.push(monthKey);
        summaryMap.set(monthKey, {
          month: monthKey,
          vehicleLeaseCost: 0,
          vehicleMaintenanceCost: 0,
          pcLeaseCost: 0,
          mobileCost: 0,
          otherCost: 0,
          total: 0,
        });
      }

      // 車両リース費用
      vehicles.forEach((vehicle) => {
        if (vehicle.ownershipType === 'leased' && vehicle.leaseInfo) {
          const contractStart = new Date(vehicle.leaseInfo.contractStart);
          const contractEnd = new Date(vehicle.leaseInfo.contractEnd);

          months.forEach((month) => {
            const monthDate = new Date(month + '-01');
            if (monthDate >= contractStart && monthDate <= contractEnd) {
              const summary = summaryMap.get(month)!;
              summary.vehicleLeaseCost += vehicle.leaseInfo!.monthlyCost;
            }
          });
        }
      });

      // メンテナンス費用
      vehicles.forEach((vehicle) => {
        vehicle.maintenanceRecords.forEach((record) => {
          const recordMonth = record.date.substring(0, 7); // YYYY-MM
          if (summaryMap.has(recordMonth)) {
            const summary = summaryMap.get(recordMonth)!;
            summary.vehicleMaintenanceCost += record.cost;
          }
        });
      });

      // 合計計算
      summaryMap.forEach((summary) => {
        summary.total =
          summary.vehicleLeaseCost +
          summary.vehicleMaintenanceCost +
          summary.pcLeaseCost +
          summary.mobileCost +
          summary.otherCost;
      });

      return months.map((month) => summaryMap.get(month)!);
    },

    // データリセット
    resetData: () => {
      set({
        vehicles: getInitialVehicles(),
        vendors: getInitialVendors(),
      });
    },
  });

  // SSR時はpersistを使わない
  if (typeof window === 'undefined') {
    return create<VehicleState>()(storeCreator);
  }

  // クライアントサイドではpersistを使用
  return create<VehicleState>()(
    persist(storeCreator, {
      name: 'vehicle-store',
      skipHydration: true,
      version: DATA_VERSION,
      // 初回ロード時に初期データを設定
      onRehydrateStorage: () => (state) => {
        if (state && state.vehicles.length === 0) {
          state.vehicles = getInitialVehicles();
          state.vendors = getInitialVendors();
        }
      },
    })
  );
};

export const useVehicleStore = createVehicleStore();
