/**
 * PC資産管理ストア
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PCAsset, SoftwareLicense, DeadlineWarning } from '@/types/asset';

const DATA_VERSION = 1;

interface PCState {
  // データ
  pcs: PCAsset[];

  // PC CRUD
  addPC: (pc: Omit<PCAsset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePC: (id: string, updates: Partial<PCAsset>) => void;
  deletePC: (id: string) => void;
  getPC: (id: string) => PCAsset | undefined;

  // ライセンス管理
  addLicense: (pcId: string, license: Omit<SoftwareLicense, 'id'>) => void;
  updateLicense: (pcId: string, licenseId: string, updates: Partial<SoftwareLicense>) => void;
  deleteLicense: (pcId: string, licenseId: string) => void;

  // 期限警告取得
  getDeadlineWarnings: () => DeadlineWarning[];

  // データリセット
  resetData: () => void;
}

// 初期サンプルデータ
const getInitialPCs = (): PCAsset[] => {
  const now = new Date().toISOString();
  const today = new Date();

  const addMonths = (date: Date, months: number) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result.toISOString().split('T')[0];
  };

  return [
    {
      id: 'pc-1',
      assetNumber: 'PC-001',
      manufacturer: 'Dell',
      model: 'Latitude 5420',
      serialNumber: 'SN123456789',
      cpu: 'Intel Core i7-1185G7',
      memory: '16GB',
      storage: '512GB SSD',
      os: 'Windows 11 Pro',
      assignedTo: {
        userId: 'employee-1',
        userName: '山田太郎',
        assignedDate: '2023-04-01',
      },
      ownershipType: 'leased',
      leaseInfo: {
        company: 'デル・リース',
        monthlyCost: 8000,
        contractStart: '2023-04-01',
        contractEnd: '2026-03-31',
        contactPerson: '佐藤営業',
        phone: '0120-111-222',
      },
      warrantyExpiration: addMonths(today, 18),
      licenses: [
        {
          id: 'lic-1',
          softwareName: 'Microsoft 365 Business',
          licenseKey: 'XXXXX-XXXXX-XXXXX-XXXXX',
          expirationDate: addMonths(today, 11),
          monthlyCost: 1200,
        },
      ],
      status: 'active',
      notes: '営業部で使用中',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pc-2',
      assetNumber: 'PC-002',
      manufacturer: 'Apple',
      model: 'MacBook Pro 14" M2',
      serialNumber: 'SN987654321',
      cpu: 'Apple M2 Pro',
      memory: '32GB',
      storage: '1TB SSD',
      os: 'macOS Sonoma',
      assignedTo: {
        userId: 'employee-2',
        userName: '佐藤花子',
        assignedDate: '2023-06-15',
      },
      ownershipType: 'owned',
      purchaseDate: '2023-06-10',
      purchaseCost: 380000,
      warrantyExpiration: addMonths(today, 6),
      licenses: [
        {
          id: 'lic-2',
          softwareName: 'Adobe Creative Cloud',
          licenseKey: 'YYYYY-YYYYY-YYYYY-YYYYY',
          expirationDate: addMonths(today, 8),
          monthlyCost: 5980,
        },
      ],
      status: 'active',
      notes: 'デザイン部で使用中',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pc-3',
      assetNumber: 'PC-003',
      manufacturer: 'HP',
      model: 'EliteBook 840 G9',
      serialNumber: 'SN456789123',
      cpu: 'Intel Core i5-1235U',
      memory: '16GB',
      storage: '256GB SSD',
      os: 'Windows 11 Pro',
      assignedTo: null,
      ownershipType: 'owned',
      purchaseDate: '2022-03-20',
      purchaseCost: 180000,
      warrantyExpiration: addMonths(today, 0.2), // 約1週間後（critical警告）
      licenses: [],
      status: 'active',
      notes: '予備機・未割当',
      createdAt: now,
      updatedAt: now,
    },
  ];
};

const initialState = {
  pcs: [] as PCAsset[],
};

// Counter to ensure unique IDs
let idCounter = 0;

const createPCStore = () => {
  const storeCreator = (set: any, get: any) => ({
    ...initialState,

    // PC CRUD
    addPC: (pc: Omit<PCAsset, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const newPC: PCAsset = {
        ...pc,
        id: `pc-${Date.now()}-${idCounter++}`,
        createdAt: now,
        updatedAt: now,
      };
      set((state: PCState) => ({
        pcs: [...state.pcs, newPC],
      }));
    },

    updatePC: (id: string, updates: Partial<PCAsset>) => {
      set((state: PCState) => ({
        pcs: state.pcs.map((pc) =>
          pc.id === id
            ? { ...pc, ...updates, updatedAt: new Date().toISOString() }
            : pc
        ),
      }));
    },

    deletePC: (id: string) => {
      set((state: PCState) => ({
        pcs: state.pcs.filter((pc) => pc.id !== id),
      }));
    },

    getPC: (id: string) => {
      return get().pcs.find((pc: PCAsset) => pc.id === id);
    },

    // ライセンス管理
    addLicense: (pcId: string, license: Omit<SoftwareLicense, 'id'>) => {
      const newLicense: SoftwareLicense = {
        ...license,
        id: `lic-${Date.now()}-${idCounter++}`,
      };

      set((state: PCState) => ({
        pcs: state.pcs.map((pc) =>
          pc.id === pcId
            ? {
                ...pc,
                licenses: [...pc.licenses, newLicense],
                updatedAt: new Date().toISOString(),
              }
            : pc
        ),
      }));
    },

    updateLicense: (
      pcId: string,
      licenseId: string,
      updates: Partial<SoftwareLicense>
    ) => {
      set((state: PCState) => ({
        pcs: state.pcs.map((pc) =>
          pc.id === pcId
            ? {
                ...pc,
                licenses: pc.licenses.map((lic) =>
                  lic.id === licenseId ? { ...lic, ...updates } : lic
                ),
                updatedAt: new Date().toISOString(),
              }
            : pc
        ),
      }));
    },

    deleteLicense: (pcId: string, licenseId: string) => {
      set((state: PCState) => ({
        pcs: state.pcs.map((pc) =>
          pc.id === pcId
            ? {
                ...pc,
                licenses: pc.licenses.filter((lic) => lic.id !== licenseId),
                updatedAt: new Date().toISOString(),
              }
            : pc
        ),
      }));
    },

    // 期限警告取得
    getDeadlineWarnings: (): DeadlineWarning[] => {
      const pcs: PCAsset[] = get().pcs;
      const today = new Date();
      const warnings: DeadlineWarning[] = [];

      pcs.forEach((pc) => {
        // 保証期限
        const warrantyDate = new Date(pc.warrantyExpiration);
        const warrantyDays = Math.ceil(
          (warrantyDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (warrantyDays <= 60) {
          warnings.push({
            id: `warning-${pc.id}-warranty`,
            assetType: 'pc',
            assetId: pc.id,
            assetName: `${pc.manufacturer} ${pc.model} (${pc.assetNumber})`,
            deadlineType: 'warranty',
            deadlineDate: pc.warrantyExpiration,
            daysRemaining: warrantyDays,
            level: warrantyDays <= 30 ? 'critical' : 'warning',
          });
        }

        // ライセンス期限
        pc.licenses.forEach((license) => {
          if (license.expirationDate) {
            const licenseDate = new Date(license.expirationDate);
            const licenseDays = Math.ceil(
              (licenseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (licenseDays <= 60) {
              warnings.push({
                id: `warning-${pc.id}-license-${license.id}`,
                assetType: 'pc',
                assetId: pc.id,
                assetName: `${pc.assetNumber} - ${license.softwareName}`,
                deadlineType: 'contract',
                deadlineDate: license.expirationDate,
                daysRemaining: licenseDays,
                level: licenseDays <= 30 ? 'critical' : 'warning',
              });
            }
          }
        });

        // リース契約期限
        if (pc.ownershipType === 'leased' && pc.leaseInfo) {
          const contractEndDate = new Date(pc.leaseInfo.contractEnd);
          const contractDays = Math.ceil(
            (contractEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (contractDays <= 60) {
            warnings.push({
              id: `warning-${pc.id}-contract`,
              assetType: 'pc',
              assetId: pc.id,
              assetName: `${pc.manufacturer} ${pc.model} (${pc.assetNumber})`,
              deadlineType: 'contract',
              deadlineDate: pc.leaseInfo.contractEnd,
              daysRemaining: contractDays,
              level: contractDays <= 30 ? 'critical' : 'warning',
            });
          }
        }
      });

      return warnings.sort((a, b) => a.daysRemaining - b.daysRemaining);
    },

    // データリセット
    resetData: () => {
      set({
        pcs: getInitialPCs(),
      });
    },
  });

  // SSR時はpersistを使わない
  if (typeof window === 'undefined') {
    return create<PCState>()(storeCreator);
  }

  // クライアントサイドではpersistを使用
  return create<PCState>()(
    persist(storeCreator, {
      name: 'pc-store',
      version: DATA_VERSION,
      onRehydrateStorage: () => (state) => {
        if (state && state.pcs.length === 0) {
          state.pcs = getInitialPCs();
        }
      },
    })
  );
};

export const usePCStore = createPCStore();
