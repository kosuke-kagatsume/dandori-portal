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
import { throwIfNotOk, unwrapData } from '@/lib/api/client-fetch';

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
      await throwIfNotOk(res, '健診種別の取得に失敗しました');
      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.data || []);
      set({ checkupTypes: data.map(mapCheckupType), isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
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
      await throwIfNotOk(res, '健診種別の追加に失敗しました');
      await fetchCheckupTypes();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
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
      await throwIfNotOk(res, '健診種別の更新に失敗しました');
      await fetchCheckupTypes();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteCheckupType: async (id) => {
    const { fetchCheckupTypes } = get();

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/health/master/checkup-types?id=${id}`, {
        method: 'DELETE',
      });
      await throwIfNotOk(res, '健診種別の削除に失敗しました');
      await fetchCheckupTypes();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  // ==================== 医療機関操作 ====================

  fetchMedicalInstitutions: async () => {
    const { tenantId } = get();
    if (!tenantId) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/health/master/institutions?tenantId=${tenantId}`);
      await throwIfNotOk(res, '医療機関の取得に失敗しました');
      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.data || []);
      set({ medicalInstitutions: data.map(mapMedicalInstitution), isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
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
      await throwIfNotOk(res, '医療機関の追加に失敗しました');
      const created = await unwrapData<HealthMedicalInstitution>(res);
      await fetchMedicalInstitutions();
      return created;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
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
      await throwIfNotOk(res, '医療機関の更新に失敗しました');
      await fetchMedicalInstitutions();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteMedicalInstitution: async (id) => {
    const { fetchMedicalInstitutions } = get();

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/health/master/institutions?id=${id}`, {
        method: 'DELETE',
      });
      await throwIfNotOk(res, '医療機関の削除に失敗しました');
      await fetchMedicalInstitutions();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  // ==================== 検査項目料金操作 ====================

  fetchExamPrices: async (institutionId) => {
    try {
      const res = await fetch(`/api/health/master/institutions/${institutionId}/exam-prices`);
      await throwIfNotOk(res, '検査項目料金の取得に失敗しました');
      const json = await res.json();
      return Array.isArray(json) ? json : (json.data || []);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
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
      await throwIfNotOk(res, '検査項目料金の追加に失敗しました');
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateExamPrice: async (id, data) => {
    try {
      const res = await fetch(`/api/health/master/institutions/_/exam-prices`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      await throwIfNotOk(res, '検査項目料金の更新に失敗しました');
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteExamPrice: async (id) => {
    try {
      const res = await fetch(`/api/health/master/institutions/_/exam-prices?id=${id}`, {
        method: 'DELETE',
      });
      await throwIfNotOk(res, '検査項目料金の削除に失敗しました');
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // ==================== オプション検査操作 ====================

  fetchOptions: async (institutionId) => {
    try {
      const res = await fetch(`/api/health/master/institutions/${institutionId}/options`);
      await throwIfNotOk(res, 'オプション検査の取得に失敗しました');
      const json = await res.json();
      return Array.isArray(json) ? json : (json.data || []);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
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
      await throwIfNotOk(res, 'オプション検査の追加に失敗しました');
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateOption: async (id, data) => {
    try {
      const res = await fetch(`/api/health/master/institutions/_/options`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      await throwIfNotOk(res, 'オプション検査の更新に失敗しました');
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteOption: async (id) => {
    try {
      const res = await fetch(`/api/health/master/institutions/_/options?id=${id}`, {
        method: 'DELETE',
      });
      await throwIfNotOk(res, 'オプション検査の削除に失敗しました');
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
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
