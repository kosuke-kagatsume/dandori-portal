#!/usr/bin/env npx ts-node

/**
 * DW管理バッチ実行スクリプト
 *
 * 使用方法:
 *   npx ts-node scripts/run-batch.ts <batch-name> [options]
 *
 * バッチ一覧:
 *   generate-invoices    - 請求書自動生成（月末実行）
 *   check-overdue        - 支払い期限チェック（毎日実行）
 *   cleanup-notifications - 通知クリーンアップ（週次実行）
 *   all                  - 全バッチ実行
 *
 * オプション:
 *   --dry-run           - 実行せずにプレビューのみ
 *   --month=YYYY-MM     - 請求書生成の対象月（generate-invoicesのみ）
 *
 * 環境変数:
 *   BATCH_API_KEY       - バッチAPI認証キー
 *   API_BASE_URL        - APIベースURL（デフォルト: http://localhost:3001）
 */

const BATCH_ENDPOINTS = {
  'generate-invoices': '/api/dw-admin/batch/generate-invoices',
  'check-overdue': '/api/dw-admin/batch/check-overdue',
  'cleanup-notifications': '/api/dw-admin/batch/cleanup-notifications',
};

type BatchName = keyof typeof BATCH_ENDPOINTS;

async function runBatch(
  batchName: BatchName,
  options: { dryRun?: boolean; month?: string }
): Promise<void> {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  const apiKey = process.env.BATCH_API_KEY || '';
  const endpoint = BATCH_ENDPOINTS[batchName];

  console.log(`\n========================================`);
  console.log(`バッチ実行: ${batchName}`);
  console.log(`時刻: ${new Date().toISOString()}`);
  console.log(`ドライラン: ${options.dryRun ? 'はい' : 'いいえ'}`);
  console.log(`========================================\n`);

  try {
    const body: Record<string, unknown> = {};

    if (options.dryRun) {
      body.dryRun = true;
    }

    if (batchName === 'generate-invoices' && options.month) {
      body.billingMonth = options.month;
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    console.log('結果:');
    console.log(JSON.stringify(result.data, null, 2));

    // サマリー表示
    if (batchName === 'generate-invoices' && result.data?.summary) {
      const s = result.data.summary;
      console.log('\n--- サマリー ---');
      console.log(`対象テナント: ${s.totalTenants}件`);
      console.log(`作成: ${s.created}件`);
      console.log(`スキップ: ${s.skipped}件`);
      console.log(`エラー: ${s.errors}件`);
      console.log(`総額: ¥${s.totalAmount.toLocaleString()}`);
    }

    if (batchName === 'check-overdue' && result.data) {
      const { overdue, upcoming } = result.data;
      console.log('\n--- サマリー ---');
      console.log(`期限超過: ${overdue.count}件（¥${overdue.totalAmount.toLocaleString()}）`);
      console.log(`期限間近: ${upcoming.count}件（¥${upcoming.totalAmount.toLocaleString()}）`);
    }

    if (batchName === 'cleanup-notifications' && result.data?.deleted) {
      const d = result.data.deleted;
      console.log('\n--- サマリー ---');
      console.log(`削除済み通知（既読）: ${d.readNotifications}件`);
      console.log(`削除済み通知（未読）: ${d.unreadNotifications}件`);
      console.log(`削除済みアクティビティ: ${d.activities}件`);
      console.log(`合計: ${d.total}件`);
    }

    console.log('\n✅ バッチ完了');
  } catch (error) {
    console.error('\n❌ バッチ失敗');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
使用方法: npx ts-node scripts/run-batch.ts <batch-name> [options]

バッチ一覧:
  generate-invoices     請求書自動生成（月末実行）
  check-overdue         支払い期限チェック（毎日実行）
  cleanup-notifications 通知クリーンアップ（週次実行）
  all                   全バッチ実行

オプション:
  --dry-run             実行せずにプレビューのみ
  --month=YYYY-MM       請求書生成の対象月

例:
  npx ts-node scripts/run-batch.ts generate-invoices --dry-run
  npx ts-node scripts/run-batch.ts generate-invoices --month=2024-11
  npx ts-node scripts/run-batch.ts check-overdue
  npx ts-node scripts/run-batch.ts all --dry-run
`);
    return;
  }

  const batchName = args[0];
  const dryRun = args.includes('--dry-run');
  const monthArg = args.find((a) => a.startsWith('--month='));
  const month = monthArg ? monthArg.split('=')[1] : undefined;

  if (batchName === 'all') {
    // 全バッチ実行
    for (const name of Object.keys(BATCH_ENDPOINTS) as BatchName[]) {
      await runBatch(name, { dryRun, month });
    }
  } else if (batchName in BATCH_ENDPOINTS) {
    await runBatch(batchName as BatchName, { dryRun, month });
  } else {
    console.error(`不明なバッチ名: ${batchName}`);
    console.error('--help で使用方法を確認してください');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});
