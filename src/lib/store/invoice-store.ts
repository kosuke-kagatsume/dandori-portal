/**
 * 請求書管理ストア
 *
 * テナントの請求書履歴を管理
 * 実APIに接続してデータを取得・操作
 */

import { create } from 'zustand';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  period?: string;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  tenantSubdomain?: string | null;
  billingMonth: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidDate?: string | null;
  sentDate?: string | null;
  issueDate?: string | null;
  billingEmail?: string;
  memo?: string;
  paymentMethod?: 'bank_transfer' | 'credit_card' | 'invoice' | 'other';
  items?: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

interface InvoiceSummary {
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  overdueCount: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface InvoiceStore {
  // データ
  invoices: InvoiceData[];
  summary: InvoiceSummary;
  pagination: PaginationInfo;

  // 状態
  isLoading: boolean;
  error: string | null;

  // フィルター
  statusFilter: string | null;
  tenantFilter: string | null;

  // API操作
  fetchInvoices: (options?: {
    status?: string;
    tenantId?: string;
    year?: number;
    month?: number;
    page?: number;
    limit?: number;
  }) => Promise<void>;

  createInvoice: (data: {
    tenantId: string;
    subtotal: number;
    tax?: number;
    billingMonth?: string;
    dueDate?: string;
    billingEmail: string;
    memo?: string;
  }) => Promise<InvoiceData | null>;

  updateInvoice: (id: string, updates: Partial<InvoiceData>) => Promise<boolean>;
  deleteInvoice: (id: string) => Promise<boolean>;

  // ステータス更新
  markAsSent: (id: string) => Promise<boolean>;
  markAsPaid: (id: string, paidDate: string, paymentMethod?: string) => Promise<boolean>;

  // ローカル状態操作
  setStatusFilter: (status: string | null) => void;
  setTenantFilter: (tenantId: string | null) => void;

  // クエリ（ローカルキャッシュから）
  getInvoiceById: (id: string) => InvoiceData | undefined;
  getInvoicesByTenant: (tenantId: string) => InvoiceData[];
  getInvoicesByStatus: (status: string) => InvoiceData[];
  getAllInvoices: () => InvoiceData[];

  // 統計
  getStats: (tenantId?: string) => {
    totalInvoices: number;
    totalAmount: number;
    unpaidAmount: number;
    overdueCount: number;
    paidAmount: number;
    paidCount: number;
  };

  // 初期化
  initializeInvoices: () => Promise<void>;
}

const initialSummary: InvoiceSummary = {
  totalAmount: 0,
  paidAmount: 0,
  unpaidAmount: 0,
  overdueCount: 0,
};

const initialState = {
  invoices: [],
  summary: initialSummary,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  isLoading: false,
  error: null,
  statusFilter: null,
  tenantFilter: null,
};

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
  ...initialState,

  fetchInvoices: async (options = {}) => {
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      if (options.status) params.set('status', options.status);
      if (options.tenantId) params.set('tenantId', options.tenantId);
      if (options.year) params.set('year', String(options.year));
      if (options.month) params.set('month', String(options.month));
      if (options.page) params.set('page', String(options.page));
      if (options.limit) params.set('limit', String(options.limit));

      const response = await fetch(`/api/dw-admin/invoices?${params.toString()}`);
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || '請求書一覧の取得に失敗しました');
      }

      set({
        invoices: json.data.invoices,
        summary: json.data.summary,
        pagination: json.data.pagination,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '不明なエラー',
      });
    }
  },

  createInvoice: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/dw-admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || '請求書の作成に失敗しました');
      }

      // 一覧を再取得
      await get().fetchInvoices();

      set({ isLoading: false });
      return json.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '不明なエラー',
      });
      return null;
    }
  },

  updateInvoice: async (id, updates) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/dw-admin/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || '請求書の更新に失敗しました');
      }

      // ローカルキャッシュを更新
      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === id ? { ...inv, ...json.data } : inv
        ),
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Error updating invoice:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '不明なエラー',
      });
      return false;
    }
  },

  deleteInvoice: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/dw-admin/invoices/${id}`, {
        method: 'DELETE',
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || '請求書の削除に失敗しました');
      }

      // ローカルキャッシュから削除
      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '不明なエラー',
      });
      return false;
    }
  },

  markAsSent: async (id) => {
    return get().updateInvoice(id, { status: 'sent', sentDate: new Date().toISOString() });
  },

  markAsPaid: async (id, paidDate) => {
    return get().updateInvoice(id, { status: 'paid', paidDate });
  },

  setStatusFilter: (status) => {
    set({ statusFilter: status });
    get().fetchInvoices({ status: status || undefined });
  },

  setTenantFilter: (tenantId) => {
    set({ tenantFilter: tenantId });
    get().fetchInvoices({ tenantId: tenantId || undefined });
  },

  getInvoiceById: (id) => {
    return get().invoices.find((inv) => inv.id === id);
  },

  getInvoicesByTenant: (tenantId) => {
    return get().invoices.filter((inv) => inv.tenantId === tenantId);
  },

  getInvoicesByStatus: (status) => {
    return get().invoices.filter((inv) => inv.status === status);
  },

  getAllInvoices: () => {
    return get().invoices;
  },

  getStats: (tenantId) => {
    const { invoices, summary } = get();
    const filtered = tenantId
      ? invoices.filter((inv) => inv.tenantId === tenantId)
      : invoices;

    // ローカルデータから計算
    const localTotalAmount = filtered.reduce((sum, inv) => sum + inv.total, 0);
    const localPaidAmount = filtered
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    const localUnpaidAmount = filtered
      .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + inv.total, 0);
    const localOverdueCount = filtered.filter((inv) => inv.status === 'overdue').length;
    const localPaidCount = filtered.filter((inv) => inv.status === 'paid').length;

    return {
      totalInvoices: filtered.length,
      totalAmount: summary.totalAmount || localTotalAmount,
      unpaidAmount: summary.unpaidAmount || localUnpaidAmount,
      overdueCount: summary.overdueCount || localOverdueCount,
      paidAmount: summary.paidAmount || localPaidAmount,
      paidCount: localPaidCount,
    };
  },

  initializeInvoices: async () => {
    // 初回のみフェッチ
    if (get().invoices.length === 0) {
      await get().fetchInvoices();
    }
  },
}));
