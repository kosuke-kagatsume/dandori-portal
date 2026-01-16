/**
 * CSVインポートユーティリティ
 * 従業員・勤怠・休暇データのインポート機能
 */

export interface CSVImportResult<T = Record<string, unknown>> {
  success: boolean;
  data: T[];
  errors: CSVImportError[];
  warnings: string[];
  totalRows: number;
  successRows: number;
  errorRows: number;
}

export interface CSVImportError {
  row: number;
  column?: string;
  message: string;
  value?: string;
}

export interface CSVImportOptions {
  maxRows?: number;
  skipHeader?: boolean;
  validateRow?: (row: Record<string, string>, rowIndex: number) => string | null;
}

// ===== CSV解析 =====

/**
 * CSVテキストを解析
 */
export function parseCSV(
  csvText: string,
  options: CSVImportOptions = {}
): { headers: string[]; rows: string[][] } {
  const { skipHeader = true } = options;

  // BOM削除
  const text = csvText.replace(/^\uFEFF/, '');

  // 改行で分割
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // ヘッダー行を解析
  const headers = parseCSVLine(lines[0]);

  // データ行を解析
  const dataLines = skipHeader ? lines.slice(1) : lines;
  const rows = dataLines.map(line => parseCSVLine(line));

  return { headers, rows };
}

/**
 * CSV行を解析（カンマ区切り、ダブルクォート対応）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // エスケープされたダブルクォート
        current += '"';
        i++;
      } else if (char === '"') {
        // クォート終了
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        // クォート開始
        inQuotes = true;
      } else if (char === ',') {
        // フィールド区切り
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  // 最後のフィールドを追加
  result.push(current.trim());

  return result;
}

// ===== 従業員データインポート =====

export interface EmployeeImportRow {
  employeeNumber: string;
  lastName: string;
  firstName: string;
  lastNameKana?: string;
  firstNameKana?: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  hireDate: string;
  birthDate?: string;
  gender?: string;
  employmentType?: string;
}

const EMPLOYEE_HEADERS = {
  '従業員番号': 'employeeNumber',
  '姓': 'lastName',
  '名': 'firstName',
  '姓（カナ）': 'lastNameKana',
  '名（カナ）': 'firstNameKana',
  'メールアドレス': 'email',
  '電話番号': 'phone',
  '部署': 'department',
  '役職': 'position',
  '入社日': 'hireDate',
  '生年月日': 'birthDate',
  '性別': 'gender',
  '雇用形態': 'employmentType',
};

export function importEmployees(
  csvText: string,
  options: CSVImportOptions = {}
): CSVImportResult<EmployeeImportRow> {
  const { maxRows = 3000 } = options;
  const { headers, rows } = parseCSV(csvText, options);

  const errors: CSVImportError[] = [];
  const warnings: string[] = [];
  const data: EmployeeImportRow[] = [];

  // ヘッダーのマッピング
  const headerMap = new Map<number, string>();
  headers.forEach((header, index) => {
    const fieldName = EMPLOYEE_HEADERS[header as keyof typeof EMPLOYEE_HEADERS];
    if (fieldName) {
      headerMap.set(index, fieldName);
    }
  });

  // 必須ヘッダーチェック
  const requiredFields = ['employeeNumber', 'lastName', 'firstName', 'email', 'hireDate'];
  const mappedFields = Array.from(headerMap.values());
  const missingFields = requiredFields.filter(f => !mappedFields.includes(f));

  if (missingFields.length > 0) {
    errors.push({
      row: 0,
      message: `必須列が見つかりません: ${missingFields.join(', ')}`,
    });
    return {
      success: false,
      data: [],
      errors,
      warnings,
      totalRows: rows.length,
      successRows: 0,
      errorRows: rows.length,
    };
  }

  // 行数チェック
  if (rows.length > maxRows) {
    warnings.push(`最大${maxRows}行までインポートできます。${rows.length - maxRows}行がスキップされます。`);
  }

  // データ行を処理
  const processRows = rows.slice(0, maxRows);

  processRows.forEach((row, rowIndex) => {
    const rowData: Record<string, string> = {};

    headerMap.forEach((fieldName, colIndex) => {
      rowData[fieldName] = row[colIndex] || '';
    });

    // バリデーション
    const rowErrors: string[] = [];

    if (!rowData.employeeNumber) {
      rowErrors.push('従業員番号は必須です');
    }
    if (!rowData.lastName || !rowData.firstName) {
      rowErrors.push('姓名は必須です');
    }
    if (!rowData.email) {
      rowErrors.push('メールアドレスは必須です');
    } else if (!isValidEmail(rowData.email)) {
      rowErrors.push('メールアドレスの形式が不正です');
    }
    if (!rowData.hireDate) {
      rowErrors.push('入社日は必須です');
    } else if (!isValidDate(rowData.hireDate)) {
      rowErrors.push('入社日の形式が不正です（YYYY-MM-DD）');
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: rowIndex + 2, // ヘッダー行 + 0始まりインデックス
        message: rowErrors.join(', '),
      });
    } else {
      data.push(rowData as unknown as EmployeeImportRow);
    }
  });

  return {
    success: errors.length === 0,
    data,
    errors,
    warnings,
    totalRows: rows.length,
    successRows: data.length,
    errorRows: errors.length,
  };
}

// ===== 日次勤怠データインポート =====

export interface AttendanceImportRow {
  employeeNumber: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  workLocation?: string;
  memo?: string;
}

const ATTENDANCE_HEADERS = {
  '従業員番号': 'employeeNumber',
  '日付': 'date',
  '出勤時刻': 'checkIn',
  '退勤時刻': 'checkOut',
  '休憩開始': 'breakStart',
  '休憩終了': 'breakEnd',
  '勤務場所': 'workLocation',
  '備考': 'memo',
};

export function importAttendance(
  csvText: string,
  options: CSVImportOptions = {}
): CSVImportResult<AttendanceImportRow> {
  const { maxRows = 50000 } = options;
  const { headers, rows } = parseCSV(csvText, options);

  const errors: CSVImportError[] = [];
  const warnings: string[] = [];
  const data: AttendanceImportRow[] = [];

  // ヘッダーのマッピング
  const headerMap = new Map<number, string>();
  headers.forEach((header, index) => {
    const fieldName = ATTENDANCE_HEADERS[header as keyof typeof ATTENDANCE_HEADERS];
    if (fieldName) {
      headerMap.set(index, fieldName);
    }
  });

  // 必須ヘッダーチェック
  const requiredFields = ['employeeNumber', 'date'];
  const mappedFields = Array.from(headerMap.values());
  const missingFields = requiredFields.filter(f => !mappedFields.includes(f));

  if (missingFields.length > 0) {
    errors.push({
      row: 0,
      message: `必須列が見つかりません: ${missingFields.join(', ')}`,
    });
    return {
      success: false,
      data: [],
      errors,
      warnings,
      totalRows: rows.length,
      successRows: 0,
      errorRows: rows.length,
    };
  }

  // 行数チェック
  if (rows.length > maxRows) {
    warnings.push(`最大${maxRows}行までインポートできます。${rows.length - maxRows}行がスキップされます。`);
  }

  // データ行を処理
  const processRows = rows.slice(0, maxRows);

  processRows.forEach((row, rowIndex) => {
    const rowData: Record<string, string> = {};

    headerMap.forEach((fieldName, colIndex) => {
      rowData[fieldName] = row[colIndex] || '';
    });

    // バリデーション
    const rowErrors: string[] = [];

    if (!rowData.employeeNumber) {
      rowErrors.push('従業員番号は必須です');
    }
    if (!rowData.date) {
      rowErrors.push('日付は必須です');
    } else if (!isValidDate(rowData.date)) {
      rowErrors.push('日付の形式が不正です（YYYY-MM-DD）');
    }
    if (rowData.checkIn && !isValidTime(rowData.checkIn)) {
      rowErrors.push('出勤時刻の形式が不正です（HH:mm）');
    }
    if (rowData.checkOut && !isValidTime(rowData.checkOut)) {
      rowErrors.push('退勤時刻の形式が不正です（HH:mm）');
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: rowIndex + 2,
        message: rowErrors.join(', '),
      });
    } else {
      data.push(rowData as unknown as AttendanceImportRow);
    }
  });

  return {
    success: errors.length === 0,
    data,
    errors,
    warnings,
    totalRows: rows.length,
    successRows: data.length,
    errorRows: errors.length,
  };
}

// ===== 休暇利用実績データインポート =====

export interface LeaveUsageImportRow {
  employeeNumber: string;
  date: string;
  leaveType: string;
  usageType: 'full' | 'am' | 'pm' | 'hourly';
  hours?: number;
  reason?: string;
}

const LEAVE_USAGE_HEADERS = {
  '従業員番号': 'employeeNumber',
  '日付': 'date',
  '休暇種別': 'leaveType',
  '取得区分': 'usageType',
  '時間数': 'hours',
  '理由': 'reason',
};

export function importLeaveUsage(
  csvText: string,
  options: CSVImportOptions = {}
): CSVImportResult<LeaveUsageImportRow> {
  const { maxRows = 1200 } = options;
  const { headers, rows } = parseCSV(csvText, options);

  const errors: CSVImportError[] = [];
  const warnings: string[] = [];
  const data: LeaveUsageImportRow[] = [];

  // ヘッダーのマッピング
  const headerMap = new Map<number, string>();
  headers.forEach((header, index) => {
    const fieldName = LEAVE_USAGE_HEADERS[header as keyof typeof LEAVE_USAGE_HEADERS];
    if (fieldName) {
      headerMap.set(index, fieldName);
    }
  });

  // 必須ヘッダーチェック
  const requiredFields = ['employeeNumber', 'date', 'leaveType', 'usageType'];
  const mappedFields = Array.from(headerMap.values());
  const missingFields = requiredFields.filter(f => !mappedFields.includes(f));

  if (missingFields.length > 0) {
    errors.push({
      row: 0,
      message: `必須列が見つかりません: ${missingFields.join(', ')}`,
    });
    return {
      success: false,
      data: [],
      errors,
      warnings,
      totalRows: rows.length,
      successRows: 0,
      errorRows: rows.length,
    };
  }

  // 行数チェック
  if (rows.length > maxRows) {
    warnings.push(`最大${maxRows}行までインポートできます。${rows.length - maxRows}行がスキップされます。`);
  }

  // 取得区分のマッピング
  const usageTypeMap: Record<string, 'full' | 'am' | 'pm' | 'hourly'> = {
    '全休': 'full',
    '午前休': 'am',
    '午後休': 'pm',
    '時間休': 'hourly',
  };

  // データ行を処理
  const processRows = rows.slice(0, maxRows);

  processRows.forEach((row, rowIndex) => {
    const rowData: Record<string, string> = {};

    headerMap.forEach((fieldName, colIndex) => {
      rowData[fieldName] = row[colIndex] || '';
    });

    // バリデーション
    const rowErrors: string[] = [];

    if (!rowData.employeeNumber) {
      rowErrors.push('従業員番号は必須です');
    }
    if (!rowData.date) {
      rowErrors.push('日付は必須です');
    } else if (!isValidDate(rowData.date)) {
      rowErrors.push('日付の形式が不正です（YYYY-MM-DD）');
    }
    if (!rowData.leaveType) {
      rowErrors.push('休暇種別は必須です');
    }
    if (!rowData.usageType) {
      rowErrors.push('取得区分は必須です');
    } else {
      const mappedType = usageTypeMap[rowData.usageType];
      if (!mappedType) {
        rowErrors.push('取得区分は「全休」「午前休」「午後休」「時間休」のいずれかを指定してください');
      } else {
        rowData.usageType = mappedType;
      }
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: rowIndex + 2,
        message: rowErrors.join(', '),
      });
    } else {
      data.push({
        ...rowData,
        hours: rowData.hours ? parseFloat(rowData.hours) : undefined,
      } as unknown as LeaveUsageImportRow);
    }
  });

  return {
    success: errors.length === 0,
    data,
    errors,
    warnings,
    totalRows: rows.length,
    successRows: data.length,
    errorRows: errors.length,
  };
}

// ===== 休暇付与データインポート =====

export interface LeaveGrantImportRow {
  employeeNumber: string;
  leaveType: string;
  grantDate: string;
  grantDays: number;
  expirationDate?: string;
  reason?: string;
}

const LEAVE_GRANT_HEADERS = {
  '従業員番号': 'employeeNumber',
  '休暇種別': 'leaveType',
  '付与日': 'grantDate',
  '付与日数': 'grantDays',
  '失効日': 'expirationDate',
  '理由': 'reason',
};

export function importLeaveGrant(
  csvText: string,
  options: CSVImportOptions = {}
): CSVImportResult<LeaveGrantImportRow> {
  const { maxRows = 1000 } = options;
  const { headers, rows } = parseCSV(csvText, options);

  const errors: CSVImportError[] = [];
  const warnings: string[] = [];
  const data: LeaveGrantImportRow[] = [];

  // ヘッダーのマッピング
  const headerMap = new Map<number, string>();
  headers.forEach((header, index) => {
    const fieldName = LEAVE_GRANT_HEADERS[header as keyof typeof LEAVE_GRANT_HEADERS];
    if (fieldName) {
      headerMap.set(index, fieldName);
    }
  });

  // 必須ヘッダーチェック
  const requiredFields = ['employeeNumber', 'leaveType', 'grantDate', 'grantDays'];
  const mappedFields = Array.from(headerMap.values());
  const missingFields = requiredFields.filter(f => !mappedFields.includes(f));

  if (missingFields.length > 0) {
    errors.push({
      row: 0,
      message: `必須列が見つかりません: ${missingFields.join(', ')}`,
    });
    return {
      success: false,
      data: [],
      errors,
      warnings,
      totalRows: rows.length,
      successRows: 0,
      errorRows: rows.length,
    };
  }

  // 行数チェック
  if (rows.length > maxRows) {
    warnings.push(`最大${maxRows}行までインポートできます。${rows.length - maxRows}行がスキップされます。`);
  }

  // データ行を処理
  const processRows = rows.slice(0, maxRows);

  processRows.forEach((row, rowIndex) => {
    const rowData: Record<string, string> = {};

    headerMap.forEach((fieldName, colIndex) => {
      rowData[fieldName] = row[colIndex] || '';
    });

    // バリデーション
    const rowErrors: string[] = [];

    if (!rowData.employeeNumber) {
      rowErrors.push('従業員番号は必須です');
    }
    if (!rowData.leaveType) {
      rowErrors.push('休暇種別は必須です');
    }
    if (!rowData.grantDate) {
      rowErrors.push('付与日は必須です');
    } else if (!isValidDate(rowData.grantDate)) {
      rowErrors.push('付与日の形式が不正です（YYYY-MM-DD）');
    }
    if (!rowData.grantDays) {
      rowErrors.push('付与日数は必須です');
    } else if (isNaN(parseFloat(rowData.grantDays))) {
      rowErrors.push('付与日数は数値で指定してください');
    }
    if (rowData.expirationDate && !isValidDate(rowData.expirationDate)) {
      rowErrors.push('失効日の形式が不正です（YYYY-MM-DD）');
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: rowIndex + 2,
        message: rowErrors.join(', '),
      });
    } else {
      data.push({
        ...rowData,
        grantDays: parseFloat(rowData.grantDays),
      } as unknown as LeaveGrantImportRow);
    }
  });

  return {
    success: errors.length === 0,
    data,
    errors,
    warnings,
    totalRows: rows.length,
    successRows: data.length,
    errorRows: errors.length,
  };
}

// ===== 従業員異動予約データインポート =====

export interface TransferReservationImportRow {
  employeeNumber: string;
  effectiveDate: string;
  newDepartment?: string;
  newPosition?: string;
  newEmploymentType?: string;
  newWorkLocation?: string;
  reason?: string;
}

const TRANSFER_RESERVATION_HEADERS = {
  '従業員番号': 'employeeNumber',
  '異動日': 'effectiveDate',
  '異動先部署': 'newDepartment',
  '新役職': 'newPosition',
  '新雇用形態': 'newEmploymentType',
  '新勤務地': 'newWorkLocation',
  '異動理由': 'reason',
};

export function importTransferReservation(
  csvText: string,
  options: CSVImportOptions = {}
): CSVImportResult<TransferReservationImportRow> {
  const { maxRows = 3000 } = options;
  const { headers, rows } = parseCSV(csvText, options);

  const errors: CSVImportError[] = [];
  const warnings: string[] = [];
  const data: TransferReservationImportRow[] = [];

  // ヘッダーのマッピング
  const headerMap = new Map<number, string>();
  headers.forEach((header, index) => {
    const fieldName = TRANSFER_RESERVATION_HEADERS[header as keyof typeof TRANSFER_RESERVATION_HEADERS];
    if (fieldName) {
      headerMap.set(index, fieldName);
    }
  });

  // 必須ヘッダーチェック
  const requiredFields = ['employeeNumber', 'effectiveDate'];
  const mappedFields = Array.from(headerMap.values());
  const missingFields = requiredFields.filter(f => !mappedFields.includes(f));

  if (missingFields.length > 0) {
    errors.push({
      row: 0,
      message: `必須列が見つかりません: ${missingFields.join(', ')}`,
    });
    return {
      success: false,
      data: [],
      errors,
      warnings,
      totalRows: rows.length,
      successRows: 0,
      errorRows: rows.length,
    };
  }

  // 行数チェック
  if (rows.length > maxRows) {
    warnings.push(`最大${maxRows}行までインポートできます。${rows.length - maxRows}行がスキップされます。`);
  }

  // データ行を処理
  const processRows = rows.slice(0, maxRows);

  processRows.forEach((row, rowIndex) => {
    const rowData: Record<string, string> = {};

    headerMap.forEach((fieldName, colIndex) => {
      rowData[fieldName] = row[colIndex] || '';
    });

    // バリデーション
    const rowErrors: string[] = [];

    if (!rowData.employeeNumber) {
      rowErrors.push('従業員番号は必須です');
    }
    if (!rowData.effectiveDate) {
      rowErrors.push('異動日は必須です');
    } else if (!isValidDate(rowData.effectiveDate)) {
      rowErrors.push('異動日の形式が不正です（YYYY-MM-DD）');
    } else {
      // 異動日が過去でないかチェック
      const effectiveDate = new Date(rowData.effectiveDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (effectiveDate < today) {
        rowErrors.push('異動日は本日以降の日付を指定してください');
      }
    }

    // 少なくとも1つの異動項目が必要
    if (!rowData.newDepartment && !rowData.newPosition && !rowData.newEmploymentType && !rowData.newWorkLocation) {
      rowErrors.push('異動先部署、新役職、新雇用形態、新勤務地のいずれかを指定してください');
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: rowIndex + 2,
        message: rowErrors.join(', '),
      });
    } else {
      data.push(rowData as unknown as TransferReservationImportRow);
    }
  });

  return {
    success: errors.length === 0,
    data,
    errors,
    warnings,
    totalRows: rows.length,
    successRows: data.length,
    errorRows: errors.length,
  };
}

// ===== バリデーションヘルパー =====

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(date: string): boolean {
  // YYYY-MM-DD形式をチェック
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }
  const d = new Date(date);
  return !isNaN(d.getTime());
}

function isValidTime(time: string): boolean {
  // HH:mm形式をチェック
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

// ===== テンプレート生成 =====

export function generateEmployeeTemplate(): string {
  const headers = Object.keys(EMPLOYEE_HEADERS);
  return headers.join(',') + '\n';
}

export function generateAttendanceTemplate(): string {
  const headers = Object.keys(ATTENDANCE_HEADERS);
  return headers.join(',') + '\n';
}

export function generateLeaveUsageTemplate(): string {
  const headers = Object.keys(LEAVE_USAGE_HEADERS);
  return headers.join(',') + '\n';
}

export function generateLeaveGrantTemplate(): string {
  const headers = Object.keys(LEAVE_GRANT_HEADERS);
  return headers.join(',') + '\n';
}

export function generateTransferReservationTemplate(): string {
  const headers = Object.keys(TRANSFER_RESERVATION_HEADERS);
  return headers.join(',') + '\n';
}

/**
 * テンプレートをダウンロード
 */
export function downloadTemplate(template: string, filename: string): void {
  const bom = '\uFEFF';
  const blob = new Blob([bom + template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
