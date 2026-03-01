// 日報テンプレート インメモリストレージ（全ルートで共有）
// Phase 2 で Prisma に移行予定

export interface StoredTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  departmentIds: string[];
  submissionRule: string;
  reminderHours: number;
  approvalRequired: boolean;
  approverType: 'direct_manager' | 'specific_person';
  approverIds: string[];
  isActive: boolean;
  fields: Array<{
    id: string;
    label: string;
    fieldType: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
    order: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

// globalThis にキャッシュして Hot Reload でもインスタンスを維持
const globalForTemplates = globalThis as unknown as {
  __dailyReportTemplateStore?: Map<string, StoredTemplate[]>;
};

export const templatesByTenant: Map<string, StoredTemplate[]> =
  globalForTemplates.__dailyReportTemplateStore ?? new Map<string, StoredTemplate[]>();

globalForTemplates.__dailyReportTemplateStore = templatesByTenant;

export function getTemplatesForTenant(tenantId: string): StoredTemplate[] {
  if (!templatesByTenant.has(tenantId)) {
    templatesByTenant.set(tenantId, []);
  }
  return templatesByTenant.get(tenantId)!;
}
