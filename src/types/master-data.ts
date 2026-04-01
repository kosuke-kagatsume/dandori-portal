/**
 * マスタデータ共通型定義
 *
 * departments, positions, employment-types, work-rules の
 * セレクトボックス等で使う共通型。
 * 各コンポーネントで個別定義されていたものを集約。
 */

export interface MasterDepartment {
  id: string;
  name: string;
}

export interface MasterPosition {
  id: string;
  name: string;
}

export interface MasterEmploymentType {
  id: string;
  name: string;
}

export interface MasterWorkRule {
  id: string;
  name: string;
  type?: string;
}

/** fetchAllMasterData の戻り値 */
export interface AllMasterData {
  departments: MasterDepartment[];
  positions: MasterPosition[];
  employmentTypes: MasterEmploymentType[];
  workRules: MasterWorkRule[];
}
