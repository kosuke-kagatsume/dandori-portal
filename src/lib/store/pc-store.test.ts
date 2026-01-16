/**
 * PC資産管理ストアのテスト
 */

import { usePCStore } from './pc-store';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { PCAsset, SoftwareLicense } from '@/types/asset'; // 型定義参照用

describe('PCStore', () => {
  beforeEach(() => {
    // 各テスト前にストアとlocalStorageをリセット
    localStorage.clear();
    usePCStore.setState({
      pcs: [],
    });
  });

  describe('addPC', () => {
    it('新しいPC資産を追加できる', () => {
      const newPC = {
        assetNumber: 'PC-TEST-001',
        manufacturer: 'Dell',
        model: 'Latitude 5420',
        serialNumber: 'SN-TEST-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);

      const state = usePCStore.getState();
      expect(state.pcs).toHaveLength(1);
      expect(state.pcs[0].assetNumber).toBe('PC-TEST-001');
      expect(state.pcs[0].manufacturer).toBe('Dell');
      expect(state.pcs[0]).toHaveProperty('id');
      expect(state.pcs[0]).toHaveProperty('createdAt');
      expect(state.pcs[0]).toHaveProperty('updatedAt');
    });

    it('複数のPC資産を追加できる', () => {
      const pc1 = {
        assetNumber: 'PC-001',
        manufacturer: 'Dell',
        model: 'Latitude 5420',
        serialNumber: 'SN-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      const pc2 = {
        assetNumber: 'PC-002',
        manufacturer: 'Apple',
        model: 'MacBook Pro',
        serialNumber: 'SN-002',
        cpu: 'M2 Pro',
        memory: '32GB',
        storage: '1TB SSD',
        os: 'macOS Sonoma',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(pc1);
      usePCStore.getState().addPC(pc2);

      const state = usePCStore.getState();
      expect(state.pcs).toHaveLength(2);
    });

    it('リース情報を含むPC資産を追加できる', () => {
      const leasedPC = {
        assetNumber: 'PC-LEASE-001',
        manufacturer: 'HP',
        model: 'EliteBook',
        serialNumber: 'SN-LEASE-001',
        cpu: 'Intel Core i5',
        memory: '16GB',
        storage: '256GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: {
          userId: 'user-1',
          userName: 'テストユーザー',
          assignedDate: '2024-01-01',
        },
        ownershipType: 'leased' as const,
        leaseInfo: {
          company: 'リース会社',
          monthlyCost: 8000,
          contractStart: '2024-01-01',
          contractEnd: '2027-12-31',
          contactPerson: '担当者',
          phone: '0120-123-456',
        },
        warrantyExpiration: '2027-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(leasedPC);

      const state = usePCStore.getState();
      expect(state.pcs[0].ownershipType).toBe('leased');
      expect(state.pcs[0].leaseInfo).toBeDefined();
      expect(state.pcs[0].leaseInfo?.monthlyCost).toBe(8000);
    });
  });

  describe('updatePC', () => {
    it('PC資産情報を更新できる', async () => {
      const newPC = {
        assetNumber: 'PC-UPDATE-001',
        manufacturer: 'Dell',
        model: 'Latitude 5420',
        serialNumber: 'SN-UPDATE-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);
      const state1 = usePCStore.getState();
      const pcId = state1.pcs[0].id;
      const originalUpdatedAt = state1.pcs[0].updatedAt;

      // Wait 2ms to ensure updatedAt will be different
      await new Promise(resolve => setTimeout(resolve, 2));

      usePCStore.getState().updatePC(pcId, {
        memory: '32GB',
        storage: '1TB SSD',
      });

      const state2 = usePCStore.getState();
      expect(state2.pcs[0].memory).toBe('32GB');
      expect(state2.pcs[0].storage).toBe('1TB SSD');
      expect(state2.pcs[0].updatedAt).not.toBe(originalUpdatedAt);
    });

    it('存在しないPCを更新しようとしても他のPCに影響しない', () => {
      const newPC = {
        assetNumber: 'PC-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);

      usePCStore.getState().updatePC('non-existent-id', { memory: '64GB' });

      const state = usePCStore.getState();
      expect(state.pcs[0].memory).toBe('16GB');
    });

    it('PC資産のステータスを更新できる', () => {
      const newPC = {
        assetNumber: 'PC-STATUS-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-STATUS-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);
      const state1 = usePCStore.getState();
      const pcId = state1.pcs[0].id;

      usePCStore.getState().updatePC(pcId, { status: 'maintenance' });

      const state2 = usePCStore.getState();
      expect(state2.pcs[0].status).toBe('maintenance');
    });
  });

  describe('deletePC', () => {
    it('PC資産を削除できる', () => {
      const newPC = {
        assetNumber: 'PC-DELETE-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-DELETE-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);
      const state1 = usePCStore.getState();
      expect(state1.pcs).toHaveLength(1);

      usePCStore.getState().deletePC(state1.pcs[0].id);

      const state2 = usePCStore.getState();
      expect(state2.pcs).toHaveLength(0);
    });

    it('存在しないPCを削除しようとしても他のPCに影響しない', () => {
      const newPC = {
        assetNumber: 'PC-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);

      usePCStore.getState().deletePC('non-existent-id');

      const state = usePCStore.getState();
      expect(state.pcs).toHaveLength(1);
    });

    it('複数のPCから特定のPCだけを削除できる', () => {
      const pc1 = {
        assetNumber: 'PC-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      const pc2 = {
        assetNumber: 'PC-002',
        manufacturer: 'Apple',
        model: 'MacBook',
        serialNumber: 'SN-002',
        cpu: 'M2',
        memory: '32GB',
        storage: '1TB SSD',
        os: 'macOS',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(pc1);
      usePCStore.getState().addPC(pc2);

      const state1 = usePCStore.getState();
      expect(state1.pcs).toHaveLength(2);

      // Find PC by assetNumber instead of using array index
      const firstPc = state1.pcs.find(pc => pc.assetNumber === 'PC-001');
      expect(firstPc).toBeDefined();

      usePCStore.getState().deletePC(firstPc!.id);

      const state2 = usePCStore.getState();
      expect(state2.pcs).toHaveLength(1);
      expect(state2.pcs[0].assetNumber).toBe('PC-002');
    });
  });

  describe('getPC', () => {
    it('IDでPC資産を取得できる', () => {
      const newPC = {
        assetNumber: 'PC-GET-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-GET-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);
      const state = usePCStore.getState();
      const pcId = state.pcs[0].id;

      const pc = usePCStore.getState().getPC(pcId);
      expect(pc).toBeDefined();
      expect(pc?.assetNumber).toBe('PC-GET-001');
    });

    it('存在しないIDの場合はundefinedを返す', () => {
      const pc = usePCStore.getState().getPC('non-existent-id');
      expect(pc).toBeUndefined();
    });
  });

  describe('addLicense', () => {
    it('PC資産にライセンスを追加できる', () => {
      const newPC = {
        assetNumber: 'PC-LICENSE-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-LICENSE-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);
      const state1 = usePCStore.getState();
      const pcId = state1.pcs[0].id;

      const license = {
        softwareName: 'Microsoft Office 365',
        licenseKey: 'XXXXX-XXXXX-XXXXX',
        expirationDate: '2025-12-31',
        monthlyCost: 1200,
      };

      usePCStore.getState().addLicense(pcId, license);

      const state2 = usePCStore.getState();
      expect(state2.pcs[0].licenses).toHaveLength(1);
      expect(state2.pcs[0].licenses[0].softwareName).toBe('Microsoft Office 365');
      expect(state2.pcs[0].licenses[0]).toHaveProperty('id');
    });

    it('同じPCに複数のライセンスを追加できる', () => {
      const newPC = {
        assetNumber: 'PC-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);
      const state1 = usePCStore.getState();
      const pcId = state1.pcs[0].id;

      usePCStore.getState().addLicense(pcId, {
        softwareName: 'Adobe Creative Cloud',
        licenseKey: 'AAAAA-AAAAA-AAAAA',
        expirationDate: '2025-12-31',
        monthlyCost: 5980,
      });

      usePCStore.getState().addLicense(pcId, {
        softwareName: 'Microsoft Office',
        licenseKey: 'BBBBB-BBBBB-BBBBB',
        expirationDate: '2025-12-31',
        monthlyCost: 1200,
      });

      const state2 = usePCStore.getState();
      expect(state2.pcs[0].licenses).toHaveLength(2);
    });

    it('存在しないPCにライセンスを追加しようとしても影響しない', () => {
      usePCStore.getState().addLicense('non-existent-id', {
        softwareName: 'Test Software',
        licenseKey: 'TEST-KEY',
        expirationDate: '2025-12-31',
        monthlyCost: 1000,
      });

      const state = usePCStore.getState();
      expect(state.pcs).toHaveLength(0);
    });
  });

  describe('updateLicense', () => {
    it('ライセンス情報を更新できる', () => {
      const newPC = {
        assetNumber: 'PC-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);
      const state1 = usePCStore.getState();
      const pcId = state1.pcs[0].id;

      usePCStore.getState().addLicense(pcId, {
        softwareName: 'Adobe CC',
        licenseKey: 'OLD-KEY',
        expirationDate: '2025-12-31',
        monthlyCost: 5980,
      });

      const state2 = usePCStore.getState();
      const licenseId = state2.pcs[0].licenses[0].id;

      usePCStore.getState().updateLicense(pcId, licenseId, {
        licenseKey: 'NEW-KEY',
        monthlyCost: 6980,
      });

      const state3 = usePCStore.getState();
      expect(state3.pcs[0].licenses[0].licenseKey).toBe('NEW-KEY');
      expect(state3.pcs[0].licenses[0].monthlyCost).toBe(6980);
    });

    it('存在しないライセンスを更新しようとしても他のライセンスに影響しない', () => {
      const newPC = {
        assetNumber: 'PC-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);
      const state1 = usePCStore.getState();
      const pcId = state1.pcs[0].id;

      usePCStore.getState().addLicense(pcId, {
        softwareName: 'Adobe CC',
        licenseKey: 'ORIGINAL-KEY',
        expirationDate: '2025-12-31',
        monthlyCost: 5980,
      });

      usePCStore.getState().updateLicense(pcId, 'non-existent-license-id', {
        licenseKey: 'NEW-KEY',
      });

      const state2 = usePCStore.getState();
      expect(state2.pcs[0].licenses[0].licenseKey).toBe('ORIGINAL-KEY');
    });
  });

  describe('deleteLicense', () => {
    it('ライセンスを削除できる', () => {
      const newPC = {
        assetNumber: 'PC-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);
      const state1 = usePCStore.getState();
      const pcId = state1.pcs[0].id;

      usePCStore.getState().addLicense(pcId, {
        softwareName: 'Adobe CC',
        licenseKey: 'TEST-KEY',
        expirationDate: '2025-12-31',
        monthlyCost: 5980,
      });

      const state2 = usePCStore.getState();
      const licenseId = state2.pcs[0].licenses[0].id;

      usePCStore.getState().deleteLicense(pcId, licenseId);

      const state3 = usePCStore.getState();
      expect(state3.pcs[0].licenses).toHaveLength(0);
    });

    it('複数のライセンスから特定のライセンスだけを削除できる', () => {
      const newPC = {
        assetNumber: 'PC-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);
      const state1 = usePCStore.getState();
      const pcId = state1.pcs[0].id;

      usePCStore.getState().addLicense(pcId, {
        softwareName: 'Adobe CC',
        licenseKey: 'KEY-1',
        expirationDate: '2025-12-31',
        monthlyCost: 5980,
      });

      usePCStore.getState().addLicense(pcId, {
        softwareName: 'Microsoft Office',
        licenseKey: 'KEY-2',
        expirationDate: '2025-12-31',
        monthlyCost: 1200,
      });

      const state2 = usePCStore.getState();
      expect(state2.pcs[0].licenses).toHaveLength(2);

      // Find license by softwareName instead of using array index
      const adobeLicense = state2.pcs[0].licenses.find(license => license.softwareName === 'Adobe CC');
      expect(adobeLicense).toBeDefined();

      usePCStore.getState().deleteLicense(pcId, adobeLicense!.id);

      const state3 = usePCStore.getState();
      expect(state3.pcs[0].licenses).toHaveLength(1);
      expect(state3.pcs[0].licenses[0].softwareName).toBe('Microsoft Office');
    });
  });

  describe('getDeadlineWarnings', () => {
    it('保証期限が60日以内のPCの警告を取得できる', () => {
      const today = new Date();
      const in30Days = new Date(today);
      in30Days.setDate(today.getDate() + 30);

      const newPC = {
        assetNumber: 'PC-WARNING-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-WARNING-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: in30Days.toISOString().split('T')[0],
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);

      const warnings = usePCStore.getState().getDeadlineWarnings();
      expect(warnings.length).toBeGreaterThan(0);
      const warrantyWarning = warnings.find(w => w.deadlineType === 'warranty');
      expect(warrantyWarning).toBeDefined();
      expect(warrantyWarning?.level).toBe('critical');
    });

    it('ライセンス期限が60日以内のPCの警告を取得できる', () => {
      const today = new Date();
      const in45Days = new Date(today);
      in45Days.setDate(today.getDate() + 45);

      const newPC = {
        assetNumber: 'PC-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2030-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);
      const state = usePCStore.getState();
      const pcId = state.pcs[0].id;

      usePCStore.getState().addLicense(pcId, {
        softwareName: 'Adobe CC',
        licenseKey: 'TEST-KEY',
        expirationDate: in45Days.toISOString().split('T')[0],
        monthlyCost: 5980,
      });

      const warnings = usePCStore.getState().getDeadlineWarnings();
      expect(warnings.length).toBeGreaterThan(0);
      const licenseWarning = warnings.find(w => w.deadlineType === 'contract');
      expect(licenseWarning).toBeDefined();
      expect(licenseWarning?.level).toBe('warning');
    });

    it('リース契約期限が60日以内のPCの警告を取得できる', () => {
      const today = new Date();
      const in20Days = new Date(today);
      in20Days.setDate(today.getDate() + 20);

      const newPC = {
        assetNumber: 'PC-LEASE-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-LEASE-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'leased' as const,
        leaseInfo: {
          company: 'リース会社',
          monthlyCost: 8000,
          contractStart: '2024-01-01',
          contractEnd: in20Days.toISOString().split('T')[0],
          contactPerson: '担当者',
          phone: '0120-123-456',
        },
        warrantyExpiration: '2030-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);

      const warnings = usePCStore.getState().getDeadlineWarnings();
      expect(warnings.length).toBeGreaterThan(0);
      const contractWarning = warnings.find(w => w.deadlineType === 'contract');
      expect(contractWarning).toBeDefined();
      expect(contractWarning?.level).toBe('critical');
    });

    it('警告が残日数の少ない順にソートされる', () => {
      const today = new Date();
      const in10Days = new Date(today);
      in10Days.setDate(today.getDate() + 10);
      const in50Days = new Date(today);
      in50Days.setDate(today.getDate() + 50);

      const pc1 = {
        assetNumber: 'PC-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: in50Days.toISOString().split('T')[0],
        licenses: [],
        status: 'active' as const,
      };

      const pc2 = {
        assetNumber: 'PC-002',
        manufacturer: 'Apple',
        model: 'MacBook',
        serialNumber: 'SN-002',
        cpu: 'M2',
        memory: '32GB',
        storage: '1TB SSD',
        os: 'macOS',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: in10Days.toISOString().split('T')[0],
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(pc1);
      usePCStore.getState().addPC(pc2);

      const warnings = usePCStore.getState().getDeadlineWarnings();
      expect(warnings.length).toBeGreaterThanOrEqual(2);
      expect(warnings[0].daysRemaining).toBeLessThan(warnings[1].daysRemaining);
    });

    it('期限が60日以上先のPCは警告に含まれない', () => {
      const today = new Date();
      const in100Days = new Date(today);
      in100Days.setDate(today.getDate() + 100);

      const newPC = {
        assetNumber: 'PC-SAFE-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-SAFE-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: in100Days.toISOString().split('T')[0],
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);

      const warnings = usePCStore.getState().getDeadlineWarnings();
      expect(warnings).toHaveLength(0);
    });
  });

  describe('resetData', () => {
    it('データを初期状態にリセットできる', () => {
      const newPC = {
        assetNumber: 'PC-RESET-001',
        manufacturer: 'Dell',
        model: 'Latitude',
        serialNumber: 'SN-RESET-001',
        cpu: 'Intel Core i7',
        memory: '16GB',
        storage: '512GB SSD',
        os: 'Windows 11 Pro',
        assignedTo: null,
        ownershipType: 'owned' as const,
        warrantyExpiration: '2025-12-31',
        licenses: [],
        status: 'active' as const,
      };

      usePCStore.getState().addPC(newPC);

      const state1 = usePCStore.getState();
      expect(state1.pcs.length).toBeGreaterThan(0);

      usePCStore.getState().resetData();

      const state2 = usePCStore.getState();
      // resetDataは初期サンプルデータを設定する
      expect(state2.pcs.length).toBeGreaterThan(0);
      // 初期データには特定のassetNumberが含まれる
      const hasInitialData = state2.pcs.some(pc => pc.assetNumber.startsWith('PC-00'));
      expect(hasInitialData).toBe(true);
    });
  });
});
