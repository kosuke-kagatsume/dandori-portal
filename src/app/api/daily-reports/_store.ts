// 日報インメモリストレージ（全ルートで共有）
// Phase 2 で Prisma に移行予定

export interface StoredReport {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  templateId: string;
  templateName?: string;
  status: string;
  values: Array<{
    fieldId: string;
    value: string | string[] | number | null;
  }>;
  submittedAt: string | null;
  targetApproverId: string | null;
  targetApproverName: string | null;
  approverId: string | null;
  approverName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// globalThis にキャッシュして Hot Reload でもインスタンスを維持
const globalForReports = globalThis as unknown as {
  __dailyReportStore?: Map<string, StoredReport[]>;
};

export const reportsByTenant: Map<string, StoredReport[]> =
  globalForReports.__dailyReportStore ?? new Map<string, StoredReport[]>();

globalForReports.__dailyReportStore = reportsByTenant;

export function getReportsForTenant(tenantId: string): StoredReport[] {
  if (!reportsByTenant.has(tenantId)) {
    reportsByTenant.set(tenantId, []);
  }
  return reportsByTenant.get(tenantId)!;
}
