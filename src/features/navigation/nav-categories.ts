import type { MenuKey } from '@/lib/rbac';

export type NavCategoryKey = 'hrLabor' | 'approvals' | 'healthCerts' | 'orgAdmin' | 'operations';

export interface NavCategory {
  key: NavCategoryKey;
  labelKey: string;        // i18nキー: navigation.categories.{labelKey}
  items: MenuKey[];
}

export const NAV_CATEGORIES: NavCategory[] = [
  { key: 'hrLabor',     labelKey: 'hrLabor',     items: ['users', 'members', 'attendance', 'dailyReport', 'leave', 'payroll', 'evaluation'] },
  { key: 'approvals',   labelKey: 'approvals',   items: ['workflow', 'onboarding'] },
  { key: 'healthCerts', labelKey: 'healthCerts',  items: ['health', 'certifications'] },
  { key: 'orgAdmin',    labelKey: 'orgAdmin',     items: ['organization', 'scheduledChanges', 'assets', 'saas'] },
  { key: 'operations',  labelKey: 'operations',   items: ['announcements', 'announcementsAdmin', 'legalUpdates', 'audit', 'settings'] },
];

export const UNGROUPED_ITEMS: MenuKey[] = ['dashboard'];
