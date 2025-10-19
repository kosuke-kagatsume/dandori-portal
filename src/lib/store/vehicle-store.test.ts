/**
 * 車両管理ストアのテスト
 */

import { useVehicleStore } from './vehicle-store';
import type { Vehicle, Vendor, MaintenanceRecord, MonthlyMileage } from '@/types/asset';

describe('VehicleStore', () => {
  beforeEach(() => {
    // 各テスト前にストアとlocalStorageをリセット
    localStorage.clear();
    useVehicleStore.setState({
      vehicles: [],
      vendors: [],
    });
  });

  describe('addVehicle', () => {
    it('新しい車両を追加できる', () => {
      const newVehicle = {
        vehicleNumber: 'V-TEST-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      useVehicleStore.getState().addVehicle(newVehicle);

      const state = useVehicleStore.getState();
      expect(state.vehicles).toHaveLength(1);
      expect(state.vehicles[0].vehicleNumber).toBe('V-TEST-001');
      expect(state.vehicles[0].make).toBe('トヨタ');
      expect(state.vehicles[0]).toHaveProperty('id');
      expect(state.vehicles[0]).toHaveProperty('createdAt');
      expect(state.vehicles[0]).toHaveProperty('updatedAt');
    });

    it('リース車両を追加できる', () => {

      const leasedVehicle = {
        vehicleNumber: 'V-LEASE-001',
        licensePlate: '品川 300 さ 56-78',
        make: '日産',
        model: 'ノート',
        year: 2022,
        color: 'ホワイト',
        assignedTo: {
          userId: 'user-1',
          userName: 'テストユーザー',
          assignedDate: '2024-01-01',
        },
        ownershipType: 'leased' as const,
        leaseInfo: {
          company: 'リース会社',
          monthlyCost: 45000,
          contractStart: '2024-01-01',
          contractEnd: '2028-12-31',
          contactPerson: '担当者',
          phone: '0120-123-456',
        },
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: true,
        currentMileage: 10000,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      useVehicleStore.getState().addVehicle(leasedVehicle);

      const state = useVehicleStore.getState();
      expect(state.vehicles[0].ownershipType).toBe('leased');
      expect(state.vehicles[0].leaseInfo).toBeDefined();
      expect(state.vehicles[0].leaseInfo?.monthlyCost).toBe(45000);
    });

    it('走行距離トラッキング有効の車両を追加できる', () => {

      const vehicle = {
        vehicleNumber: 'V-MILEAGE-001',
        licensePlate: '品川 500 た 12-34',
        make: 'ホンダ',
        model: 'フィット',
        year: 2020,
        color: 'ブルー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: true,
        currentMileage: 25000,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      useVehicleStore.getState().addVehicle(vehicle);

      const state = useVehicleStore.getState();
      expect(state.vehicles[0].mileageTracking).toBe(true);
      expect(state.vehicles[0].currentMileage).toBe(25000);
    });
  });

  describe('updateVehicle', () => {
    it('車両情報を更新できる', () => {

      const newVehicle = {
        vehicleNumber: 'V-UPDATE-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      useVehicleStore.getState().addVehicle(newVehicle);
      const state1 = useVehicleStore.getState();
      const vehicleId = state1.vehicles[0].id;

      useVehicleStore.getState().updateVehicle(vehicleId, {
        color: 'レッド',
        currentTireType: 'winter',
        status: 'maintenance',
      });

      const state2 = useVehicleStore.getState();
      expect(state2.vehicles[0].color).toBe('レッド');
      expect(state2.vehicles[0].currentTireType).toBe('winter');
      expect(state2.vehicles[0].status).toBe('maintenance');
    });

    it('存在しない車両を更新しようとしても他の車両に影響しない', () => {

      const newVehicle = {
        vehicleNumber: 'V-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      useVehicleStore.getState().addVehicle(newVehicle);

      useVehicleStore.getState().updateVehicle('non-existent-id', { color: 'ブラック' });

      const state = useVehicleStore.getState();
      expect(state.vehicles[0].color).toBe('シルバー');
    });
  });

  describe('deleteVehicle', () => {
    it('車両を削除できる', () => {

      const newVehicle = {
        vehicleNumber: 'V-DELETE-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      useVehicleStore.getState().addVehicle(newVehicle);
      const state1 = useVehicleStore.getState();
      expect(state1.vehicles).toHaveLength(1);

      useVehicleStore.getState().deleteVehicle(state1.vehicles[0].id);

      const state2 = useVehicleStore.getState();
      expect(state2.vehicles).toHaveLength(0);
    });

    it('複数の車両から特定の車両だけを削除できる', () => {
      const vehicle1 = {
        vehicleNumber: 'V-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      const vehicle2 = {
        vehicleNumber: 'V-002',
        licensePlate: '品川 300 さ 56-78',
        make: '日産',
        model: 'ノート',
        year: 2022,
        color: 'ホワイト',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      useVehicleStore.getState().addVehicle(vehicle1);
      useVehicleStore.getState().addVehicle(vehicle2);

      const state1 = useVehicleStore.getState();
      expect(state1.vehicles).toHaveLength(2);

      // Find vehicle by vehicleNumber instead of using array index
      const firstVehicle = state1.vehicles.find(vehicle => vehicle.vehicleNumber === 'V-001');
      expect(firstVehicle).toBeDefined();

      useVehicleStore.getState().deleteVehicle(firstVehicle!.id);

      const state2 = useVehicleStore.getState();
      expect(state2.vehicles).toHaveLength(1);
      expect(state2.vehicles[0].vehicleNumber).toBe('V-002');
    });
  });

  describe('getVehicle', () => {
    it('IDで車両を取得できる', () => {
      const { addVehicle, getVehicle } = useVehicleStore.getState();

      const newVehicle = {
        vehicleNumber: 'V-GET-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);
      const state = useVehicleStore.getState();
      const vehicleId = state.vehicles[0].id;

      const vehicle = getVehicle(vehicleId);
      expect(vehicle).toBeDefined();
      expect(vehicle?.vehicleNumber).toBe('V-GET-001');
    });

    it('存在しないIDの場合はundefinedを返す', () => {
      const { getVehicle } = useVehicleStore.getState();

      const vehicle = getVehicle('non-existent-id');
      expect(vehicle).toBeUndefined();
    });
  });

  describe('addMonthlyMileage', () => {
    it('月次走行距離を追加できる', () => {
      const { addVehicle, addMonthlyMileage } = useVehicleStore.getState();

      const newVehicle = {
        vehicleNumber: 'V-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: true,
        currentMileage: 10000,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);
      const state1 = useVehicleStore.getState();
      const vehicleId = state1.vehicles[0].id;

      addMonthlyMileage(vehicleId, {
        month: '2024-10',
        distance: 1200,
        recordedBy: 'user-1',
        recordedByName: 'テストユーザー',
      });

      const state2 = useVehicleStore.getState();
      expect(state2.vehicles[0].monthlyMileages).toHaveLength(1);
      expect(state2.vehicles[0].monthlyMileages[0].month).toBe('2024-10');
      expect(state2.vehicles[0].monthlyMileages[0].distance).toBe(1200);
      expect(state2.vehicles[0].monthlyMileages[0]).toHaveProperty('id');
      expect(state2.vehicles[0].monthlyMileages[0]).toHaveProperty('recordedAt');
    });

    it('複数の月次走行距離を追加できる', () => {
      const { addVehicle, addMonthlyMileage } = useVehicleStore.getState();

      const newVehicle = {
        vehicleNumber: 'V-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: true,
        currentMileage: 10000,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);
      const state1 = useVehicleStore.getState();
      const vehicleId = state1.vehicles[0].id;

      addMonthlyMileage(vehicleId, {
        month: '2024-09',
        distance: 1100,
        recordedBy: 'user-1',
        recordedByName: 'テストユーザー',
      });

      addMonthlyMileage(vehicleId, {
        month: '2024-10',
        distance: 1200,
        recordedBy: 'user-1',
        recordedByName: 'テストユーザー',
      });

      const state2 = useVehicleStore.getState();
      expect(state2.vehicles[0].monthlyMileages).toHaveLength(2);
    });
  });

  describe('updateMonthlyMileage', () => {
    it('月次走行距離を更新できる', () => {
      const { addVehicle, addMonthlyMileage, updateMonthlyMileage } = useVehicleStore.getState();

      const newVehicle = {
        vehicleNumber: 'V-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: true,
        currentMileage: 10000,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);
      const state1 = useVehicleStore.getState();
      const vehicleId = state1.vehicles[0].id;

      addMonthlyMileage(vehicleId, {
        month: '2024-10',
        distance: 1200,
        recordedBy: 'user-1',
        recordedByName: 'テストユーザー',
      });

      const state2 = useVehicleStore.getState();
      const mileageId = state2.vehicles[0].monthlyMileages[0].id;

      updateMonthlyMileage(vehicleId, mileageId, {
        distance: 1300,
      });

      const state3 = useVehicleStore.getState();
      expect(state3.vehicles[0].monthlyMileages[0].distance).toBe(1300);
    });
  });

  describe('deleteMonthlyMileage', () => {
    it('月次走行距離を削除できる', () => {
      const { addVehicle, addMonthlyMileage, deleteMonthlyMileage } = useVehicleStore.getState();

      const newVehicle = {
        vehicleNumber: 'V-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: true,
        currentMileage: 10000,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);
      const state1 = useVehicleStore.getState();
      const vehicleId = state1.vehicles[0].id;

      addMonthlyMileage(vehicleId, {
        month: '2024-10',
        distance: 1200,
        recordedBy: 'user-1',
        recordedByName: 'テストユーザー',
      });

      const state2 = useVehicleStore.getState();
      const mileageId = state2.vehicles[0].monthlyMileages[0].id;

      deleteMonthlyMileage(vehicleId, mileageId);

      const state3 = useVehicleStore.getState();
      expect(state3.vehicles[0].monthlyMileages).toHaveLength(0);
    });
  });

  describe('addMaintenanceRecord', () => {
    it('メンテナンス記録を追加できる', () => {
      const { addVehicle, addVendor, addMaintenanceRecord } = useVehicleStore.getState();

      // 業者を追加
      addVendor({
        name: 'オートサービス山田',
        phone: '03-1234-5678',
        address: '東京都港区1-2-3',
        contactPerson: '山田太郎',
      });

      const state1 = useVehicleStore.getState();
      const vendorId = state1.vendors[0].id;

      // 車両を追加
      const newVehicle = {
        vehicleNumber: 'V-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);
      const state2 = useVehicleStore.getState();
      const vehicleId = state2.vehicles[0].id;

      // メンテナンス記録を追加
      addMaintenanceRecord(vehicleId, {
        vehicleId,
        type: 'oil_change',
        date: '2024-10-15',
        cost: 8000,
        vendorId,
        vendorName: 'オートサービス山田',
        description: 'エンジンオイル交換',
        performedBy: 'user-1',
        performedByName: 'テストユーザー',
      });

      const state3 = useVehicleStore.getState();
      expect(state3.vehicles[0].maintenanceRecords).toHaveLength(1);
      expect(state3.vehicles[0].maintenanceRecords[0].type).toBe('oil_change');
      expect(state3.vehicles[0].maintenanceRecords[0].cost).toBe(8000);
      expect(state3.vehicles[0].maintenanceRecords[0]).toHaveProperty('id');
      expect(state3.vehicles[0].maintenanceRecords[0]).toHaveProperty('createdAt');
      expect(state3.vehicles[0].maintenanceRecords[0]).toHaveProperty('updatedAt');
    });

    it('メンテナンス記録追加時に業者の作業実績件数が増加する', () => {
      const { addVehicle, addVendor, addMaintenanceRecord } = useVehicleStore.getState();

      // 業者を追加
      addVendor({
        name: 'オートサービス山田',
        phone: '03-1234-5678',
        address: '東京都港区1-2-3',
        contactPerson: '山田太郎',
      });

      const state1 = useVehicleStore.getState();
      const vendorId = state1.vendors[0].id;
      const initialWorkCount = state1.vendors[0].workCount;

      // 車両を追加
      const newVehicle = {
        vehicleNumber: 'V-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);
      const state2 = useVehicleStore.getState();
      const vehicleId = state2.vehicles[0].id;

      // メンテナンス記録を追加
      addMaintenanceRecord(vehicleId, {
        vehicleId,
        type: 'oil_change',
        date: '2024-10-15',
        cost: 8000,
        vendorId,
        vendorName: 'オートサービス山田',
        description: 'エンジンオイル交換',
        performedBy: 'user-1',
        performedByName: 'テストユーザー',
      });

      const state3 = useVehicleStore.getState();
      expect(state3.vendors[0].workCount).toBe(initialWorkCount + 1);
    });

    it('タイヤ交換のメンテナンス記録を追加できる', () => {
      const { addVehicle, addVendor, addMaintenanceRecord } = useVehicleStore.getState();

      addVendor({
        name: 'タイヤ館新宿店',
        phone: '03-9876-5432',
        address: '東京都新宿区4-5-6',
        contactPerson: '鈴木花子',
      });

      const state1 = useVehicleStore.getState();
      const vendorId = state1.vendors[0].id;

      const newVehicle = {
        vehicleNumber: 'V-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);
      const state2 = useVehicleStore.getState();
      const vehicleId = state2.vehicles[0].id;

      addMaintenanceRecord(vehicleId, {
        vehicleId,
        type: 'tire_change',
        date: '2024-11-01',
        cost: 65000,
        vendorId,
        vendorName: 'タイヤ館新宿店',
        description: '冬タイヤに交換',
        tireType: 'winter',
        performedBy: 'user-1',
        performedByName: 'テストユーザー',
      });

      const state3 = useVehicleStore.getState();
      expect(state3.vehicles[0].maintenanceRecords[0].type).toBe('tire_change');
      expect(state3.vehicles[0].maintenanceRecords[0].tireType).toBe('winter');
    });
  });

  describe('updateMaintenanceRecord', () => {
    it('メンテナンス記録を更新できる', () => {
      const { addVehicle, addVendor, addMaintenanceRecord, updateMaintenanceRecord } = useVehicleStore.getState();

      addVendor({
        name: 'オートサービス山田',
        phone: '03-1234-5678',
        address: '東京都港区1-2-3',
        contactPerson: '山田太郎',
      });

      const state1 = useVehicleStore.getState();
      const vendorId = state1.vendors[0].id;

      const newVehicle = {
        vehicleNumber: 'V-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);
      const state2 = useVehicleStore.getState();
      const vehicleId = state2.vehicles[0].id;

      addMaintenanceRecord(vehicleId, {
        vehicleId,
        type: 'oil_change',
        date: '2024-10-15',
        cost: 8000,
        vendorId,
        vendorName: 'オートサービス山田',
        description: 'エンジンオイル交換',
        performedBy: 'user-1',
        performedByName: 'テストユーザー',
      });

      const state3 = useVehicleStore.getState();
      const recordId = state3.vehicles[0].maintenanceRecords[0].id;

      updateMaintenanceRecord(vehicleId, recordId, {
        cost: 9000,
        notes: '特殊オイル使用',
      });

      const state4 = useVehicleStore.getState();
      expect(state4.vehicles[0].maintenanceRecords[0].cost).toBe(9000);
      expect(state4.vehicles[0].maintenanceRecords[0].notes).toBe('特殊オイル使用');
    });
  });

  describe('deleteMaintenanceRecord', () => {
    it('メンテナンス記録を削除できる', () => {
      const { addVehicle, addVendor, addMaintenanceRecord, deleteMaintenanceRecord } = useVehicleStore.getState();

      addVendor({
        name: 'オートサービス山田',
        phone: '03-1234-5678',
        address: '東京都港区1-2-3',
        contactPerson: '山田太郎',
      });

      const state1 = useVehicleStore.getState();
      const vendorId = state1.vendors[0].id;

      const newVehicle = {
        vehicleNumber: 'V-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);
      const state2 = useVehicleStore.getState();
      const vehicleId = state2.vehicles[0].id;

      addMaintenanceRecord(vehicleId, {
        vehicleId,
        type: 'oil_change',
        date: '2024-10-15',
        cost: 8000,
        vendorId,
        vendorName: 'オートサービス山田',
        description: 'エンジンオイル交換',
        performedBy: 'user-1',
        performedByName: 'テストユーザー',
      });

      const state3 = useVehicleStore.getState();
      const recordId = state3.vehicles[0].maintenanceRecords[0].id;

      deleteMaintenanceRecord(vehicleId, recordId);

      const state4 = useVehicleStore.getState();
      expect(state4.vehicles[0].maintenanceRecords).toHaveLength(0);
    });
  });

  describe('addVendor', () => {
    it('新しい業者を追加できる', () => {
      const { addVendor } = useVehicleStore.getState();

      addVendor({
        name: 'オートサービス山田',
        phone: '03-1234-5678',
        address: '東京都港区1-2-3',
        contactPerson: '山田太郎',
        email: 'yamada@auto-service.jp',
        rating: 5,
        notes: '車検・点検でいつもお世話になっています',
      });

      const state = useVehicleStore.getState();
      expect(state.vendors).toHaveLength(1);
      expect(state.vendors[0].name).toBe('オートサービス山田');
      expect(state.vendors[0].workCount).toBe(0);
      expect(state.vendors[0]).toHaveProperty('id');
      expect(state.vendors[0]).toHaveProperty('createdAt');
      expect(state.vendors[0]).toHaveProperty('updatedAt');
    });

    it('評価付きの業者を追加できる', () => {
      const { addVendor } = useVehicleStore.getState();

      addVendor({
        name: 'タイヤ館新宿店',
        phone: '03-9876-5432',
        address: '東京都新宿区4-5-6',
        contactPerson: '鈴木花子',
        rating: 4,
      });

      const state = useVehicleStore.getState();
      expect(state.vendors[0].rating).toBe(4);
    });
  });

  describe('updateVendor', () => {
    it('業者情報を更新できる', () => {
      const { addVendor, updateVendor } = useVehicleStore.getState();

      addVendor({
        name: 'オートサービス山田',
        phone: '03-1234-5678',
        address: '東京都港区1-2-3',
        contactPerson: '山田太郎',
        rating: 4,
      });

      const state1 = useVehicleStore.getState();
      const vendorId = state1.vendors[0].id;

      updateVendor(vendorId, {
        rating: 5,
        email: 'yamada@auto-service.jp',
      });

      const state2 = useVehicleStore.getState();
      expect(state2.vendors[0].rating).toBe(5);
      expect(state2.vendors[0].email).toBe('yamada@auto-service.jp');
    });
  });

  describe('deleteVendor', () => {
    it('業者を削除できる', () => {
      const { addVendor, deleteVendor } = useVehicleStore.getState();

      addVendor({
        name: 'オートサービス山田',
        phone: '03-1234-5678',
        address: '東京都港区1-2-3',
        contactPerson: '山田太郎',
      });

      const state1 = useVehicleStore.getState();
      expect(state1.vendors).toHaveLength(1);

      deleteVendor(state1.vendors[0].id);

      const state2 = useVehicleStore.getState();
      expect(state2.vendors).toHaveLength(0);
    });
  });

  describe('getVendor', () => {
    it('IDで業者を取得できる', () => {
      const { addVendor, getVendor } = useVehicleStore.getState();

      addVendor({
        name: 'オートサービス山田',
        phone: '03-1234-5678',
        address: '東京都港区1-2-3',
        contactPerson: '山田太郎',
      });

      const state = useVehicleStore.getState();
      const vendorId = state.vendors[0].id;

      const vendor = getVendor(vendorId);
      expect(vendor).toBeDefined();
      expect(vendor?.name).toBe('オートサービス山田');
    });

    it('存在しないIDの場合はundefinedを返す', () => {
      const { getVendor } = useVehicleStore.getState();

      const vendor = getVendor('non-existent-id');
      expect(vendor).toBeUndefined();
    });
  });

  describe('getDeadlineWarnings', () => {
    it('車検期限が60日以内の車両の警告を取得できる', () => {
      const { addVehicle, getDeadlineWarnings } = useVehicleStore.getState();

      const today = new Date();
      const in30Days = new Date(today);
      in30Days.setDate(today.getDate() + 30);

      const newVehicle = {
        vehicleNumber: 'V-WARNING-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: in30Days.toISOString().split('T')[0],
        maintenanceDate: '2030-12-31',
        insuranceDate: '2030-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);

      const warnings = getDeadlineWarnings();
      expect(warnings.length).toBeGreaterThan(0);
      const inspectionWarning = warnings.find(w => w.deadlineType === 'inspection');
      expect(inspectionWarning).toBeDefined();
      expect(inspectionWarning?.level).toBe('critical');
    });

    it('点検期限が60日以内の車両の警告を取得できる', () => {
      const { addVehicle, getDeadlineWarnings } = useVehicleStore.getState();

      const today = new Date();
      const in45Days = new Date(today);
      in45Days.setDate(today.getDate() + 45);

      const newVehicle = {
        vehicleNumber: 'V-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2030-12-31',
        maintenanceDate: in45Days.toISOString().split('T')[0],
        insuranceDate: '2030-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);

      const warnings = getDeadlineWarnings();
      expect(warnings.length).toBeGreaterThan(0);
      const maintenanceWarning = warnings.find(w => w.deadlineType === 'maintenance');
      expect(maintenanceWarning).toBeDefined();
      expect(maintenanceWarning?.level).toBe('warning');
    });

    it('保険期限が60日以内の車両の警告を取得できる', () => {
      const { addVehicle, getDeadlineWarnings } = useVehicleStore.getState();

      const today = new Date();
      const in20Days = new Date(today);
      in20Days.setDate(today.getDate() + 20);

      const newVehicle = {
        vehicleNumber: 'V-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2030-12-31',
        maintenanceDate: '2030-12-31',
        insuranceDate: in20Days.toISOString().split('T')[0],
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);

      const warnings = getDeadlineWarnings();
      expect(warnings.length).toBeGreaterThan(0);
      const insuranceWarning = warnings.find(w => w.deadlineType === 'insurance');
      expect(insuranceWarning).toBeDefined();
      expect(insuranceWarning?.level).toBe('critical');
    });

    it('リース契約期限が60日以内の車両の警告を取得できる', () => {
      const { addVehicle, getDeadlineWarnings } = useVehicleStore.getState();

      const today = new Date();
      const in25Days = new Date(today);
      in25Days.setDate(today.getDate() + 25);

      const newVehicle = {
        vehicleNumber: 'V-LEASE-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'leased' as const,
        leaseInfo: {
          company: 'リース会社',
          monthlyCost: 45000,
          contractStart: '2024-01-01',
          contractEnd: in25Days.toISOString().split('T')[0],
          contactPerson: '担当者',
          phone: '0120-123-456',
        },
        inspectionDate: '2030-12-31',
        maintenanceDate: '2030-12-31',
        insuranceDate: '2030-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);

      const warnings = getDeadlineWarnings();
      expect(warnings.length).toBeGreaterThan(0);
      const contractWarning = warnings.find(w => w.deadlineType === 'contract');
      expect(contractWarning).toBeDefined();
      expect(contractWarning?.level).toBe('critical');
    });

    it('警告が残日数の少ない順にソートされる', () => {
      const { addVehicle, getDeadlineWarnings } = useVehicleStore.getState();

      const today = new Date();
      const in10Days = new Date(today);
      in10Days.setDate(today.getDate() + 10);
      const in50Days = new Date(today);
      in50Days.setDate(today.getDate() + 50);

      const vehicle1 = {
        vehicleNumber: 'V-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: in50Days.toISOString().split('T')[0],
        maintenanceDate: '2030-12-31',
        insuranceDate: '2030-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      const vehicle2 = {
        vehicleNumber: 'V-002',
        licensePlate: '品川 300 さ 56-78',
        make: '日産',
        model: 'ノート',
        year: 2022,
        color: 'ホワイト',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: in10Days.toISOString().split('T')[0],
        maintenanceDate: '2030-12-31',
        insuranceDate: '2030-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(vehicle1);
      addVehicle(vehicle2);

      const warnings = getDeadlineWarnings();
      expect(warnings.length).toBeGreaterThanOrEqual(2);
      expect(warnings[0].daysRemaining).toBeLessThan(warnings[1].daysRemaining);
    });

    it('期限が60日以上先の車両は警告に含まれない', () => {
      const { addVehicle, getDeadlineWarnings } = useVehicleStore.getState();

      const today = new Date();
      const in100Days = new Date(today);
      in100Days.setDate(today.getDate() + 100);

      const newVehicle = {
        vehicleNumber: 'V-SAFE-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: in100Days.toISOString().split('T')[0],
        maintenanceDate: in100Days.toISOString().split('T')[0],
        insuranceDate: in100Days.toISOString().split('T')[0],
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);

      const warnings = getDeadlineWarnings();
      expect(warnings).toHaveLength(0);
    });
  });

  describe('getCostSummary', () => {
    it('指定期間の費用集計を取得できる', () => {
      const { addVehicle, addVendor, addMaintenanceRecord, getCostSummary } = useVehicleStore.getState();

      // リース車両を追加
      const leasedVehicle = {
        vehicleNumber: 'V-LEASE-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'leased' as const,
        leaseInfo: {
          company: 'リース会社',
          monthlyCost: 45000,
          contractStart: '2024-01-01',
          contractEnd: '2028-12-31',
          contactPerson: '担当者',
          phone: '0120-123-456',
        },
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(leasedVehicle);

      const summary = getCostSummary('2024-01', '2024-12');
      expect(summary).toHaveLength(12);
      expect(summary[0].month).toBe('2024-01');
      expect(summary[0].vehicleLeaseCost).toBe(45000);
    });

    it('メンテナンス費用が月別に集計される', () => {
      const { addVehicle, addVendor, addMaintenanceRecord, getCostSummary } = useVehicleStore.getState();

      addVendor({
        name: 'オートサービス山田',
        phone: '03-1234-5678',
        address: '東京都港区1-2-3',
        contactPerson: '山田太郎',
      });

      const state1 = useVehicleStore.getState();
      const vendorId = state1.vendors[0].id;

      const newVehicle = {
        vehicleNumber: 'V-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);
      const state2 = useVehicleStore.getState();
      const vehicleId = state2.vehicles[0].id;

      addMaintenanceRecord(vehicleId, {
        vehicleId,
        type: 'oil_change',
        date: '2024-10-15',
        cost: 8000,
        vendorId,
        vendorName: 'オートサービス山田',
        description: 'エンジンオイル交換',
        performedBy: 'user-1',
        performedByName: 'テストユーザー',
      });

      const summary = getCostSummary('2024-10', '2024-10');
      expect(summary).toHaveLength(1);
      expect(summary[0].vehicleMaintenanceCost).toBe(8000);
    });

    it('総費用が正しく計算される', () => {
      const { addVehicle, addVendor, addMaintenanceRecord, getCostSummary } = useVehicleStore.getState();

      // リース車両を追加
      const leasedVehicle = {
        vehicleNumber: 'V-LEASE-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'leased' as const,
        leaseInfo: {
          company: 'リース会社',
          monthlyCost: 45000,
          contractStart: '2024-10-01',
          contractEnd: '2028-12-31',
          contactPerson: '担当者',
          phone: '0120-123-456',
        },
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(leasedVehicle);

      // 業者を追加
      addVendor({
        name: 'オートサービス山田',
        phone: '03-1234-5678',
        address: '東京都港区1-2-3',
        contactPerson: '山田太郎',
      });

      const state1 = useVehicleStore.getState();
      const vendorId = state1.vendors[0].id;
      const vehicleId = state1.vehicles[0].id;

      // メンテナンス記録を追加
      addMaintenanceRecord(vehicleId, {
        vehicleId,
        type: 'oil_change',
        date: '2024-10-15',
        cost: 8000,
        vendorId,
        vendorName: 'オートサービス山田',
        description: 'エンジンオイル交換',
        performedBy: 'user-1',
        performedByName: 'テストユーザー',
      });

      const summary = getCostSummary('2024-10', '2024-10');
      expect(summary[0].total).toBe(45000 + 8000); // リース費用 + メンテナンス費用
    });
  });

  describe('resetData', () => {
    it('データを初期状態にリセットできる', () => {
      const { addVehicle, addVendor, resetData } = useVehicleStore.getState();

      const newVehicle = {
        vehicleNumber: 'V-RESET-001',
        licensePlate: '品川 500 あ 12-34',
        make: 'トヨタ',
        model: 'プリウス',
        year: 2021,
        color: 'シルバー',
        assignedTo: null,
        ownershipType: 'owned' as const,
        inspectionDate: '2025-12-31',
        maintenanceDate: '2025-06-30',
        insuranceDate: '2025-12-31',
        currentTireType: 'summer' as const,
        status: 'active' as const,
        mileageTracking: false,
        monthlyMileages: [],
        maintenanceRecords: [],
      };

      addVehicle(newVehicle);

      addVendor({
        name: 'テスト業者',
        phone: '03-0000-0000',
        address: 'テスト住所',
        contactPerson: 'テスト担当者',
      });

      resetData();

      const state = useVehicleStore.getState();
      // resetDataは初期サンプルデータを設定する
      expect(state.vehicles.length).toBeGreaterThan(0);
      expect(state.vendors.length).toBeGreaterThan(0);
      // 初期データには特定のvehicleNumberが含まれる
      const hasInitialVehicleData = state.vehicles.some(v => v.vehicleNumber.startsWith('V-00'));
      expect(hasInitialVehicleData).toBe(true);
      // 初期データには特定の業者が含まれる
      const hasInitialVendorData = state.vendors.some(v => v.name === 'オートサービス山田');
      expect(hasInitialVendorData).toBe(true);
    });
  });
});
