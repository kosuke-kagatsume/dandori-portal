import { create } from 'zustand';
import type {
  HealthCheckupType,
  HealthCheckupTypeInput,
  HealthMedicalInstitution,
  HealthMedicalInstitutionInput,
  InstitutionExamPrice,
  InstitutionExamPriceInput,
  InstitutionOption,
  InstitutionOptionInput,
} from '@/types/health';

/**
 * 健康管理マスタストア
 * 健診種別マスタ・医療機関マスタを管理
 */

interface HealthMasterState {
  // 状態
  checkupTypes: HealthCheckupType[];
  medicalInstitutions: HealthMedicalInstitution[];
  tenantId: string | null;
  isLoading: boolean;
  error: string | null;

  // 初期化
  setTenantId: (tenantId: string) => void;
  fetchAll: () => Promise<void>;

  // 健診種別操作
  fetchCheckupTypes: () => Promise<void>;
  addCheckupType: (data: HealthCheckupTypeInput) => Promise<void>;
  updateCheckupType: (id: string, data: Partial<HealthCheckupTypeInput>) => Promise<void>;
  deleteCheckupType: (id: string) => Promise<void>;

  // 医療機関操作
  fetchMedicalInstitutions: () => Promise<void>;
  addMedicalInstitution: (data: HealthMedicalInstitutionInput) => Promise<HealthMedicalInstitution | undefined>;
  updateMedicalInstitution: (id: string, data: Partial<HealthMedicalInstitutionInput>) => Promise<void>;
  deleteMedicalInstitution: (id: string) => Promise<void>;

  // 検査項目料金操作
  fetchExamPrices: (institutionId: string) => Promise<InstitutionExamPrice[]>;
  addExamPrice: (institutionId: string, data: InstitutionExamPriceInput) => Promise<void>;
  updateExamPrice: (id: string, data: Partial<InstitutionExamPriceInput>) => Promise<void>;
  deleteExamPrice: (id: string) => Promise<void>;

  // オプション検査操作
  fetchOptions: (institutionId: string) => Promise<InstitutionOption[]>;
  addOption: (institutionId: string, data: InstitutionOptionInput) => Promise<void>;
  updateOption: (id: string, data: Partial<InstitutionOptionInput>) => Promise<void>;
  deleteOption: (id: string) => Promise<void>;

  // ヘルパー
  getActiveCheckupTypes: () => HealthCheckupType[];
  getActiveMedicalInstitutions: () => HealthMedicalInstitution[];
}

// API応答をフロントエンド型に変換
const mapCheckupType = (item: HealthCheckupType): HealthCheckupType => ({
  ...item,
  createdAt: new Date(item.createdAt),
  updatedAt: new Date(item.updatedAt),
});

const mapMedicalInstitution = (item: HealthMedicalInstitution): HealthMedicalInstitution => ({
  ...item,
  createdAt: new Date(item.createdAt),
  updatedAt: new Date(item.updatedAt),
});

export const useHealthMasterStore = create<HealthMasterState>()((set, get) => ({
  checkupTypes: [],
  medicalInstitutions: [],
  tenantId: null,
  isLoading: false,
  error: null,

  setTenantId: (tenantId) => {
    set({ tenantId });
  },

  fetchAll: async () => {
    const { fetchCheckupTypes, fetchMedicalInstitutions } = get();
    await Promise.all([fetchCheckupTypes(), fetchMedicalInstitutions()]);
  },

  // ==================== 健診種別操作 ====================

  fetchCheckupTypes: async () => {
    const { tenantId } = get();
    if (!tenantId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/health/master/checkup-types?tenantId=${tenantId}`);
      if (!res.ok) throw new Error('健診種別の取得に失敗しました');
      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.data || []);
      set({ checkupTypes: data.map(mapCheckupType), isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addCheckupType: async (data) => {
    const { tenantId, fetchCheckupTypes } = get();
    if (!tenantId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/health/master/checkup-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...data }),
      });
      if (!res.ok) throw new Error('健診種別の追加に失敗しました');
      await fetchCheckupTypes();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateCheckupType: async (id, data) => {
    const { fetchCheckupTypes } = get();

    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/health/master/checkup-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error('健診種別の更新に失敗しました');
      await fetchCheckupTypes();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteCheckupType: async (id) => {
    const { fetchCheckupTypes } = get();

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/health/master/checkup-types?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('健診種別の削除に失敗しました');
      await fetchCheckupTypes();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // ==================== 医療機関操作 ====================

  fetchMedicalInstitutions: async () => {
    const { tenantId } = get();
    if (!tenantId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/health/master/institutions?tenantId=${tenantId}`);
      if (!res.ok) throw new Error('医療機関の取得に失敗しました');
      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.data || []);
      set({ medicalInstitutions: data.map(mapMedicalInstitution), isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addMedicalInstitution: async (data) => {
    const { tenantId, fetchMedicalInstitutions } = get();
    if (!tenantId) return undefined;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/health/master/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...data }),
      });
      if (!res.ok) throw new Error('医療機関の追加に失敗しました');
      const created = await res.json();
      await fetchMedicalInstitutions();
      return created as HealthMedicalInstitution;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return undefined;
    }
  },

  updateMedicalInstitution: async (id, data) => {
    const { fetchMedicalInstitutions } = get();

    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/health/master/institutions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error('医療機関の更新に失敗しました');
      await fetchMedicalInstitutions();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteMedicalInstitution: async (id) => {
    const { fetchMedicalInstitutions } = get();

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/health/master/institutions?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('医療機関の削除に失敗しました');
      await fetchMedicalInstitutions();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // ==================== 検査項目料金操作 ====================

  fetchExamPrices: async (institutionId) => {
    try {
      const res = await fetch(`/api/health/master/institutions/${institutionId}/exam-prices`);
      if (!res.ok) throw new Error('検査項目料金の取得に失敗しました');
      const json = await res.json();
      return Array.isArray(json) ? json : (json.data || []);
    } catch (error) {
      set({ error: (error as Error).message });
      return [];
    }
  },

  addExamPrice: async (institutionId, data) => {
    const { tenantId } = get();
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/health/master/institutions/${institutionId}/exam-prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, institutionId, ...data }),
      });
      if (!res.ok) throw new Error('検査項目料金の追加に失敗しました');
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateExamPrice: async (id, data) => {
    try {
      const res = await fetch(`/api/health/master/institutions/_/exam-prices`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error('検査項目料金の更新に失敗しました');
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteExamPrice: async (id) => {
    try {
      const res = await fetch(`/api/health/master/institutions/_/exam-prices?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('検査項目料金の削除に失敗しました');
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // ==================== オプション検査操作 ====================

  fetchOptions: async (institutionId) => {
    try {
      const res = await fetch(`/api/health/master/institutions/${institutionId}/options`);
      if (!res.ok) throw new Error('オプション検査の取得に失敗しました');
      const json = await res.json();
      return Array.isArray(json) ? json : (json.data || []);
    } catch (error) {
      set({ error: (error as Error).message });
      return [];
    }
  },

  addOption: async (institutionId, data) => {
    const { tenantId } = get();
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/health/master/institutions/${institutionId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, institutionId, ...data }),
      });
      if (!res.ok) throw new Error('オプション検査の追加に失敗しました');
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateOption: async (id, data) => {
    try {
      const res = await fetch(`/api/health/master/institutions/_/options`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error('オプション検査の更新に失敗しました');
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteOption: async (id) => {
    try {
      const res = await fetch(`/api/health/master/institutions/_/options?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('オプション検査の削除に失敗しました');
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // ==================== ヘルパー ====================

  getActiveCheckupTypes: () => {
    return get()
      .checkupTypes.filter((t) => t.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getActiveMedicalInstitutions: () => {
    return get()
      .medicalInstitutions.filter((i) => i.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
}));
