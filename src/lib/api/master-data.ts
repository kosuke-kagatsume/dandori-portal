/**
 * マスタデータ API クライアント
 *
 * departments, positions, employment-types, work-rules の
 * 取得を一元管理。複数コンポーネントからの重複fetchを解消。
 */

import { apiGet } from './fetch-helper';
import type {
  MasterDepartment,
  MasterPosition,
  MasterEmploymentType,
  MasterWorkRule,
  AllMasterData,
} from '@/types/master-data';

// ── 個別取得 ──────────────────────────────────

export function fetchDepartments() {
  return apiGet<MasterDepartment[]>('/api/master-data/departments');
}

export function fetchPositions() {
  return apiGet<MasterPosition[]>('/api/master-data/positions');
}

export function fetchEmploymentTypes() {
  return apiGet<MasterEmploymentType[]>('/api/master-data/employment-types');
}

export function fetchWorkRules(activeOnly = true) {
  return apiGet<MasterWorkRule[]>('/api/attendance-master/work-rules', {
    activeOnly: activeOnly ? 'true' : undefined,
  });
}

// ── 一括取得（ダイアログ等で4種まとめて必要なケース用） ──

export async function fetchAllMasterData(): Promise<AllMasterData> {
  const [departments, positions, employmentTypes, workRules] = await Promise.all([
    fetchDepartments(),
    fetchPositions(),
    fetchEmploymentTypes(),
    fetchWorkRules(),
  ]);
  return { departments, positions, employmentTypes, workRules };
}
