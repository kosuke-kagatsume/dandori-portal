/**
 * DW管理画面のデモデータ初期化
 *
 * 全テナントに対して：
 * - 過去6ヶ月分の請求書を生成
 * - リマインダーを生成
 * - 通知履歴を生成
 */

import { useAdminTenantStore } from '@/lib/store/admin-tenant-store';
import { useInvoiceStore } from '@/lib/store/invoice-store';
import { useInvoiceAutoGenerationStore } from '@/lib/store/invoice-auto-generation-store';
import { usePaymentReminderStore } from '@/lib/store/payment-reminder-store';
import { useNotificationHistoryStore } from '@/lib/store/notification-history-store';
import { generateInvoice } from '@/lib/billing/invoice-generator';

/**
 * DW管理画面のデモデータを初期化
 */
export function initializeDWAdminDemo() {
  console.log('🚀 DW管理画面のデモデータ初期化を開始...');

  const tenantStore = useAdminTenantStore.getState();
  const invoiceStore = useInvoiceStore.getState();
  const autoGenStore = useInvoiceAutoGenerationStore.getState();
  const reminderStore = usePaymentReminderStore.getState();
  const notificationStore = useNotificationHistoryStore.getState();

  // 1. テナントデータを初期化
  console.log('📋 テナントデータを初期化...');
  tenantStore.initializeTenants();
  const tenants = tenantStore.tenants;
  console.log(`✅ ${tenants.length}件のテナントを初期化しました`);

  // 2. 既存の請求書をクリア
  console.log('🗑️  既存の請求書をクリア...');
  const existingInvoices = invoiceStore.getAllInvoices();
  existingInvoices.forEach((inv) => {
    invoiceStore.deleteInvoice(inv.id);
  });

  // 3. 全テナントに対して過去6ヶ月分の請求書を生成
  console.log('📄 請求書を生成中...');
  const today = new Date();
  let totalInvoicesGenerated = 0;

  tenants.forEach((tenant) => {
    // トライアル中のテナントと停止中のテナントはスキップ
    if (tenant.settings.status === 'trial' || tenant.settings.status === 'suspended') {
      console.log(`  ⏭️  ${tenant.name}: スキップ（ステータス: ${tenant.settings.status}）`);
      return;
    }

    console.log(`  📝 ${tenant.name}: 請求書生成中...`);

    for (let i = 0; i < 6; i++) {
      const billingMonth = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = billingMonth.getFullYear();
      const month = billingMonth.getMonth() + 1;

      const existingInvoices = invoiceStore.getAllInvoices();

      const invoice = generateInvoice({
        tenantId: tenant.id,
        tenantName: tenant.name,
        billingMonth,
        userCount: tenant.currentUsers,
        existingInvoices: existingInvoices,
        billingEmail: tenant.billingEmail,
        memo: i === 0 ? `${tenant.plan.toUpperCase()}プラン - 最新請求書` : undefined,
      });

      // ステータスを設定
      let status: 'draft' | 'sent' | 'paid' = 'draft';
      let sentDate: Date | undefined;
      let paidDate: Date | undefined;
      let paymentMethod: 'bank_transfer' | 'credit_card' | undefined;

      if (i >= 3) {
        // 3ヶ月以上前は支払済み
        status = 'paid';
        sentDate = new Date(year, month - 1, 5);
        paidDate = new Date(year, month - 1, 20);
        paymentMethod = Math.random() > 0.5 ? 'bank_transfer' : 'credit_card';
      } else if (i === 2) {
        // 2ヶ月前は送信済み（一部のテナントは未払い）
        if (tenant.unpaidInvoices > 0) {
          status = 'sent';
          sentDate = new Date(year, month - 1, 5);
        } else {
          status = 'paid';
          sentDate = new Date(year, month - 1, 5);
          paidDate = new Date(year, month - 1, 18);
          paymentMethod = 'bank_transfer';
        }
      } else if (i === 1) {
        // 1ヶ月前は送信済み
        status = 'sent';
        sentDate = new Date(year, month - 1, 5);
      }
      // 当月は下書き

      const createdInvoice = invoiceStore.createInvoice({
        ...invoice,
        status,
        sentDate,
        paidDate,
        paymentMethod,
      });

      totalInvoicesGenerated++;

      // 送信済みの請求書には通知履歴を追加
      if (sentDate) {
        notificationStore.createNotification({
          type: 'invoice_sent',
          tenantId: tenant.id,
          tenantName: tenant.name,
          recipientEmail: tenant.billingEmail,
          subject: `【請求書発行】${billingMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}分`,
          body: `${tenant.name}様\n\n${billingMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}分の請求書（${invoice.invoiceNumber}）を発行いたしました。`,
          metadata: {
            invoiceId: createdInvoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.total,
          },
          status: 'sent',
          sentAt: sentDate,
        });
      }

      // 支払済みの請求書には入金確認通知を追加
      if (paidDate) {
        notificationStore.createNotification({
          type: 'payment_received',
          tenantId: tenant.id,
          tenantName: tenant.name,
          recipientEmail: tenant.billingEmail,
          subject: `【入金確認】${billingMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}分`,
          body: `${tenant.name}様\n\nご入金を確認いたしました。誠にありがとうございました。`,
          metadata: {
            invoiceId: createdInvoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.total,
            paidDate: paidDate.toISOString(),
          },
          status: 'sent',
          sentAt: paidDate,
        });
      }
    }
  });

  console.log(`✅ ${totalInvoicesGenerated}件の請求書を生成しました`);

  // 4. リマインダー履歴を生成（未払い請求書に対して）
  console.log('🔔 リマインダー履歴を生成中...');
  const unpaidInvoices = invoiceStore.getInvoicesByStatus('sent');
  let reminderCount = 0;

  unpaidInvoices.forEach((invoice) => {
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // 期限3日前のリマインダー
    if (daysUntilDue <= 3 && daysUntilDue > 0) {
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - 3);

      reminderStore.addHistory({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        tenantId: invoice.tenantId,
        tenantName: invoice.tenantName,
        dueDate: dueDate,
        reminderType: 'before_due',
        daysFromDue: -3,
      });

      // 通知履歴にも追加
      notificationStore.createNotification({
        type: 'payment_reminder',
        tenantId: invoice.tenantId,
        tenantName: invoice.tenantName,
        recipientEmail: invoice.billingEmail,
        subject: `【支払期限リマインダー】請求書 ${invoice.invoiceNumber}`,
        body: `${invoice.tenantName}様\n\n請求書の支払期限が3日後に迫っております。\n\n請求書番号: ${invoice.invoiceNumber}\n支払期限: ${dueDate.toLocaleDateString('ja-JP')}\n金額: ¥${invoice.total.toLocaleString()}`,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          dueDate: dueDate.toISOString(),
          daysUntilDue: 3,
        },
        status: 'sent',
        sentAt: reminderDate,
      });

      reminderCount++;
    }
  });

  console.log(`✅ ${reminderCount}件のリマインダーを生成しました`);

  // 5. 自動生成履歴を追加（過去の実行記録）
  console.log('📊 自動生成履歴を追加中...');

  // 先月の自動生成履歴
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthTenants = tenants.filter(t => t.settings.status === 'active');

  autoGenStore.addHistory({
    executionType: 'auto',
    tenantCount: lastMonthTenants.length,
    successCount: lastMonthTenants.length,
    failureCount: 0,
    totalAmount: lastMonthTenants.reduce((sum, t) => sum + t.monthlyRevenue, 0),
    details: lastMonthTenants.map(t => ({
      tenantId: t.id,
      tenantName: t.name,
      invoiceId: `invoice_auto_${t.id}`,
      invoiceNumber: `INV-${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-001`,
      amount: t.monthlyRevenue,
      userCount: t.currentUsers,
      status: 'success',
    })),
  });

  console.log('✅ 自動生成履歴を追加しました');

  // 6. 統計情報を表示
  console.log('\n📈 デモデータ統計:');
  console.log(`  - テナント数: ${tenants.length}件`);
  console.log(`  - 請求書数: ${invoiceStore.getAllInvoices().length}件`);
  console.log(`  - 通知履歴: ${notificationStore.getStats().totalSent}件`);
  console.log(`  - リマインダー: ${reminderStore.getStats().totalReminders}件`);

  const invoiceStats = invoiceStore.getStats();
  console.log(`  - 未払い金額: ¥${invoiceStats.unpaidAmount.toLocaleString()}`);
  console.log(`  - 支払済み金額: ¥${invoiceStats.paidAmount.toLocaleString()}`);

  console.log('\n✨ DW管理画面のデモデータ初期化が完了しました！');

  return {
    tenants: tenants.length,
    invoices: invoiceStore.getAllInvoices().length,
    notifications: notificationStore.getStats().totalSent,
    reminders: reminderStore.getStats().totalReminders,
  };
}
