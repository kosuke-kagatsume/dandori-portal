/**
 * 請求書管理ストア
 *
 * テナントの請求書履歴を管理します
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InvoiceData } from '@/lib/billing/invoice-generator';
import { generateInvoice } from '@/lib/billing/invoice-generator';
import { useNotificationHistoryStore } from './notification-history-store';

interface InvoiceStore {
  invoices: InvoiceData[];

  // CRUD操作
  getInvoiceById: (id: string) => InvoiceData | undefined;
  getInvoicesByTenant: (tenantId: string) => InvoiceData[];
  getInvoicesByStatus: (status: 'draft' | 'sent' | 'paid' | 'overdue') => InvoiceData[];
  getAllInvoices: () => InvoiceData[];
  createInvoice: (invoice: Omit<InvoiceData, 'id'>) => InvoiceData;
  updateInvoice: (id: string, updates: Partial<InvoiceData>) => void;
  deleteInvoice: (id: string) => void;

  // ステータス更新
  markAsSent: (id: string) => void;
  markAsPaid: (
    id: string,
    paidDate: Date,
    paymentMethod?: 'bank_transfer' | 'credit_card' | 'invoice' | 'other'
  ) => void;

  // 統計
  getStats: (tenantId?: string) => {
    totalInvoices: number;
    totalAmount: number;
    unpaidAmount: number;
    overdueCount: number;
  };

  // 初期化
  initializeInvoices: () => void;
}

// デモ請求書データ（過去6ヶ月分）
const generateDemoInvoices = (): InvoiceData[] => {
  const invoices: InvoiceData[] = [];
  const today = new Date();

  // テナント1（デモ株式会社）の請求書
  for (let i = 0; i < 6; i++) {
    const billingMonth = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = billingMonth.getFullYear();
    const month = billingMonth.getMonth() + 1;

    // ユーザー数を徐々に増やす（30→35→40→45→49→49）
    const userCount = Math.min(30 + (5 - i) * 5, 49);

    const invoice = generateInvoice({
      tenantId: 'tenant_001',
      tenantName: 'デモ株式会社',
      billingMonth,
      userCount,
      existingInvoices: invoices,
      billingEmail: 'billing@demo.com',
      memo: i === 0 ? '最新の請求書です。' : undefined,
    });

    // ステータスを設定
    let status: 'draft' | 'sent' | 'paid' = 'draft';
    let sentDate: Date | undefined;
    let paidDate: Date | undefined;

    if (i >= 2) {
      // 2ヶ月以上前は支払済み
      status = 'paid';
      sentDate = new Date(year, month - 1, 5); // 月初5日に送信
      paidDate = new Date(year, month - 1, 20); // 月の20日に支払い
    } else if (i === 1) {
      // 1ヶ月前は送信済み
      status = 'sent';
      sentDate = new Date(year, month - 1, 5);
    }
    // 当月は下書き

    invoices.push({
      ...invoice,
      id: `invoice_${String(invoices.length + 1).padStart(3, '0')}`,
      status,
      sentDate,
      paidDate,
    });
  }

  return invoices;
};

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      invoices: [],

      getInvoiceById: (id) => {
        return get().invoices.find((inv) => inv.id === id);
      },

      getInvoicesByTenant: (tenantId) => {
        return get().invoices
          .filter((inv) => inv.tenantId === tenantId)
          .sort((a, b) => {
            const dateA = new Date(a.billingMonth);
            const dateB = new Date(b.billingMonth);
            return dateB.getTime() - dateA.getTime();
          });
      },

      getInvoicesByStatus: (status) => {
        const invoices = get().invoices;
        const today = new Date();

        return invoices.filter((inv) => {
          if (status === 'overdue') {
            const dueDate = new Date(inv.dueDate);
            return inv.status !== 'paid' && dueDate < today;
          }
          return inv.status === status;
        });
      },

      getAllInvoices: () => {
        return get().invoices.sort((a, b) => {
          const dateA = new Date(a.billingMonth);
          const dateB = new Date(b.billingMonth);
          return dateB.getTime() - dateA.getTime();
        });
      },

      createInvoice: (invoice) => {
        const newInvoice: InvoiceData = {
          ...invoice,
          id: `invoice_${String(get().invoices.length + 1).padStart(3, '0')}`,
        };

        set((state) => ({
          invoices: [...state.invoices, newInvoice],
        }));

        return newInvoice;
      },

      updateInvoice: (id, updates) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, ...updates } : inv
          ),
        }));
      },

      deleteInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
        }));
      },

      markAsSent: (id) => {
        const invoice = get().invoices.find((inv) => inv.id === id);
        if (!invoice) return;

        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? { ...inv, status: 'sent' as const, sentDate: new Date() }
              : inv
          ),
        }));

        // 通知を送信
        const notificationStore = useNotificationHistoryStore.getState();
        notificationStore.addNotification({
          type: 'invoice_sent',
          tenantId: invoice.tenantId,
          tenantName: invoice.tenantName,
          recipientEmail: invoice.billingEmail || 'billing@example.com',
          subject: `【請求書発行】${invoice.invoiceNumber}`,
          status: 'sent',
          invoiceNumber: invoice.invoiceNumber,
        });
      },

      markAsPaid: (id, paidDate, paymentMethod) => {
        const invoice = get().invoices.find((inv) => inv.id === id);
        if (!invoice) return;

        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? {
                  ...inv,
                  status: 'paid' as const,
                  paidDate,
                  paymentMethod: paymentMethod || inv.paymentMethod,
                }
              : inv
          ),
        }));

        // 通知を送信
        const notificationStore = useNotificationHistoryStore.getState();
        notificationStore.addNotification({
          type: 'payment_received',
          tenantId: invoice.tenantId,
          tenantName: invoice.tenantName,
          recipientEmail: invoice.billingEmail || 'billing@example.com',
          subject: `【入金確認】${invoice.invoiceNumber} - ご入金ありがとうございました`,
          status: 'sent',
          invoiceNumber: invoice.invoiceNumber,
        });
      },

      getStats: (tenantId) => {
        const invoices = tenantId
          ? get().invoices.filter((inv) => inv.tenantId === tenantId)
          : get().invoices;

        const today = new Date();

        return {
          totalInvoices: invoices.length,
          totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
          unpaidAmount: invoices
            .filter((inv) => inv.status !== 'paid')
            .reduce((sum, inv) => sum + inv.total, 0),
          overdueCount: invoices.filter(
            (inv) => inv.status !== 'paid' && new Date(inv.dueDate) < today
          ).length,
        };
      },

      initializeInvoices: () => {
        const existingInvoices = get().invoices;
        if (existingInvoices.length === 0) {
          set({ invoices: generateDemoInvoices() });
        }
      },
    }),
    {
      name: 'invoice-storage',
      // Date オブジェクトを復元するための設定
      partialize: (state) => ({
        invoices: state.invoices,
      }),
    }
  )
);
