import { create } from 'zustand';

/**
 * マスタデータストア
 * 部署、役職、その他のマスタデータを管理
 * データベース（AWS RDS）と連携
 */

export interface Department {
  id: string;
  code?: string; // 部署コード
  name: string;
  parentId?: string | null;
  order: number;
  isActive: boolean;
}

export interface Position {
  id: string;
  name: string;
  level: number;
  order: number;
  isActive: boolean;
}

export interface EmploymentType {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
}

interface MasterDataState {
  // 状態
  departments: Department[];
  positions: Position[];
  employmentTypes: EmploymentType[];
  tenantId: string | null;
  isLoading: boolean;
  error: string | null;

  // 初期化
  setTenantId: (tenantId: string) => void;
  fetchAll: () => Promise<void>;

  // 部署操作
  fetchDepartments: () => Promise<void>;
  addDepartment: (department: Omit<Department, 'id'>) => Promise<void>;
  updateDepartment: (id: string, data: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  reorderDepartments: (departments: Department[]) => void;

  // 役職操作
  fetchPositions: () => Promise<void>;
  addPosition: (position: Omit<Position, 'id'>) => Promise<void>;
  updatePosition: (id: string, data: Partial<Position>) => Promise<void>;
  deletePosition: (id: string) => Promise<void>;
  reorderPositions: (positions: Position[]) => void;

  // 雇用形態操作
  fetchEmploymentTypes: () => Promise<void>;
  addEmploymentType: (type: Omit<EmploymentType, 'id'>) => Promise<void>;
  updateEmploymentType: (id: string, data: Partial<EmploymentType>) => Promise<void>;
  deleteEmploymentType: (id: string) => Promise<void>;

  // ヘルパー
  getActiveDepartments: () => Department[];
  getActivePositions: () => Position[];
  getActiveEmploymentTypes: () => EmploymentType[];
}

// DB応答をフロントエンド型に変換
const mapDepartment = (d: { id: string; code?: string; name: string; parentId?: string | null; sortOrder: number; isActive: boolean }): Department => ({
  id: d.id,
  code: d.code,
  name: d.name,
  parentId: d.parentId || undefined,
  order: d.sortOrder,
  isActive: d.isActive,
});

const mapPosition = (p: { id: string; name: string; level: number; sortOrder: number; isActive: boolean }): Position => ({
  id: p.id,
  name: p.name,
  level: p.level,
  order: p.sortOrder,
  isActive: p.isActive,
});

const mapEmploymentType = (t: { id: string; name: string; sortOrder: number; isActive: boolean }): EmploymentType => ({
  id: t.id,
  name: t.name,
  order: t.sortOrder,
  isActive: t.isActive,
});

export const useMasterDataStore = create<MasterDataState>()((set, get) => ({
  departments: [],
  positions: [],
  employmentTypes: [],
  tenantId: null,
  isLoading: false,
  error: null,

  setTenantId: (tenantId) => {
    set({ tenantId });
  },

  fetchAll: async () => {
    const { fetchDepartments, fetchPositions, fetchEmploymentTypes } = get();
    await Promise.all([fetchDepartments(), fetchPositions(), fetchEmploymentTypes()]);
  },

  // 部署操作
  fetchDepartments: async () => {
    const { tenantId } = get();
    if (!tenantId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/master-data/departments?tenantId=${tenantId}`);
      if (!res.ok) throw new Error('部署の取得に失敗しました');
      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.data || []);
      set({ departments: data.map(mapDepartment), isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addDepartment: async (department) => {
    const { tenantId, fetchDepartments } = get();
    if (!tenantId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/master-data/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          code: department.code || null,
          name: department.name,
          parentId: department.parentId || null,
          sortOrder: department.order,
          isActive: department.isActive,
        }),
      });
      if (!res.ok) throw new Error('部署の追加に失敗しました');
      await fetchDepartments();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateDepartment: async (id, data) => {
    const { fetchDepartments } = get();

    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/master-data/departments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...(data.code !== undefined && { code: data.code }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.parentId !== undefined && { parentId: data.parentId }),
          ...(data.order !== undefined && { sortOrder: data.order }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        }),
      });
      if (!res.ok) throw new Error('部署の更新に失敗しました');
      await fetchDepartments();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteDepartment: async (id) => {
    const { fetchDepartments } = get();

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/master-data/departments?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('部署の削除に失敗しました');
      await fetchDepartments();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  reorderDepartments: (departments) => {
    set({ departments });
  },

  // 役職操作
  fetchPositions: async () => {
    const { tenantId } = get();
    if (!tenantId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/master-data/positions?tenantId=${tenantId}`);
      if (!res.ok) throw new Error('役職の取得に失敗しました');
      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.data || []);
      set({ positions: data.map(mapPosition), isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addPosition: async (position) => {
    const { tenantId, fetchPositions } = get();
    if (!tenantId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/master-data/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: position.name,
          level: position.level,
          sortOrder: position.order,
          isActive: position.isActive,
        }),
      });
      if (!res.ok) throw new Error('役職の追加に失敗しました');
      await fetchPositions();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updatePosition: async (id, data) => {
    const { fetchPositions } = get();

    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/master-data/positions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...(data.name !== undefined && { name: data.name }),
          ...(data.level !== undefined && { level: data.level }),
          ...(data.order !== undefined && { sortOrder: data.order }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        }),
      });
      if (!res.ok) throw new Error('役職の更新に失敗しました');
      await fetchPositions();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deletePosition: async (id) => {
    const { fetchPositions } = get();

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/master-data/positions?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('役職の削除に失敗しました');
      await fetchPositions();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  reorderPositions: (positions) => {
    set({ positions });
  },

  // 雇用形態操作
  fetchEmploymentTypes: async () => {
    const { tenantId } = get();
    if (!tenantId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/master-data/employment-types?tenantId=${tenantId}`);
      if (!res.ok) throw new Error('雇用形態の取得に失敗しました');
      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.data || []);
      set({ employmentTypes: data.map(mapEmploymentType), isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addEmploymentType: async (type) => {
    const { tenantId, fetchEmploymentTypes } = get();
    if (!tenantId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/master-data/employment-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: type.name,
          sortOrder: type.order,
          isActive: type.isActive,
        }),
      });
      if (!res.ok) throw new Error('雇用形態の追加に失敗しました');
      await fetchEmploymentTypes();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateEmploymentType: async (id, data) => {
    const { fetchEmploymentTypes } = get();

    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/master-data/employment-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...(data.name !== undefined && { name: data.name }),
          ...(data.order !== undefined && { sortOrder: data.order }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        }),
      });
      if (!res.ok) throw new Error('雇用形態の更新に失敗しました');
      await fetchEmploymentTypes();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteEmploymentType: async (id) => {
    const { fetchEmploymentTypes } = get();

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/master-data/employment-types?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('雇用形態の削除に失敗しました');
      await fetchEmploymentTypes();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // ヘルパー
  getActiveDepartments: () => {
    return get().departments.filter((d) => d.isActive).sort((a, b) => a.order - b.order);
  },

  getActivePositions: () => {
    return get().positions.filter((p) => p.isActive).sort((a, b) => a.order - b.order);
  },

  getActiveEmploymentTypes: () => {
    return get().employmentTypes.filter((t) => t.isActive).sort((a, b) => a.order - b.order);
  },
}));
