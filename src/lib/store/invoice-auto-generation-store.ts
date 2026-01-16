/**
 * 請求書自動生成管理ストア
 *
 * 機能:
 * - 月次自動生成設定
 * - 一括請求書生成
 * - 生成履歴管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useInvoiceStore } from './invoice-store';
import { useAdminTenantStore } from './admin-tenant-store';
import { generateInvoice } from '@/lib/billing/invoice-generator';

// ============================================================================
// TYPES
// ============================================================================

export interface AutoGenerationSettings {
  enabled: boolean;
  dayOfMonth: number; // 毎月何日に実行するか（1-28）
  basePricePerUser: number; // ユーザーあたりの基本料金
}

export interface GenerationHistory {
  id: string;
  executedAt: Date;
  executionType: 'manual' | 'auto';
  tenantCount: number;
  successCount: number;
  failureCount: number;
  totalAmount: number;
  details: GenerationDetail[];
}

export interface GenerationDetail {
  tenantId: string;
  tenantName: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  userCount: number;
  status: 'success' | 'failed';
  errorMessage?: string;
}

interface InvoiceAutoGenerationStore {
  // 設定
  settings: AutoGenerationSettings;
  updateSettings: (settings: Partial<AutoGenerationSettings>) => void;

  // 生成履歴
  history: GenerationHistory[];
  addHistory: (history: Omit<GenerationHistory, 'id' | 'executedAt'>) => void;
  getHistoryById: (id: string) => GenerationHistory | undefined;

  // 一括生成
  generateInvoicesForAllTenants: (executionType: 'manual' | 'auto') => GenerationHistory;

  // 統計
  getStats: () => {
    totalExecutions: number;
    totalInvoicesGenerated: number;
    totalRevenue: number;
    lastExecutionDate?: Date;
  };

  // 初期化
  initializeStore: () => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useInvoiceAutoGenerationStore = create<InvoiceAutoGenerationStore>()(
  persist(
    (set, get) => ({
      // デフォルト設定
      settings: {
        enabled: true,
        dayOfMonth: 1, // 毎月1日
        basePricePerUser: 10000, // ユーザーあたり10,000円
      },

      history: [],

      // 設定更新
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        }));
      },

      // 履歴追加
      addHistory: (historyData) => {
        const id = `gen-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newHistory: GenerationHistory = {
          ...historyData,
          id,
          executedAt: new Date(),
        };

        set((state) => ({
          history: [newHistory, ...state.history],
        }));

        return newHistory;
      },

      // 履歴取得
      getHistoryById: (id) => {
        return get().history.find((h) => h.id === id);
      },

      // 一括請求書生成
      generateInvoicesForAllTenants: (executionType) => {
        const { addHistory } = get();
        const invoiceStore = useInvoiceStore.getState();
        const tenantStore = useAdminTenantStore.getState();

        const tenants = tenantStore.tenants.filter((t) => t.status === 'active');
        const details: GenerationDetail[] = [];
        let successCount = 0;
        let failureCount = 0;
        let totalAmount = 0;

        // 請求月を計算（当月）
        const today = new Date();
        const billingMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        tenants.forEach((tenant) => {
          try {
            // 既存の請求書を取得（請求書番号の採番のため）
            const existingInvoices = invoiceStore.getAllInvoices();

            // invoiceNumberが存在する請求書のみをフィルタリング
            const validInvoices = existingInvoices.filter(
              (inv) => inv.invoiceNumber && typeof inv.invoiceNumber === 'string'
            );

            // generateInvoice ヘルパーを使用して請求書データを生成
            const invoiceData = generateInvoice({
              tenantId: tenant.id,
              tenantName: tenant.name,
              billingMonth: billingMonth,
              userCount: tenant.currentUsers,
              existingInvoices: validInvoices,
              billingEmail: tenant.billingEmail,
              memo: `${tenant.plan.toUpperCase()}プラン - 自動生成`,
            });

            // 請求書作成
            const invoice = invoiceStore.createInvoice(invoiceData);

            // 生成された請求書が正常に作成されたか確認
            if (invoice && invoice.id) {
              details.push({
                tenantId: tenant.id,
                tenantName: tenant.name,
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                amount: invoice.total,
                userCount: tenant.currentUsers,
                status: 'success',
              });

              successCount++;
              totalAmount += invoice.total;
            } else {
              throw new Error('請求書の作成に失敗しました');
            }
          } catch (error) {
            details.push({
              tenantId: tenant.id,
              tenantName: tenant.name,
              invoiceId: '',
              invoiceNumber: '',
              amount: 0,
              userCount: tenant.currentUsers,
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : '不明なエラー',
            });

            failureCount++;
          }
        });

        // 履歴に追加
        const history = addHistory({
          executionType,
          tenantCount: tenants.length,
          successCount,
          failureCount,
          totalAmount,
          details,
        });

        return history;
      },

      // 統計取得
      getStats: () => {
        const { history } = get();

        const totalInvoicesGenerated = history.reduce((sum, h) => sum + h.successCount, 0);
        const totalRevenue = history.reduce((sum, h) => sum + h.totalAmount, 0);
        const lastExecutionDate = history.length > 0 ? history[0].executedAt : undefined;

        return {
          totalExecutions: history.length,
          totalInvoicesGenerated,
          totalRevenue,
          lastExecutionDate,
        };
      },

      // 初期化
      initializeStore: () => {
        // デフォルト設定のみ保持、履歴はクリーンスタート
        const currentSettings = get().settings;
        set({
          settings: currentSettings,
          history: [],
        });
      },
    }),
    {
      name: 'invoice-auto-generation-storage',
      version: 1,
    }
  )
);
