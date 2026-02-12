import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';
import type { WithholdingSlipData } from '@/types/pdf';
import { generateWithholdingSlipPDF } from '@/lib/pdf/payroll-pdf';
import { toast } from 'sonner';

/**
 * 退職者への年末調整送信履歴
 */
export interface RetiredYearEndSendHistory {
  id: string;
  userId: string;
  userName: string;
  email: string;
  year: number;
  sentAt: string; // ISO 8601形式
  status: 'success' | 'failed';
  errorMessage?: string;
  pdfGenerated: boolean;
}

interface RetiredYearEndState {
  sendHistories: RetiredYearEndSendHistory[];

  // 送信履歴の追加
  addSendHistory: (history: RetiredYearEndSendHistory) => void;

  // 退職者への源泉徴収票一括送信（シミュレーション）
  sendWithholdingSlipsToRetired: (retiredUsers: User[], year: number) => Promise<void>;

  // 個別送信
  sendWithholdingSlipToUser: (user: User, year: number) => Promise<void>;

  // 送信履歴取得
  getSendHistoriesByYear: (year: number) => RetiredYearEndSendHistory[];
  getSendHistoriesByUser: (userId: string) => RetiredYearEndSendHistory[];
  getRecentSendHistories: (limit?: number) => RetiredYearEndSendHistory[];

  // 送信済みかチェック
  isAlreadySent: (userId: string, year: number) => boolean;

  // 統計
  getStats: (year?: number) => {
    totalSent: number;
    successCount: number;
    failedCount: number;
  };
}

/**
 * 退職者の源泉徴収票データを生成
 */
const generateWithholdingDataForRetired = (user: User, year: number): WithholdingSlipData => {
  // 実際の実装では、payroll-storeから給与データを取得して計算する
  // ここではダミーデータを生成
  const totalIncome = 4000000; // 年間総収入（400万円）
  const employmentIncome = 3720000; // 給与所得控除後の金額
  const socialInsurance = 580000; // 社会保険料控除
  const basicDeduction = 480000; // 基礎控除
  const taxableIncome = employmentIncome - socialInsurance - basicDeduction; // 課税所得
  const incomeTax = Math.floor(taxableIncome * 0.1); // 所得税（簡易計算）
  const specialTax = Math.floor(taxableIncome * 0.06); // 住民税（簡易計算）

  return {
    year,
    employeeId: user.id,
    employeeName: user.name,
    address: '東京都渋谷区xxx-xxx', // 実際は user.address から取得
    totalIncome,
    employmentIncome,
    taxableIncome,
    deductions: {
      socialInsurance,
      basic: basicDeduction,
      dependent: 0,
      spouse: 0,
      lifeInsurance: 0,
    },
    totalDeductions: socialInsurance + basicDeduction,
    incomeTax,
    specialTax,
    companyName: 'ダンドリ株式会社',
    companyAddress: '東京都渋谷区xxx-xxx',
    representativeName: '代表取締役 山田太郎',
  };
};

/**
 * メール送信シミュレーション
 * 実際の実装では、バックエンドAPIを呼び出してメール送信を行う
 */
const simulateEmailSend = async (
  to: string,
  subject: string,
  pdfBlob: Blob
): Promise<{ success: boolean; error?: string }> => {
  // ランダムに成功/失敗を返す（実際の実装では不要）
  await new Promise(resolve => setTimeout(resolve, 500)); // 500ms待機

  const success = Math.random() > 0.1; // 90%の確率で成功

  if (success) {
    console.log(`[Simulated] Email sent to ${to}`);
    console.log(`[Simulated] Subject: ${subject}`);
    console.log(`[Simulated] PDF size: ${pdfBlob.size} bytes`);
    return { success: true };
  } else {
    return {
      success: false,
      error: 'メールサーバーへの接続に失敗しました',
    };
  }
};

// SSR対応: サーバーではpersistを無効化
const createRetiredYearEndStore = () => {
  const storeCreator = (
    set: (partial: Partial<RetiredYearEndState> | ((state: RetiredYearEndState) => Partial<RetiredYearEndState>)) => void,
    get: () => RetiredYearEndState
  ): RetiredYearEndState => ({
    sendHistories: [],

    addSendHistory: (history) => {
      set((state) => ({
        sendHistories: [history, ...state.sendHistories],
      }));
    },

    sendWithholdingSlipsToRetired: async (retiredUsers, year) => {
      const { isAlreadySent, sendWithholdingSlipToUser } = get();

      // フィルター: 送信済みを除外
      const unsentUsers = retiredUsers.filter(user => !isAlreadySent(user.id, year));

      if (unsentUsers.length === 0) {
        toast.info('送信対象の退職者がいません', {
          description: 'すべての退職者に既に送信済みです',
        });
        return;
      }

      toast.info(`${unsentUsers.length}名に送信を開始します...`, {
        duration: 2000,
      });

      let successCount = 0;
      let failedCount = 0;

      // 順次送信（並列処理にすることも可能）
      for (const user of unsentUsers) {
        try {
          await sendWithholdingSlipToUser(user, year);
          successCount++;
        } catch (error) {
          failedCount++;
          console.error(`Failed to send to ${user.name}:`, error);
        }
      }

      toast.success('送信完了', {
        description: `成功: ${successCount}名、失敗: ${failedCount}名`,
        duration: 5000,
      });
    },

    sendWithholdingSlipToUser: async (user, year) => {
      const { addSendHistory } = get();

      try {
        // 1. 源泉徴収票データを生成
        const withholdingData = generateWithholdingDataForRetired(user, year);

        // 2. PDF生成
        const pdfDoc = await generateWithholdingSlipPDF(withholdingData);
        const pdfBlob = pdfDoc.output('blob');

        // 3. メール送信シミュレーション
        const result = await simulateEmailSend(
          user.email,
          `【重要】${year}年分 源泉徴収票のお知らせ`,
          pdfBlob
        );

        // 4. 送信履歴を記録
        const history: RetiredYearEndSendHistory = {
          id: `history-${Date.now()}-${user.id}`,
          userId: user.id,
          userName: user.name,
          email: user.email,
          year,
          sentAt: new Date().toISOString(),
          status: result.success ? 'success' : 'failed',
          errorMessage: result.error,
          pdfGenerated: true,
        };

        addSendHistory(history);

        if (!result.success) {
          throw new Error(result.error || '送信に失敗しました');
        }
      } catch (error) {
        console.error('Failed to send withholding slip:', error);

        // エラー履歴を記録
        const errorHistory: RetiredYearEndSendHistory = {
          id: `history-${Date.now()}-${user.id}`,
          userId: user.id,
          userName: user.name,
          email: user.email,
          year,
          sentAt: new Date().toISOString(),
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : '不明なエラー',
          pdfGenerated: false,
        };

        addSendHistory(errorHistory);
        throw error;
      }
    },

    getSendHistoriesByYear: (year) => {
      return get().sendHistories.filter(h => h.year === year);
    },

    getSendHistoriesByUser: (userId) => {
      return get().sendHistories
        .filter(h => h.userId === userId)
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    },

    getRecentSendHistories: (limit = 20) => {
      return get().sendHistories
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
        .slice(0, limit);
    },

    isAlreadySent: (userId, year) => {
      return get().sendHistories.some(
        h => h.userId === userId && h.year === year && h.status === 'success'
      );
    },

    getStats: (year) => {
      const histories = year
        ? get().sendHistories.filter(h => h.year === year)
        : get().sendHistories;

      return {
        totalSent: histories.length,
        successCount: histories.filter(h => h.status === 'success').length,
        failedCount: histories.filter(h => h.status === 'failed').length,
      };
    },
  });

  // SSR時はpersistを使わない
  if (typeof window === 'undefined') {
    return create<RetiredYearEndState>()(storeCreator);
  }

  // クライアントサイドではpersistを使用
  return create<RetiredYearEndState>()(
    persist(storeCreator, {
      name: 'retired-yearend-storage',
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sendHistories: state.sendHistories,
      }),
    })
  );
};

export const useRetiredYearEndStore = createRetiredYearEndStore();
