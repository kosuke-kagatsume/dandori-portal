// CSV出力ユーティリティ

// CSVエスケープ処理
const escapeCSV = (value: any): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // カンマ、改行、ダブルクォートを含む場合はダブルクォートで囲む
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// CSV文字列を生成
const generateCSVString = (headers: string[], rows: string[][]): string => {
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = rows.map(row => row.map(escapeCSV).join(',')).join('\n');
  return `${headerRow}\n${dataRows}`;
};

// CSVファイルをダウンロード
const downloadCSV = (csvString: string, filename: string) => {
  // BOM付きUTF-8に変換（Excel対応）
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 勤怠データをCSV出力
export const exportAttendanceToCSV = (records: any[], filename?: string) => {
  const headers = [
    '従業員ID',
    '従業員名',
    '日付',
    '出勤時刻',
    '退勤時刻',
    '休憩開始',
    '休憩終了',
    '休憩時間(分)',
    '勤務時間(分)',
    '残業時間(分)',
    '勤務場所',
    'ステータス',
    '承認状況',
    'メモ',
  ];

  const rows = records.map(record => [
    record.userId || '',
    record.userName || '',
    record.date || '',
    record.checkIn || '',
    record.checkOut || '',
    record.breakStart || '',
    record.breakEnd || '',
    record.totalBreakMinutes || 0,
    record.workMinutes || 0,
    record.overtimeMinutes || 0,
    getWorkLocationLabel(record.workLocation),
    getStatusLabel(record.status),
    getApprovalStatusLabel(record.approvalStatus),
    record.memo || '',
  ]);

  const csvString = generateCSVString(headers, rows);
  const defaultFilename = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvString, filename || defaultFilename);
};

// 給与データをCSV出力
export const exportPayrollToCSV = (calculations: any[], filename?: string) => {
  const headers = [
    '従業員ID',
    '従業員名',
    '部署',
    '支給年月',
    '基本給',
    '役職手当',
    '資格手当',
    '住宅手当',
    '家族手当',
    '通勤手当',
    '残業手当',
    '深夜手当',
    '休日手当',
    '手当合計',
    '総支給額',
    '健康保険',
    '厚生年金',
    '雇用保険',
    '所得税',
    '住民税',
    '控除合計',
    '差引支給額',
    '勤務日数',
    '総労働時間',
  ];

  const rows = calculations.map(calc => [
    calc.employeeId || '',
    calc.employeeName || '',
    calc.department || '',
    calc.period || '',
    calc.basicSalary || 0,
    calc.positionAllowance || 0,
    calc.skillAllowance || 0,
    calc.housingAllowance || 0,
    calc.familyAllowance || 0,
    calc.commutingAllowance || 0,
    calc.overtimePay || 0,
    calc.lateNightPay || 0,
    calc.holidayPay || 0,
    calc.totalAllowances || 0,
    calc.grossSalary || 0,
    calc.healthInsurance || 0,
    calc.pension || 0,
    calc.employmentInsurance || 0,
    calc.incomeTax || 0,
    calc.residentTax || 0,
    calc.totalDeductions || 0,
    calc.netSalary || 0,
    calc.workDays || 0,
    calc.totalWorkHours || 0,
  ]);

  const csvString = generateCSVString(headers, rows);
  const defaultFilename = `payroll_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvString, filename || defaultFilename);
};

// 賞与データをCSV出力
export const exportBonusToCSV = (bonuses: any[], filename?: string) => {
  const headers = [
    '従業員ID',
    '従業員名',
    '部署',
    '役職',
    '支給年月',
    '賞与種別',
    '基本賞与',
    '役職賞与',
    '査定賞与',
    '特別手当',
    '総支給額',
    '健康保険',
    '厚生年金',
    '雇用保険',
    '所得税',
    '住民税',
    '控除合計',
    '差引支給額',
    '査定評価',
    '査定スコア',
    'ステータス',
  ];

  const rows = bonuses.map(bonus => [
    bonus.employeeId || '',
    bonus.employeeName || '',
    bonus.department || '',
    bonus.position || '',
    bonus.period || '',
    getBonusTypeLabel(bonus.bonusType),
    bonus.basicBonus || 0,
    bonus.positionBonus || 0,
    bonus.performanceBonus || 0,
    bonus.specialAllowance || 0,
    bonus.totalGrossBonus || 0,
    bonus.healthInsurance || 0,
    bonus.pension || 0,
    bonus.employmentInsurance || 0,
    bonus.incomeTax || 0,
    bonus.residentTax || 0,
    bonus.totalDeductions || 0,
    bonus.netBonus || 0,
    bonus.performanceRating || '',
    bonus.performanceScore || 0,
    getStatusLabel(bonus.status),
  ]);

  const csvString = generateCSVString(headers, rows);
  const defaultFilename = `bonus_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvString, filename || defaultFilename);
};

// ヘルパー関数
const getWorkLocationLabel = (location?: string): string => {
  const labels: { [key: string]: string } = {
    office: 'オフィス',
    home: '在宅',
    client: '客先',
    other: 'その他',
  };
  return labels[location || ''] || '';
};

const getStatusLabel = (status?: string): string => {
  const labels: { [key: string]: string } = {
    present: '出勤',
    absent: '欠勤',
    holiday: '休日',
    leave: '休暇',
    late: '遅刻',
    early: '早退',
    draft: '下書き',
    approved: '承認済み',
    paid: '支払済み',
  };
  return labels[status || ''] || '';
};

const getApprovalStatusLabel = (status?: string): string => {
  const labels: { [key: string]: string } = {
    pending: '承認待ち',
    approved: '承認済み',
    rejected: '却下',
  };
  return labels[status || ''] || '';
};

const getBonusTypeLabel = (type?: string): string => {
  const labels: { [key: string]: string } = {
    summer: '夏季賞与',
    winter: '冬季賞与',
    special: '特別賞与',
  };
  return labels[type || ''] || '';
};
