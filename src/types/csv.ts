/**
 * CSV出力用の型定義
 */

// 勤怠記録
export interface AttendanceRecord {
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD形式
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalBreakMinutes: number;
  workMinutes: number;
  overtimeMinutes: number;
  workLocation?: 'office' | 'home' | 'client' | 'other';
  status?: 'present' | 'absent' | 'holiday' | 'leave' | 'late' | 'early';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  memo?: string;
}

// 給与記録
export interface PayrollRecord {
  employeeId: string;
  employeeName: string;
  department: string;
  period: string; // YYYY-MM形式
  basicSalary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  status: 'draft' | 'approved' | 'paid';
  paymentDate?: string;
}

// 賞与記録
export interface BonusRecord {
  employeeId: string;
  employeeName: string;
  department: string;
  period: string; // YYYY-MM形式
  bonusType: 'summer' | 'winter' | 'special';
  basicBonus: number;
  performanceBonus: number;
  performanceRating: 'S' | 'A' | 'B' | 'C' | 'D';
  deductions: Record<string, number>;
  totalDeductions: number;
  netBonus: number;
  status: 'draft' | 'approved' | 'paid';
  paymentDate?: string;
}

// CSV出力結果
export interface CSVExportResult {
  success: boolean;
  error?: string;
  recordCount?: number;
}
