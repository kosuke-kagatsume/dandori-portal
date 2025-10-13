/**
 * PDF一括生成ユーティリティ
 * 複数のPDFを効率的に生成するためのバッチ処理機能
 */

import { jsPDF } from 'jspdf';
import type { PayrollData, BonusData, WithholdingSlipData } from '@/types/pdf';
import { generatePayrollPDF, generateBonusPDF, generateWithholdingSlipPDF } from './payroll-pdf';
import { fontLoader } from './font-loader';

/**
 * バッチ処理の進捗情報
 */
export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  currentIndex: number;
  percentage: number;
}

/**
 * バッチ処理の結果
 */
export interface BatchResult<T> {
  success: boolean;
  results: Array<{
    data: T;
    pdf?: jsPDF;
    error?: string;
  }>;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    duration: number;
  };
}

/**
 * バッチ処理のオプション
 */
export interface BatchOptions {
  /**
   * 並列処理数（デフォルト: 3）
   * 多すぎるとメモリを圧迫するため、3-5が推奨
   */
  concurrency?: number;

  /**
   * 進捗コールバック
   */
  onProgress?: (progress: BatchProgress) => void;

  /**
   * 各PDF生成完了時のコールバック
   */
  onItemComplete?: (index: number, success: boolean) => void;
}

/**
 * 給与明細PDFを一括生成
 */
export async function batchGeneratePayrollPDFs(
  payrolls: PayrollData[],
  options: BatchOptions = {}
): Promise<BatchResult<PayrollData>> {
  const startTime = performance.now();
  const { concurrency = 3, onProgress, onItemComplete } = options;

  // フォントを事前にプリロード
  await fontLoader.preloadFont();

  const results: BatchResult<PayrollData>['results'] = [];
  let completed = 0;
  let failed = 0;

  // 並列処理用のチャンク分割
  for (let i = 0; i < payrolls.length; i += concurrency) {
    const chunk = payrolls.slice(i, i + concurrency);

    // チャンクを並列処理
    const chunkResults = await Promise.allSettled(
      chunk.map(async (payroll, chunkIndex) => {
        const actualIndex = i + chunkIndex;
        try {
          const pdf = await generatePayrollPDF(payroll);
          return { data: payroll, pdf };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '不明なエラー';
          return { data: payroll, error: errorMessage };
        }
      })
    );

    // 結果を集計
    chunkResults.forEach((result, chunkIndex) => {
      const actualIndex = i + chunkIndex;
      const isSuccess = result.status === 'fulfilled' && !result.value.error;

      if (isSuccess) {
        completed++;
      } else {
        failed++;
      }

      results.push(
        result.status === 'fulfilled'
          ? result.value
          : { data: payrolls[actualIndex], error: 'Promise rejected' }
      );

      onItemComplete?.(actualIndex, isSuccess);
    });

    // 進捗を通知
    onProgress?.({
      total: payrolls.length,
      completed,
      failed,
      currentIndex: i + chunk.length,
      percentage: Math.round(((completed + failed) / payrolls.length) * 100),
    });
  }

  const duration = Math.round(performance.now() - startTime);

  return {
    success: failed === 0,
    results,
    summary: {
      total: payrolls.length,
      succeeded: completed,
      failed,
      duration,
    },
  };
}

/**
 * 賞与明細PDFを一括生成
 */
export async function batchGenerateBonusPDFs(
  bonuses: BonusData[],
  options: BatchOptions = {}
): Promise<BatchResult<BonusData>> {
  const startTime = performance.now();
  const { concurrency = 3, onProgress, onItemComplete } = options;

  await fontLoader.preloadFont();

  const results: BatchResult<BonusData>['results'] = [];
  let completed = 0;
  let failed = 0;

  for (let i = 0; i < bonuses.length; i += concurrency) {
    const chunk = bonuses.slice(i, i + concurrency);

    const chunkResults = await Promise.allSettled(
      chunk.map(async (bonus, chunkIndex) => {
        const actualIndex = i + chunkIndex;
        try {
          const pdf = await generateBonusPDF(bonus);
          return { data: bonus, pdf };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '不明なエラー';
          return { data: bonus, error: errorMessage };
        }
      })
    );

    chunkResults.forEach((result, chunkIndex) => {
      const actualIndex = i + chunkIndex;
      const isSuccess = result.status === 'fulfilled' && !result.value.error;

      if (isSuccess) {
        completed++;
      } else {
        failed++;
      }

      results.push(
        result.status === 'fulfilled'
          ? result.value
          : { data: bonuses[actualIndex], error: 'Promise rejected' }
      );

      onItemComplete?.(actualIndex, isSuccess);
    });

    onProgress?.({
      total: bonuses.length,
      completed,
      failed,
      currentIndex: i + chunk.length,
      percentage: Math.round(((completed + failed) / bonuses.length) * 100),
    });
  }

  const duration = Math.round(performance.now() - startTime);

  return {
    success: failed === 0,
    results,
    summary: {
      total: bonuses.length,
      succeeded: completed,
      failed,
      duration,
    },
  };
}

/**
 * 源泉徴収票PDFを一括生成
 */
export async function batchGenerateWithholdingSlipPDFs(
  slips: WithholdingSlipData[],
  options: BatchOptions = {}
): Promise<BatchResult<WithholdingSlipData>> {
  const startTime = performance.now();
  const { concurrency = 3, onProgress, onItemComplete } = options;

  await fontLoader.preloadFont();

  const results: BatchResult<WithholdingSlipData>['results'] = [];
  let completed = 0;
  let failed = 0;

  for (let i = 0; i < slips.length; i += concurrency) {
    const chunk = slips.slice(i, i + concurrency);

    const chunkResults = await Promise.allSettled(
      chunk.map(async (slip, chunkIndex) => {
        const actualIndex = i + chunkIndex;
        try {
          const pdf = await generateWithholdingSlipPDF(slip);
          return { data: slip, pdf };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '不明なエラー';
          return { data: slip, error: errorMessage };
        }
      })
    );

    chunkResults.forEach((result, chunkIndex) => {
      const actualIndex = i + chunkIndex;
      const isSuccess = result.status === 'fulfilled' && !result.value.error;

      if (isSuccess) {
        completed++;
      } else {
        failed++;
      }

      results.push(
        result.status === 'fulfilled'
          ? result.value
          : { data: slips[actualIndex], error: 'Promise rejected' }
      );

      onItemComplete?.(actualIndex, isSuccess);
    });

    onProgress?.({
      total: slips.length,
      completed,
      failed,
      currentIndex: i + chunk.length,
      percentage: Math.round(((completed + failed) / slips.length) * 100),
    });
  }

  const duration = Math.round(performance.now() - startTime);

  return {
    success: failed === 0,
    results,
    summary: {
      total: slips.length,
      succeeded: completed,
      failed,
      duration,
    },
  };
}

/**
 * ZIPファイルとしてバッチダウンロード
 * 注意: ブラウザAPIのみ使用（Node.jsでは動作しない）
 */
export async function downloadPDFsAsZip(
  pdfs: Array<{ pdf: jsPDF; filename: string }>,
  zipFilename: string = 'documents.zip'
): Promise<void> {
  // 動的にJSZipをインポート
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // 各PDFをZIPに追加
  pdfs.forEach(({ pdf, filename }) => {
    const pdfBlob = pdf.output('blob');
    zip.file(filename, pdfBlob);
  });

  // ZIPを生成してダウンロード
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
